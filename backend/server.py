from fastapi import FastAPI, APIRouter, HTTPException, Header, Depends, UploadFile, File, Query, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
import json
import re
import httpx
import asyncio
from datetime import datetime, timezone
from emergentintegrations.llm.chat import LlmChat, UserMessage


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'kndp2025')
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')
GOOGLE_PLACES_API_KEY = os.environ.get('GOOGLE_PLACES_API_KEY')
PLACES_BASE = "https://places.googleapis.com/v1"
PLACES_DETAILS_MASK = "id,displayName,formattedAddress,nationalPhoneNumber,internationalPhoneNumber,websiteUri,rating,googleMapsUri"

# --- Emergent Object Storage ---
STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
STORAGE_APP = "kndp"
MAX_UPLOAD_BYTES = 20 * 1024 * 1024  # 20MB per file
_storage_key: Optional[str] = None


async def _storage_init(force: bool = False) -> str:
    global _storage_key
    if _storage_key and not force:
        return _storage_key
    async with httpx.AsyncClient(timeout=30.0) as c:
        resp = await c.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_LLM_KEY})
        resp.raise_for_status()
        _storage_key = resp.json()["storage_key"]
    return _storage_key


async def _storage_put(path: str, data: bytes, content_type: str) -> dict:
    key = await _storage_init()
    async with httpx.AsyncClient(timeout=180.0) as c:
        url = f"{STORAGE_URL}/objects/{path}"
        headers = {"X-Storage-Key": key, "Content-Type": content_type}
        resp = await c.put(url, headers=headers, content=data)
        if resp.status_code == 404:
            key = await _storage_init(force=True)
            headers["X-Storage-Key"] = key
            resp = await c.put(url, headers=headers, content=data)
        resp.raise_for_status()
        return resp.json()


async def _storage_get(path: str) -> tuple:
    key = await _storage_init()
    async with httpx.AsyncClient(timeout=120.0) as c:
        url = f"{STORAGE_URL}/objects/{path}"
        resp = await c.get(url, headers={"X-Storage-Key": key})
        if resp.status_code == 404:
            key = await _storage_init(force=True)
            resp = await c.get(url, headers={"X-Storage-Key": key})
        resp.raise_for_status()
        return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


def _file_kind(content_type: str) -> str:
    ct = (content_type or "").lower()
    if ct.startswith("image/"):
        return "image"
    if ct.startswith("video/"):
        return "video"
    return "file"

# Categories KNDP can build for a business (Greek labels shown to the user).
IDEA_CATEGORIES = [
    "Ιστοσελίδες",
    "Web Apps",
    "Mobile Apps",
    "Έξυπνα Εργαλεία",
    "Web Tools",
    "Automations",
    "Προγράμματα",
]
# How many ideas we show inline before pushing the user to the contact form.
IDEAS_INLINE_LIMIT = 15

app = FastAPI()
api_router = APIRouter(prefix="/api")


class AdminLogin(BaseModel):
    password: str


def verify_admin(x_admin_token: Optional[str] = Header(default=None)):
    if x_admin_token != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return True


class ContactMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    phone: Optional[str] = None
    company: Optional[str] = None
    service: Optional[str] = None
    message: str
    status: str = "New"
    notes: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    contacted_at: Optional[datetime] = None


class ContactMessageCreate(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    company: Optional[str] = None
    service: Optional[str] = None
    message: str


class ContactUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None


class PlaceResult(BaseModel):
    place_id: str
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    rating: Optional[float] = None
    maps_url: Optional[str] = None


class PlaceSearchResponse(BaseModel):
    query: str
    results: List[PlaceResult]


class ProspectCreate(BaseModel):
    place_id: str
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    rating: Optional[float] = None
    maps_url: Optional[str] = None
    source_query: Optional[str] = None
    category: Optional[str] = None
    location: Optional[str] = None


class ProspectBulkCreate(BaseModel):
    prospects: List[ProspectCreate]


class ProspectBulkDelete(BaseModel):
    ids: List[str]


class ProspectTransfer(BaseModel):
    ids: List[str]


class Prospect(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    place_id: str
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    rating: Optional[float] = None
    maps_url: Optional[str] = None
    source_query: Optional[str] = None
    category: Optional[str] = None
    location: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


@api_router.get("/")
async def root():
    return {"message": "KNDP API"}


class IdeaRequest(BaseModel):
    business: str


class Idea(BaseModel):
    category: str
    title: str
    description: str = ""


def _extract_json(text: str) -> dict:
    """Best-effort extraction of a JSON object from an LLM response."""
    if not text:
        return {}
    # Strip markdown code fences if present.
    fenced = re.search(r"```(?:json)?\s*(\{.*\}|\[.*\])\s*```", text, re.DOTALL)
    if fenced:
        candidate = fenced.group(1)
    else:
        # Grab the first {...} or [...] block.
        match = re.search(r"(\{.*\}|\[.*\])", text, re.DOTALL)
        candidate = match.group(1) if match else text
    try:
        return json.loads(candidate)
    except json.JSONDecodeError:
        return {}


@api_router.post("/generate-ideas")
async def generate_ideas(req: IdeaRequest):
    business = (req.business or "").strip()
    if not business:
        raise HTTPException(status_code=400, detail="Παρακαλώ γράψε το είδος της επιχείρησής σου.")
    if len(business) > 120:
        business = business[:120]
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="Η υπηρεσία δεν είναι διαθέσιμη αυτή τη στιγμή.")

    categories_str = ", ".join(IDEA_CATEGORIES)
    system_message = (
        "Είσαι σύμβουλος ψηφιακών λύσεων για το ψηφιακό στούντιο KNDP. "
        "Ο χρήστης θα σου δώσει το είδος της επιχείρησής του και εσύ προτείνεις ΟΛΕΣ τις "
        "ψηφιακές λύσεις που θα μπορούσε να φτιάξει η KNDP ειδικά για αυτή την επιχείρηση: "
        "ιστοσελίδες, web apps, mobile apps, έξυπνα εργαλεία, web tools, automations και προγράμματα. "
        f"Χρησιμοποίησε ΜΟΝΟ αυτές τις κατηγορίες (πεδίο category): {categories_str}. "
        "Δώσε συγκεκριμένες, πρακτικές και σχετικές προτάσεις για το συγκεκριμένο είδος επιχείρησης — όχι γενικόλογες. "
        "Πρότεινε όσο το δυνατόν περισσότερες σχετικές ιδέες (ιδανικά 12 έως 20), καλύπτοντας πολλές κατηγορίες. "
        "Απάντησε ΑΠΟΚΛΕΙΣΤΙΚΑ στα Ελληνικά. "
        "ΜΗΝ αναφέρεις ποτέ τις λέξεις 'AI', 'τεχνητή νοημοσύνη' ή παρόμοια — μίλα σαν να τα φτιάχνει η ομάδα της KNDP. "
        "Επίστρεψε ΜΟΝΟ έγκυρο JSON, χωρίς επεξηγήσεις, με αυτή τη μορφή: "
        '{\"ideas\": [{\"category\": \"<μία από τις κατηγορίες>\", \"title\": \"<σύντομος τίτλος 2-5 λέξεις>\", '
        '\"description\": \"<μία σύντομη πρόταση με το όφελος>\"}]}'
    )

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"ideas-{uuid.uuid4()}",
        system_message=system_message,
    ).with_model("gemini", "gemini-3-flash-preview")

    try:
        response = await chat.send_message(
            UserMessage(text=f"Η επιχείρησή μου: {business}")
        )
    except Exception as exc:  # noqa: BLE001
        logging.getLogger(__name__).exception("LLM idea generation failed")
        raise HTTPException(status_code=502, detail="Δεν μπορέσαμε να δημιουργήσουμε ιδέες αυτή τη στιγμή. Δοκίμασε ξανά.") from exc

    data = _extract_json(response if isinstance(response, str) else str(response))
    raw_ideas = data.get("ideas") if isinstance(data, dict) else (data if isinstance(data, list) else [])
    if not isinstance(raw_ideas, list):
        raw_ideas = []

    ideas: List[dict] = []
    seen = set()
    for item in raw_ideas:
        if not isinstance(item, dict):
            continue
        title = str(item.get("title", "")).strip()
        if not title or title.lower() in seen:
            continue
        seen.add(title.lower())
        category = str(item.get("category", "")).strip()
        if category not in IDEA_CATEGORIES:
            category = IDEA_CATEGORIES[0]
        ideas.append({
            "category": category,
            "title": title,
            "description": str(item.get("description", "")).strip(),
        })

    if not ideas:
        raise HTTPException(status_code=502, detail="Δεν μπορέσαμε να δημιουργήσουμε ιδέες αυτή τη στιγμή. Δοκίμασε ξανά.")

    total = len(ideas)
    visible = ideas[:IDEAS_INLINE_LIMIT]
    has_more = total > IDEAS_INLINE_LIMIT

    return {
        "business": business,
        "ideas": visible,
        "total": total,
        "has_more": has_more,
        "limit": IDEAS_INLINE_LIMIT,
    }


@api_router.post("/contact", response_model=ContactMessage)
async def create_contact_message(input: ContactMessageCreate):
    msg = ContactMessage(**input.model_dump())
    doc = msg.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.contact_messages.insert_one(doc)
    return msg


@api_router.get("/contact", response_model=List[ContactMessage])
async def get_contact_messages():
    messages = await db.contact_messages.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for m in messages:
        if isinstance(m.get('created_at'), str):
            m['created_at'] = datetime.fromisoformat(m['created_at'])
    return messages


@api_router.post("/admin/login")
async def admin_login(body: AdminLogin):
    if body.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Λάθος κωδικός")
    return {"token": ADMIN_PASSWORD}


@api_router.get("/admin/contacts", response_model=List[ContactMessage])
async def admin_contacts(_: bool = Depends(verify_admin)):
    messages = await db.contact_messages.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for m in messages:
        if isinstance(m.get('created_at'), str):
            m['created_at'] = datetime.fromisoformat(m['created_at'])
        if isinstance(m.get('contacted_at'), str):
            m['contacted_at'] = datetime.fromisoformat(m['contacted_at'])
    return messages


@api_router.patch("/admin/contacts/{contact_id}", response_model=ContactMessage)
async def update_contact(contact_id: str, body: ContactUpdate, _: bool = Depends(verify_admin)):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    if updates.get("status") == "Contacted":
        existing = await db.contact_messages.find_one({"id": contact_id}, {"_id": 0, "contacted_at": 1})
        if existing is not None and not existing.get("contacted_at"):
            updates["contacted_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.contact_messages.update_one({"id": contact_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    doc = await db.contact_messages.find_one({"id": contact_id}, {"_id": 0})
    if isinstance(doc.get('created_at'), str):
        doc['created_at'] = datetime.fromisoformat(doc['created_at'])
    if isinstance(doc.get('contacted_at'), str):
        doc['contacted_at'] = datetime.fromisoformat(doc['contacted_at'])
    return doc


# --- Email scraping (Google Places does not expose emails, so we crawl the
# business website best-effort to find a public contact email). ---
EMAIL_RE = re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}")
SCRAPE_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/122.0 Safari/537.36"
)
# Emails containing any of these fragments are almost always noise, not a real
# business contact address.
EMAIL_JUNK = (
    "example.com", "example.org", "domain.com", "yourdomain", "email.com",
    "sentry.", "wixpress.com", "wix.com", ".png", ".jpg", ".jpeg", ".gif",
    ".webp", ".svg", "@2x", "godaddy", "@sentry", "u003e", "core-js",
)
CONTACT_PATHS = ("", "contact", "contact-us", "epikoinonia", "epikoinwnia")


def _extract_email(html: str) -> Optional[str]:
    if not html:
        return None
    candidates: List[str] = []
    # mailto: links are the most reliable signal
    candidates.extend(re.findall(r'mailto:([^"\'?>\s]+)', html, re.IGNORECASE))
    candidates.extend(EMAIL_RE.findall(html))
    for raw in candidates:
        email = raw.strip().strip(".").lower()
        if "@" not in email or "." not in email.split("@")[-1]:
            continue
        if any(junk in email for junk in EMAIL_JUNK):
            continue
        if email.endswith((".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg")):
            continue
        return email
    return None


async def _scrape_email(client: httpx.AsyncClient, website: Optional[str]) -> Optional[str]:
    if not website:
        return None
    base = website.rstrip("/")
    for path in CONTACT_PATHS:
        url = base if not path else f"{base}/{path}"
        try:
            resp = await client.get(
                url,
                timeout=6.0,
                follow_redirects=True,
                headers={"User-Agent": SCRAPE_UA, "Accept-Language": "el,en;q=0.8"},
            )
            if resp.is_error:
                continue
            email = _extract_email(resp.text)
            if email:
                return email
        except Exception:  # noqa: BLE001 - scraping is best-effort
            continue
    return None


async def _enrich_emails(client: httpx.AsyncClient, results: List["PlaceResult"]) -> None:
    """Fill in .email for results that have a website (concurrent, capped)."""
    sem = asyncio.Semaphore(8)

    async def worker(r: PlaceResult):
        if not r.website:
            return
        async with sem:
            try:
                r.email = await _scrape_email(client, r.website)
            except Exception:  # noqa: BLE001
                r.email = None

    await asyncio.gather(*(worker(r) for r in results), return_exceptions=True)


async def _get_place_details(client: httpx.AsyncClient, place_id: str) -> PlaceResult:
    resp = await client.get(
        f"{PLACES_BASE}/places/{place_id}",
        headers={"X-Goog-Api-Key": GOOGLE_PLACES_API_KEY, "X-Goog-FieldMask": PLACES_DETAILS_MASK},
    )
    if resp.is_error:
        raise HTTPException(status_code=502, detail="Google Place Details error")
    p = resp.json()
    display = p.get("displayName") or {}
    return PlaceResult(
        place_id=p.get("id", place_id),
        name=display.get("text"),
        address=p.get("formattedAddress"),
        phone=p.get("internationalPhoneNumber") or p.get("nationalPhoneNumber"),
        website=p.get("websiteUri"),
        rating=p.get("rating"),
        maps_url=p.get("googleMapsUri"),
    )


@api_router.get("/admin/places/search", response_model=PlaceSearchResponse)
async def search_places(q: str, _: bool = Depends(verify_admin)):
    query = (q or "").strip()
    if len(query) < 2:
        raise HTTPException(status_code=400, detail="Η αναζήτηση χρειάζεται τουλάχιστον 2 χαρακτήρες")
    if not GOOGLE_PLACES_API_KEY:
        raise HTTPException(status_code=500, detail="Το Google Places API key δεν έχει ρυθμιστεί")

    all_place_ids: List[str] = []
    async with httpx.AsyncClient(timeout=20.0) as client:
        page_token = None
        # Loop through every page Google returns (no artificial result cap);
        # a generous page-count safety net just guards against a runaway loop.
        for _page in range(10):
            body = {"textQuery": query, "pageSize": 20, "languageCode": "el"}
            if page_token:
                body["pageToken"] = page_token
            search_resp = await client.post(
                f"{PLACES_BASE}/places:searchText",
                headers={
                    "Content-Type": "application/json",
                    "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
                    "X-Goog-FieldMask": "places.id,nextPageToken",
                },
                json=body,
            )
            if search_resp.is_error:
                if not all_place_ids:
                    detail = search_resp.json().get("error", {}).get("message", "Google Text Search error") if search_resp.text else "Google Text Search error"
                    raise HTTPException(status_code=502, detail=detail)
                break

            data = search_resp.json()
            all_place_ids.extend(p["id"] for p in data.get("places", []) if p.get("id"))
            page_token = data.get("nextPageToken")
            if not page_token:
                break
            # A freshly issued pageToken needs a moment before Google accepts it.
            await asyncio.sleep(2)

        seen = set()
        unique_ids = [pid for pid in all_place_ids if not (pid in seen or seen.add(pid))]

        results: List[PlaceResult] = []
        batch_size = 10
        for i in range(0, len(unique_ids), batch_size):
            batch = unique_ids[i:i + batch_size]
            batch_results = await asyncio.gather(
                *(_get_place_details(client, pid) for pid in batch), return_exceptions=True
            )
            results.extend(r for r in batch_results if isinstance(r, PlaceResult))

        # Best-effort: crawl each business website for a public contact email.
        await _enrich_emails(client, results)

    return PlaceSearchResponse(query=query, results=results)


@api_router.post("/admin/prospects/bulk", response_model=List[Prospect])
async def add_prospects(body: ProspectBulkCreate, _: bool = Depends(verify_admin)):
    if not body.prospects:
        raise HTTPException(status_code=400, detail="Δεν στάλθηκαν υποψήφιοι πελάτες")
    created: List[Prospect] = []
    for item in body.prospects:
        existing = await db.prospects.find_one({"place_id": item.place_id}, {"_id": 0})
        if existing:
            continue
        prospect = Prospect(**item.model_dump())
        doc = prospect.model_dump()
        doc["created_at"] = doc["created_at"].isoformat()
        await db.prospects.insert_one(doc)
        created.append(prospect)
    return created


@api_router.get("/admin/prospects", response_model=List[Prospect])
async def get_prospects(_: bool = Depends(verify_admin)):
    docs = await db.prospects.find({}, {"_id": 0}).sort("created_at", -1).to_list(5000)
    for d in docs:
        if isinstance(d.get('created_at'), str):
            d['created_at'] = datetime.fromisoformat(d['created_at'])
    return docs


@api_router.post("/admin/prospects/bulk-delete")
async def bulk_delete_prospects(body: ProspectBulkDelete, _: bool = Depends(verify_admin)):
    if not body.ids:
        raise HTTPException(status_code=400, detail="Δεν στάλθηκαν αναγνωριστικά")
    result = await db.prospects.delete_many({"id": {"$in": body.ids}})
    return {"deleted": result.deleted_count}


@api_router.post("/admin/prospects/transfer")
async def transfer_prospects_to_leads(body: ProspectTransfer, _: bool = Depends(verify_admin)):
    """Move selected prospects into the Messages/Leads board (contact_messages)
    and remove them from the prospects list."""
    if not body.ids:
        raise HTTPException(status_code=400, detail="Δεν στάλθηκαν αναγνωριστικά")
    transferred = 0
    for pid in body.ids:
        prospect = await db.prospects.find_one({"id": pid}, {"_id": 0})
        if not prospect:
            continue
        detail_lines = []
        if prospect.get("category"):
            detail_lines.append(f"Κατηγορία: {prospect['category']}")
        if prospect.get("location"):
            detail_lines.append(f"Περιοχή: {prospect['location']}")
        if prospect.get("address"):
            detail_lines.append(f"Διεύθυνση: {prospect['address']}")
        if prospect.get("website"):
            detail_lines.append(f"Ιστοσελίδα: {prospect['website']}")
        if prospect.get("rating") is not None:
            detail_lines.append(f"Βαθμολογία Google: {prospect['rating']}")
        if prospect.get("maps_url"):
            detail_lines.append(f"Google Maps: {prospect['maps_url']}")
        if prospect.get("source_query"):
            detail_lines.append(f"Αναζήτηση: {prospect['source_query']}")
        message = "Μεταφορά από Υποψήφιους Πελάτες (Lead Finder).\n" + "\n".join(detail_lines)
        lead = ContactMessage(
            name=prospect.get("name") or "Άγνωστη επιχείρηση",
            email=prospect.get("email") or "",
            phone=prospect.get("phone"),
            company=prospect.get("name"),
            service=prospect.get("category"),
            message=message,
            status="New",
        )
        doc = lead.model_dump()
        doc["created_at"] = doc["created_at"].isoformat()
        await db.contact_messages.insert_one(doc)
        await db.prospects.delete_one({"id": pid})
        transferred += 1
    return {"transferred": transferred}


@api_router.delete("/admin/prospects/{prospect_id}")
async def delete_prospect(prospect_id: str, _: bool = Depends(verify_admin)):
    result = await db.prospects.delete_one({"id": prospect_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Prospect not found")
    return {"deleted": True}


# ============================================================
# AGENCY MANAGEMENT: Clients, Projects, Tasks, Invoices
# ============================================================

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class Client(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    contact_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    status: str = "Active"  # Active | Past | Prospect
    notes: str = ""
    created_at: str = Field(default_factory=_now_iso)


class ClientCreate(BaseModel):
    name: str
    contact_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    status: str = "Active"
    notes: str = ""


class ClientUpdate(BaseModel):
    name: Optional[str] = None
    contact_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class Project(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_id: Optional[str] = None
    name: str
    type: Optional[str] = None
    status: str = "Νέο"
    description: str = ""
    budget: float = 0
    deadline: Optional[str] = None
    start_date: Optional[str] = None
    staging_url: Optional[str] = None
    live_url: Optional[str] = None
    login_notes: str = ""
    created_at: str = Field(default_factory=_now_iso)


class ProjectCreate(BaseModel):
    client_id: Optional[str] = None
    name: str
    type: Optional[str] = None
    status: str = "Νέο"
    description: str = ""
    budget: float = 0
    deadline: Optional[str] = None
    start_date: Optional[str] = None
    staging_url: Optional[str] = None
    live_url: Optional[str] = None
    login_notes: str = ""


class ProjectUpdate(BaseModel):
    client_id: Optional[str] = None
    name: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None
    budget: Optional[float] = None
    deadline: Optional[str] = None
    start_date: Optional[str] = None
    staging_url: Optional[str] = None
    live_url: Optional[str] = None
    login_notes: Optional[str] = None


class Task(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    title: str
    done: bool = False
    created_at: str = Field(default_factory=_now_iso)


class TaskCreate(BaseModel):
    project_id: str
    title: str


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    done: Optional[bool] = None


class Invoice(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_id: Optional[str] = None
    project_id: Optional[str] = None
    number: Optional[str] = None
    amount: float = 0
    amount_paid: float = 0
    status: str = "Unpaid"  # Unpaid | Partial | Paid
    issued_date: Optional[str] = None
    due_date: Optional[str] = None
    notes: str = ""
    created_at: str = Field(default_factory=_now_iso)


class InvoiceCreate(BaseModel):
    client_id: Optional[str] = None
    project_id: Optional[str] = None
    number: Optional[str] = None
    amount: float = 0
    amount_paid: float = 0
    status: str = "Unpaid"
    issued_date: Optional[str] = None
    due_date: Optional[str] = None
    notes: str = ""


class InvoiceUpdate(BaseModel):
    client_id: Optional[str] = None
    project_id: Optional[str] = None
    number: Optional[str] = None
    amount: Optional[float] = None
    amount_paid: Optional[float] = None
    status: Optional[str] = None
    issued_date: Optional[str] = None
    due_date: Optional[str] = None
    notes: Optional[str] = None


# ---------- Clients ----------
@api_router.post("/admin/clients", response_model=Client)
async def create_client(body: ClientCreate, _: bool = Depends(verify_admin)):
    client_obj = Client(**body.model_dump())
    await db.clients.insert_one(client_obj.model_dump())
    return client_obj


@api_router.get("/admin/clients", response_model=List[Client])
async def list_clients(_: bool = Depends(verify_admin)):
    docs = await db.clients.find({}, {"_id": 0}).sort("created_at", -1).to_list(5000)
    return docs


@api_router.patch("/admin/clients/{client_id}", response_model=Client)
async def update_client(client_id: str, body: ClientUpdate, _: bool = Depends(verify_admin)):
    patch = {k: v for k, v in body.model_dump().items() if v is not None}
    if patch:
        await db.clients.update_one({"id": client_id}, {"$set": patch})
    doc = await db.clients.find_one({"id": client_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Client not found")
    return doc


@api_router.delete("/admin/clients/{client_id}")
async def delete_client(client_id: str, _: bool = Depends(verify_admin)):
    result = await db.clients.delete_one({"id": client_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Client not found")
    return {"deleted": True}


@api_router.post("/admin/clients/from-lead/{contact_id}", response_model=Client)
async def client_from_lead(contact_id: str, _: bool = Depends(verify_admin)):
    lead = await db.contact_messages.find_one({"id": contact_id}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    client_obj = Client(
        name=lead.get("company") or lead.get("name") or "Νέος Πελάτης",
        contact_name=lead.get("name"),
        email=lead.get("email") or None,
        phone=lead.get("phone"),
        status="Active",
        notes=(lead.get("message") or ""),
    )
    await db.clients.insert_one(client_obj.model_dump())
    await db.contact_messages.update_one({"id": contact_id}, {"$set": {"status": "Converted"}})
    return client_obj


@api_router.post("/admin/clients/from-prospect/{prospect_id}", response_model=Client)
async def client_from_prospect(prospect_id: str, _: bool = Depends(verify_admin)):
    p = await db.prospects.find_one({"id": prospect_id}, {"_id": 0})
    if not p:
        raise HTTPException(status_code=404, detail="Prospect not found")
    client_obj = Client(
        name=p.get("name") or "Νέος Πελάτης",
        email=p.get("email") or None,
        phone=p.get("phone"),
        website=p.get("website"),
        address=p.get("address"),
        status="Active",
        notes=f"Από Υποψήφιους Πελάτες · {p.get('category') or ''} · {p.get('location') or ''}",
    )
    await db.clients.insert_one(client_obj.model_dump())
    await db.prospects.delete_one({"id": prospect_id})
    return client_obj


# ---------- Projects ----------
@api_router.post("/admin/projects", response_model=Project)
async def create_project(body: ProjectCreate, _: bool = Depends(verify_admin)):
    project = Project(**body.model_dump())
    await db.projects.insert_one(project.model_dump())
    return project


@api_router.get("/admin/projects", response_model=List[Project])
async def list_projects(_: bool = Depends(verify_admin)):
    docs = await db.projects.find({}, {"_id": 0}).sort("created_at", -1).to_list(5000)
    return docs


@api_router.patch("/admin/projects/{project_id}", response_model=Project)
async def update_project(project_id: str, body: ProjectUpdate, _: bool = Depends(verify_admin)):
    patch = {k: v for k, v in body.model_dump().items() if v is not None}
    if patch:
        await db.projects.update_one({"id": project_id}, {"$set": patch})
    doc = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Project not found")
    return doc


@api_router.delete("/admin/projects/{project_id}")
async def delete_project(project_id: str, _: bool = Depends(verify_admin)):
    result = await db.projects.delete_one({"id": project_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    await db.tasks.delete_many({"project_id": project_id})
    return {"deleted": True}


# ---------- Tasks ----------
@api_router.post("/admin/tasks", response_model=Task)
async def create_task(body: TaskCreate, _: bool = Depends(verify_admin)):
    task = Task(**body.model_dump())
    await db.tasks.insert_one(task.model_dump())
    return task


@api_router.get("/admin/tasks", response_model=List[Task])
async def list_tasks(project_id: Optional[str] = None, _: bool = Depends(verify_admin)):
    query = {"project_id": project_id} if project_id else {}
    docs = await db.tasks.find(query, {"_id": 0}).sort("created_at", 1).to_list(5000)
    return docs


@api_router.patch("/admin/tasks/{task_id}", response_model=Task)
async def update_task(task_id: str, body: TaskUpdate, _: bool = Depends(verify_admin)):
    patch = {k: v for k, v in body.model_dump().items() if v is not None}
    if patch:
        await db.tasks.update_one({"id": task_id}, {"$set": patch})
    doc = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Task not found")
    return doc


@api_router.delete("/admin/tasks/{task_id}")
async def delete_task(task_id: str, _: bool = Depends(verify_admin)):
    result = await db.tasks.delete_one({"id": task_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"deleted": True}


# ---------- Invoices ----------
def _normalize_invoice_status(inv: dict) -> dict:
    amount = inv.get("amount", 0) or 0
    paid = inv.get("amount_paid", 0) or 0
    if inv.get("status") != "Paid":
        if paid <= 0:
            inv["status"] = "Unpaid"
        elif paid < amount:
            inv["status"] = "Partial"
        else:
            inv["status"] = "Paid"
    return inv


@api_router.post("/admin/invoices", response_model=Invoice)
async def create_invoice(body: InvoiceCreate, _: bool = Depends(verify_admin)):
    invoice = Invoice(**body.model_dump())
    doc = _normalize_invoice_status(invoice.model_dump())
    invoice = Invoice(**doc)
    await db.invoices.insert_one(invoice.model_dump())
    return invoice


@api_router.get("/admin/invoices", response_model=List[Invoice])
async def list_invoices(_: bool = Depends(verify_admin)):
    docs = await db.invoices.find({}, {"_id": 0}).sort("created_at", -1).to_list(5000)
    return docs


@api_router.patch("/admin/invoices/{invoice_id}", response_model=Invoice)
async def update_invoice(invoice_id: str, body: InvoiceUpdate, _: bool = Depends(verify_admin)):
    patch = {k: v for k, v in body.model_dump().items() if v is not None}
    if patch:
        await db.invoices.update_one({"id": invoice_id}, {"$set": patch})
    doc = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Invoice not found")
    # Re-normalize status based on amounts unless explicitly marked Paid
    doc = _normalize_invoice_status(doc)
    await db.invoices.update_one({"id": invoice_id}, {"$set": {"status": doc["status"]}})
    return doc


@api_router.delete("/admin/invoices/{invoice_id}")
async def delete_invoice(invoice_id: str, _: bool = Depends(verify_admin)):
    result = await db.invoices.delete_one({"id": invoice_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return {"deleted": True}


# ---------- Overview ----------
@api_router.get("/admin/overview")
async def admin_overview(_: bool = Depends(verify_admin)):
    clients = await db.clients.find({}, {"_id": 0}).to_list(5000)
    projects = await db.projects.find({}, {"_id": 0}).to_list(5000)
    invoices = await db.invoices.find({}, {"_id": 0}).to_list(5000)

    active_projects = [p for p in projects if p.get("status") != "Ολοκληρωμένο"]
    total_collected = sum((i.get("amount_paid", 0) or 0) for i in invoices)
    outstanding = sum(
        max((i.get("amount", 0) or 0) - (i.get("amount_paid", 0) or 0), 0)
        for i in invoices if i.get("status") != "Paid"
    )

    now = datetime.now(timezone.utc)
    month_prefix = now.strftime("%Y-%m")
    revenue_this_month = sum(
        (i.get("amount_paid", 0) or 0)
        for i in invoices
        if (i.get("created_at") or "").startswith(month_prefix)
    )

    # Upcoming deadlines (projects with a deadline, not completed), soonest first
    upcoming = [
        {
            "id": p["id"],
            "name": p.get("name"),
            "deadline": p.get("deadline"),
            "status": p.get("status"),
            "client_id": p.get("client_id"),
        }
        for p in active_projects if p.get("deadline")
    ]
    upcoming.sort(key=lambda x: x["deadline"])

    unpaid_invoices = [
        {
            "id": i["id"],
            "number": i.get("number"),
            "amount": i.get("amount", 0),
            "amount_paid": i.get("amount_paid", 0),
            "status": i.get("status"),
            "due_date": i.get("due_date"),
            "client_id": i.get("client_id"),
        }
        for i in invoices if i.get("status") != "Paid"
    ]

    return {
        "clients_total": len(clients),
        "active_projects": len(active_projects),
        "projects_total": len(projects),
        "revenue_this_month": revenue_this_month,
        "total_collected": total_collected,
        "outstanding": outstanding,
        "invoices_total": len(invoices),
        "upcoming_deadlines": upcoming[:8],
        "unpaid_invoices": unpaid_invoices[:8],
    }


# ============================================================
# MINDMAP BOARDS + FILE UPLOADS
# ============================================================
# A board belongs either to a project or a client. Nodes/edges are stored
# verbatim from the frontend canvas (freeform react-flow graph).

OWNER_TYPES = ("project", "client")


class BoardSave(BaseModel):
    owner_type: str
    owner_id: str
    nodes: List[dict] = []
    edges: List[dict] = []


class UploadedFile(BaseModel):
    id: str
    name: str
    content_type: str
    size: int
    kind: str
    url: str


def _board_filter(owner_type: str, owner_id: str) -> dict:
    return {"owner_type": owner_type, "owner_id": owner_id}


@api_router.get("/admin/mindmap")
async def get_board(owner_type: str, owner_id: str, _: bool = Depends(verify_admin)):
    if owner_type not in OWNER_TYPES:
        raise HTTPException(status_code=400, detail="Μη έγκυρος τύπος πίνακα")
    doc = await db.mindmaps.find_one(_board_filter(owner_type, owner_id), {"_id": 0})
    if not doc:
        return {"owner_type": owner_type, "owner_id": owner_id, "nodes": [], "edges": []}
    return {
        "owner_type": owner_type,
        "owner_id": owner_id,
        "nodes": doc.get("nodes", []),
        "edges": doc.get("edges", []),
    }


@api_router.put("/admin/mindmap")
async def save_board(body: BoardSave, _: bool = Depends(verify_admin)):
    if body.owner_type not in OWNER_TYPES:
        raise HTTPException(status_code=400, detail="Μη έγκυρος τύπος πίνακα")
    await db.mindmaps.update_one(
        _board_filter(body.owner_type, body.owner_id),
        {"$set": {
            "owner_type": body.owner_type,
            "owner_id": body.owner_id,
            "nodes": body.nodes,
            "edges": body.edges,
            "updated_at": _now_iso(),
        }},
        upsert=True,
    )
    return {"saved": True, "updated_at": _now_iso()}


@api_router.post("/admin/mindmap/upload", response_model=UploadedFile)
async def upload_mindmap_file(file: UploadFile = File(...), _: bool = Depends(verify_admin)):
    data = await file.read()
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Το αρχείο ξεπερνά το όριο των 20MB")
    if len(data) == 0:
        raise HTTPException(status_code=400, detail="Κενό αρχείο")
    file_id = str(uuid.uuid4())
    ext = file.filename.rsplit(".", 1)[-1].lower() if file.filename and "." in file.filename else "bin"
    content_type = file.content_type or "application/octet-stream"
    path = f"{STORAGE_APP}/mindmap/{file_id}.{ext}"
    try:
        result = await _storage_put(path, data, content_type)
    except Exception as exc:  # noqa: BLE001
        logging.getLogger(__name__).exception("Storage upload failed")
        raise HTTPException(status_code=502, detail="Η μεταφόρτωση απέτυχε. Δοκίμασε ξανά.") from exc
    record = {
        "id": file_id,
        "storage_path": result.get("path", path),
        "original_filename": file.filename or f"{file_id}.{ext}",
        "content_type": content_type,
        "size": result.get("size", len(data)),
        "kind": _file_kind(content_type),
        "is_deleted": False,
        "created_at": _now_iso(),
    }
    await db.files.insert_one(dict(record))
    return UploadedFile(
        id=file_id,
        name=record["original_filename"],
        content_type=content_type,
        size=record["size"],
        kind=record["kind"],
        url=f"/api/files/{file_id}",
    )


@api_router.get("/files/{file_id}")
async def serve_file(file_id: str, download: Optional[int] = Query(default=None)):
    record = await db.files.find_one({"id": file_id, "is_deleted": {"$ne": True}}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="File not found")
    try:
        data, content_type = await _storage_get(record["storage_path"])
    except Exception as exc:  # noqa: BLE001
        logging.getLogger(__name__).exception("Storage fetch failed")
        raise HTTPException(status_code=502, detail="Could not load file") from exc
    headers = {"Cache-Control": "public, max-age=31536000", "Accept-Ranges": "bytes"}
    if download:
        headers["Content-Disposition"] = f'attachment; filename="{record.get("original_filename", file_id)}"'
    return Response(content=data, media_type=record.get("content_type", content_type), headers=headers)


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def _init_storage_on_startup():
    try:
        await _storage_init()
        logger.info("Object storage initialized")
    except Exception as exc:  # noqa: BLE001
        logger.error(f"Storage init failed: {exc}")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
