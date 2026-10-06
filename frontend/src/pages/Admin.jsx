import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import Overview from "./admin/Overview";
import Clients from "./admin/Clients";
import Projects from "./admin/Projects";
import Invoices from "./admin/Invoices";
import MindMaps from "./admin/MindMaps";
import {
  Lock,
  ArrowLeft,
  LogOut,
  RefreshCw,
  Inbox,
  Mail,
  Phone,
  Loader2,
  Download,
  Check,
  ChevronDown,
  X,
  Search,
  Users,
  TrendingUp,
  Clock,
  Plus,
  Trash2,
  Calendar,
  ArrowRightLeft,
  LayoutDashboard,
  Users as UsersIcon,
  FolderKanban,
  Receipt,
  UserPlus,
  Network,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const TOKEN_KEY = "kndp_admin_token";

const STATUS_OPTIONS = ["New", "Contacted", "Converted", "Not Interested"];
const STATUS_META = {
  New: { dot: "bg-sky-400", head: "bg-sky-50 border-sky-200", chip: "bg-sky-100 text-sky-700" },
  Contacted: { dot: "bg-amber-400", head: "bg-amber-50 border-amber-200", chip: "bg-amber-100 text-amber-700" },
  Converted: { dot: "bg-emerald-500", head: "bg-emerald-50 border-emerald-200", chip: "bg-emerald-100 text-emerald-700" },
  "Not Interested": { dot: "bg-ink/30", head: "bg-mist border-ink/10", chip: "bg-ink/10 text-ink/60" },
};
const STATUS_RING = {
  New: "border-sky-300 bg-sky-50",
  Contacted: "border-amber-300 bg-amber-50",
  Converted: "border-emerald-300 bg-emerald-50",
  "Not Interested": "border-ink/15 bg-mist",
};
const STATUS_DOT = {
  New: "bg-sky-400",
  Contacted: "bg-amber-400",
  Converted: "bg-emerald-500",
  "Not Interested": "bg-ink/25",
};

const safeId = (s) => s.replace(/\s+/g, "-");

function formatDate(value) {
  try {
    const d = new Date(value);
    return d.toLocaleString("el-GR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function shortDate(value) {
  try {
    return new Date(value).toLocaleDateString("el-GR", {
      day: "2-digit",
      month: "short",
    });
  } catch {
    return value;
  }
}

function LoginScreen({ onSuccess }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      const res = await axios.post(`${API}/admin/login`, { password });
      localStorage.setItem(TOKEN_KEY, res.data.token);
      onSuccess(res.data.token);
    } catch {
      setError("Λάθος κωδικός. Δοκίμασε ξανά.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper text-ink font-body antialiased flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link
          to="/"
          data-testid="admin-back-home"
          className="inline-flex items-center gap-2 text-xs font-semibold text-ink/50 hover:text-ink transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Πίσω στο site
        </Link>
        <form
          onSubmit={submit}
          data-testid="admin-login-form"
          className="mt-5 rounded-[1.75rem] border border-ink/8 bg-white shadow-2xl shadow-ink/10 p-8"
        >
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-baby text-ink">
            <Lock className="h-5 w-5" />
          </span>
          <h1 className="mt-5 font-display text-2xl font-semibold tracking-tight">Admin Login</h1>
          <p className="mt-1.5 text-sm text-ink/55">
            Εισάγετε τον κωδικό για να δείτε τα μηνύματα επικοινωνίας.
          </p>
          <label htmlFor="admin-password" className="mt-6 mb-1.5 block text-xs uppercase tracking-[0.2em] font-semibold text-ink/50">
            Κωδικός
          </label>
          <input
            id="admin-password"
            data-testid="admin-password-input"
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm text-ink placeholder:text-ink/35 outline-none transition-[border-color,box-shadow] duration-300 focus:border-baby-dark focus:ring-4 focus:ring-baby/25"
          />
          {error && (
            <p data-testid="admin-login-error" className="mt-3 text-sm font-semibold text-red-500">{error}</p>
          )}
          <button
            type="submit"
            data-testid="admin-login-button"
            disabled={loading}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-bold text-white transition-[transform,opacity] duration-300 hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Σύνδεση…" : "Σύνδεση"}
          </button>
        </form>
      </div>
    </div>
  );
}

function StatusSelect({ value, onChange, disabled, testid }) {
  const status = value || "New";
  return (
    <div className={`relative inline-flex items-center gap-2 rounded-full border pl-3 pr-2 py-1.5 text-xs font-bold transition-colors ${STATUS_RING[status]}`}>
      <span className={`h-2 w-2 rounded-full ${STATUS_DOT[status]}`} />
      <select
        data-testid={testid}
        value={status}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-transparent pr-4 text-ink outline-none cursor-pointer disabled:cursor-wait"
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-ink/40" />
    </div>
  );
}

function KanbanCard({ lead, onOpen, onDragStart, onDragEnd, dragging, selected, onToggleSelect }) {
  return (
    <div
      data-testid={`admin-kanban-card-${lead.id}`}
      draggable
      onDragStart={(e) => onDragStart(e, lead.id)}
      onDragEnd={onDragEnd}
      onClick={() => onOpen(lead.id)}
      className={`group cursor-pointer rounded-xl border bg-white p-3.5 shadow-sm transition-[box-shadow,transform,opacity] hover:shadow-md hover:-translate-y-0.5 ${
        dragging ? "opacity-40" : ""
      } ${selected ? "border-baby-dark ring-2 ring-baby/40" : "border-ink/8"}`}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(lead.id);
          }}
          data-testid={`admin-select-${lead.id}`}
          aria-pressed={selected}
          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
            selected ? "bg-ink border-ink text-white" : "border-ink/25 text-transparent hover:border-ink/50"
          }`}
        >
          <Check className="h-3 w-3" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-sm text-ink">{lead.company || lead.name}</p>
          {lead.company && (
            <p className="mt-0.5 truncate text-xs text-ink/50">{lead.name}</p>
          )}
          <div className="mt-1.5 space-y-1">
            {lead.phone ? (
              <a
                href={`tel:${lead.phone}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 text-xs font-medium text-ink/70 hover:text-baby-dark"
              >
                <Phone className="h-3 w-3 shrink-0 text-baby-dark" />
                <span className="truncate">{lead.phone}</span>
              </a>
            ) : (
              <p className="flex items-center gap-1.5 text-xs text-ink/30">
                <Phone className="h-3 w-3 shrink-0" />
                —
              </p>
            )}
            <a
              href={`mailto:${lead.email}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 text-xs text-ink/55 hover:text-baby-dark"
            >
              <Mail className="h-3 w-3 shrink-0" />
              <span className="truncate">{lead.email}</span>
            </a>
          </div>
          <div className="mt-2.5 flex items-center justify-end gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] text-ink/40">
              <Calendar className="h-3 w-3" />
              {shortDate(lead.created_at)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailModal({ lead, onClose, onUpdate, onConvert }) {
  const [notes, setNotes] = useState(lead.notes || "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [savedNotes, setSavedNotes] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    setNotes(lead.notes || "");
  }, [lead.id, lead.notes]);

  const notesDirty = notes !== (lead.notes || "");

  const changeStatus = async (status) => {
    setSavingStatus(true);
    await onUpdate(lead.id, { status });
    setSavingStatus(false);
  };
  const convert = async () => {
    if (converting) return;
    setConverting(true);
    try {
      await onConvert(lead.id);
    } finally {
      setConverting(false);
    }
  };
  const saveNotes = async () => {
    setSavingNotes(true);
    await onUpdate(lead.id, { notes });
    setSavingNotes(false);
    setSavedNotes(true);
    setTimeout(() => setSavedNotes(false), 1800);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40 backdrop-blur-sm p-0 sm:p-6"
      onClick={onClose}
      data-testid="admin-detail-modal"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-[1.75rem] sm:rounded-[1.75rem] bg-white shadow-2xl"
      >
        <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-ink/8 bg-white/90 backdrop-blur px-6 py-5">
          <div>
            <h2 className="font-display text-xl font-semibold tracking-tight">{lead.company || lead.name}</h2>
            {lead.company && (
              <p className="mt-0.5 text-xs text-ink/50">{lead.name}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={convert}
              disabled={converting}
              data-testid="admin-detail-convert-client"
              title="Μετατροπή σε Πελάτη"
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-600 disabled:opacity-60"
            >
              {converting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
              Σε Πελάτη
            </button>
            <button
              onClick={onClose}
              data-testid="admin-detail-close"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink/10 text-ink/60 transition-colors hover:bg-mist"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
            <div>
              <span className="block text-[11px] uppercase tracking-[0.2em] font-semibold text-ink/45">Εταιρεία</span>
              <p className="mt-1 text-sm font-medium text-ink">{lead.company || "—"}</p>
            </div>
            <div>
              <span className="block text-[11px] uppercase tracking-[0.2em] font-semibold text-ink/45">Όνομα</span>
              <p className="mt-1 text-sm font-medium text-ink">{lead.name}</p>
            </div>
            <div>
              <span className="block text-[11px] uppercase tracking-[0.2em] font-semibold text-ink/45">Email</span>
              <a href={`mailto:${lead.email}`} className="mt-1 flex items-center gap-1.5 text-sm font-medium text-baby-dark hover:underline break-all">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                {lead.email}
              </a>
            </div>
            <div>
              <span className="block text-[11px] uppercase tracking-[0.2em] font-semibold text-ink/45">Τηλέφωνο</span>
              {lead.phone ? (
                <a href={`tel:${lead.phone}`} className="mt-1 flex items-center gap-1.5 text-sm font-medium text-baby-dark hover:underline">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  {lead.phone}
                </a>
              ) : (
                <p className="mt-1 text-sm text-ink/40">—</p>
              )}
            </div>
            <div>
              <span className="block text-[11px] uppercase tracking-[0.2em] font-semibold text-ink/45">Ημερομηνία</span>
              <p className="mt-1 text-sm text-ink/70">{formatDate(lead.created_at)}</p>
            </div>
            <div>
              <span className="block text-[11px] uppercase tracking-[0.2em] font-semibold text-ink/45">Επικοινωνία</span>
              <p className="mt-1 text-sm text-ink/70">{lead.contacted_at ? formatDate(lead.contacted_at) : "—"}</p>
            </div>
          </div>

          <div>
            <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-ink/45">Μήνυμα</span>
            <p className="mt-1.5 rounded-xl bg-mist/50 px-4 py-3 text-sm text-ink/75 leading-relaxed whitespace-pre-line">
              {lead.message}
            </p>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-ink/45">Κατάσταση</span>
            <div className="flex items-center gap-2">
              {savingStatus && <Loader2 className="h-3.5 w-3.5 animate-spin text-ink/40" />}
              <StatusSelect value={lead.status} disabled={savingStatus} onChange={changeStatus} testid="admin-detail-status" />
            </div>
          </div>

          <div>
            <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-ink/45">Σημειώσεις</span>
            <textarea
              data-testid="admin-detail-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Πρόσθεσε σημειώσεις για αυτό το lead…"
              className="mt-1.5 w-full resize-y rounded-xl border border-ink/10 bg-mist/40 px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/35 outline-none transition-[border-color,box-shadow] duration-300 focus:border-baby-dark focus:bg-white focus:ring-4 focus:ring-baby/20"
            />
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                data-testid="admin-detail-notes-save"
                onClick={saveNotes}
                disabled={!notesDirty || savingNotes}
                className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-1.5 text-xs font-bold text-white transition-[transform,opacity] duration-300 hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
              >
                {savingNotes ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : savedNotes ? <Check className="h-3.5 w-3.5" /> : null}
                {savedNotes ? "Αποθηκεύτηκε" : "Αποθήκευση"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options, testid }) {
  return (
    <div className="relative">
      <label className="mb-1 block text-[10px] uppercase tracking-[0.2em] font-semibold text-ink/45">{label}</label>
      <div className="relative">
        <select
          data-testid={testid}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none w-full rounded-xl border border-ink/10 bg-white pl-3.5 pr-9 py-2.5 text-sm font-medium text-ink outline-none cursor-pointer transition-[border-color,box-shadow] duration-300 focus:border-baby-dark focus:ring-4 focus:ring-baby/20"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/40" />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, testid }) {
  return (
    <div data-testid={testid} className="flex items-center gap-3 rounded-2xl border border-ink/8 bg-white px-4 py-3.5">
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-baby-light text-baby-dark">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[11px] uppercase tracking-[0.15em] font-semibold text-ink/45">{label}</p>
        <p className="text-lg font-bold text-ink">{value}</p>
      </div>
    </div>
  );
}

function LeadsChart({ data }) {
  return (
    <div data-testid="admin-leads-chart" className="rounded-2xl border border-ink/8 bg-white p-4">
      <p className="mb-2 text-[11px] uppercase tracking-[0.15em] font-semibold text-ink/45">
        Μηνύματα · τελευταίες 14 μέρες
      </p>
      <ResponsiveContainer width="100%" height={120}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
          <defs>
            <linearGradient id="leadsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4FB3E3" stopOpacity={0.55} />
              <stop offset="100%" stopColor="#4FB3E3" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9199a6" }} axisLine={false} tickLine={false} interval={1} />
          <YAxis hide allowDecimals={false} />
          <Tooltip formatter={(v) => [v, "Μηνύματα"]} labelStyle={{ fontSize: 12 }} contentStyle={{ fontSize: 12, borderRadius: 10 }} />
          <Area type="monotone" dataKey="count" stroke="#4FB3E3" strokeWidth={2} fill="url(#leadsFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

const LOCATIONS = {
  "Αθήνα": [
    "Μαρούσι", "Πεύκη", "Κηφισιά", "Χαλάνδρι", "Βριλήσσια", "Αγία Παρασκευή", "Παπάγου",
    "Ζωγράφου", "Ηλιούπολη", "Γλυφάδα", "Βούλα", "Βουλιαγμένη", "Αργυρούπολη", "Ελληνικό",
    "Παλαιό Φάληρο", "Νέα Σμύρνη", "Καλλιθέα", "Μοσχάτο", "Ταύρος", "Περιστέρι", "Αιγάλεω",
    "Κορυδαλλός", "Νίκαια", "Πειραιάς", "Κερατσίνι", "Δραπετσώνα", "Άλιμος", "Άνω Λιόσια",
    "Αχαρνές", "Ίλιον", "Πετρούπολη", "Αγ. Ανάργυροι", "Γαλάτσι", "Νέα Ιωνία", "Μεταμόρφωση",
    "Ηράκλειο Αττικής", "Λυκόβρυση", "Πεντέλη", "Παλλήνη", "Γέρακας", "Ανθούσα", "Κρυονέρι",
    "Διόνυσος", "Εκάλη", "Νέο Ψυχικό", "Ψυχικό", "Φιλοθέη", "Κολωνάκι", "Εξάρχεια", "Κουκάκι",
    "Παγκράτι", "Βύρωνας", "Δάφνη", "Υμηττός",
  ],
  "Θεσσαλονίκη": [
    "Καλαμαριά", "Σταυρούπολη", "Πολίχνη", "Ευόσμος", "Κορδελιό", "Άμπελοκήποι", "Νεάπολη",
    "Τριανδρία", "Πανόραμα", "Θέρμη", "Χαριλάου", "Τούμπα", "Νικόπολη", "Συκιές", "Μενεμένη",
  ],
  "Πάτρα": ["Κέντρο", "Άγιος Διονύσιος", "Οβριά", "Ζαρουχλέικα", "Προάστειο"],
  "Ηράκλειο": ["Κέντρο", "Νέα Αλικαρνασσός", "Πόρος", "Γάζι"],
  "Λάρισα": ["Κέντρο", "Νέα Πόλη", "Αμπελόκηποι", "Γιάννουλη"],
  "Βόλος": ["Κέντρο", "Νέα Ιωνία", "Άνω Βόλος"],
  "Ιωάννινα": ["Κέντρο", "Ανατολή", "Κατσικάς"],
  "Χανιά": [], "Ρόδος": [], "Κέρκυρα": [], "Καλαμάτα": [], "Σέρρες": [],
  "Αλεξανδρούπολη": [], "Κοζάνη": [], "Καβάλα": [], "Χαλκίδα": [], "Κατερίνη": [],
  "Τρίκαλα": [], "Λαμία": [], "Αγρίνιο": [], "Ξάνθη": [], "Δράμα": [], "Βέροια": [],
  "Κομοτηνή": [], "Ρέθυμνο": [], "Σπάρτη": [], "Κιλκίς": [], "Έδεσσα": [], "Φλώρινα": [],
  "Πύργος": [], "Άργος": [], "Ναύπλιο": [], "Πτολεμαΐδα": [], "Γρεβενά": [], "Καρδίτσα": [],
  "Άρτα": [], "Πρέβεζα": [], "Λευκάδα": [], "Ζάκυνθος": [], "Μύκονος": [], "Σαντορίνη": [],
  "Κως": [], "Μυτιλήνη": [], "Χίος": [], "Σάμος": [], "Καλαμπάκα": [], "Θήβα": [],
  "Λιβαδειά": [], "Μέγαρα": [], "Ραφήνα": [], "Μαραθώνας": [],
};
const GREEK_CITIES = Object.keys(LOCATIONS);

function LeadFinder({ token, onLeadsChanged }) {
  const [subTab, setSubTab] = useState("search");
  const [businessType, setBusinessType] = useState("");
  const [city, setCity] = useState(GREEK_CITIES[0]);
  const [neighborhood, setNeighborhood] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [addedIds, setAddedIds] = useState(new Set());
  const [adding, setAdding] = useState(false);
  const [lastMeta, setLastMeta] = useState({ query: "", category: "", location: "" });

  const neighborhoods = LOCATIONS[city] || [];

  const changeCity = (value) => {
    setCity(value);
    setNeighborhood("");
  };

  const search = async (e) => {
    e.preventDefault();
    const type = businessType.trim();
    if (type.length < 2 || loading) return;
    const locationLabel = neighborhood ? `${neighborhood}, ${city}` : city;
    const combinedQuery = `${type} ${locationLabel}`;
    setLoading(true);
    setError("");
    setSelectedIds(new Set());
    setAddedIds(new Set());
    try {
      const res = await axios.get(`${API}/admin/places/search`, {
        headers: { "X-Admin-Token": token },
        params: { q: combinedQuery },
      });
      const fetched = res.data.results || [];
      setResults(fetched);
      // Pre-select every result so the user only deselects the ones they don't want.
      setSelectedIds(new Set(fetched.map((p) => p.place_id)));
      setLastMeta({ query: combinedQuery, category: type, location: locationLabel });
      setSearched(true);
    } catch (err) {
      setError(err?.response?.data?.detail || "Η αναζήτηση απέτυχε. Δοκίμασε ξανά.");
      setResults([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (placeId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(placeId)) next.delete(placeId);
      else next.add(placeId);
      return next;
    });
  };

  const removeResult = (placeId) => {
    setResults((prev) => prev.filter((p) => p.place_id !== placeId));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(placeId);
      return next;
    });
  };

  const selectableIds = results.filter((p) => !addedIds.has(p.place_id)).map((p) => p.place_id);
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedIds.has(id));

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(selectableIds));
  };

  const addSelected = async () => {
    const chosen = results.filter((p) => selectedIds.has(p.place_id));
    if (chosen.length === 0 || adding) return;
    setAdding(true);
    setError("");
    try {
      await axios.post(
        `${API}/admin/prospects/bulk`,
        {
          prospects: chosen.map((p) => ({
            place_id: p.place_id,
            name: p.name,
            address: p.address,
            phone: p.phone,
            email: p.email,
            website: p.website,
            rating: p.rating,
            maps_url: p.maps_url,
            source_query: lastMeta.query,
            category: lastMeta.category,
            location: lastMeta.location,
          })),
        },
        { headers: { "X-Admin-Token": token } }
      );
      setAddedIds((prev) => new Set([...prev, ...chosen.map((p) => p.place_id)]));
      setSelectedIds(new Set());
    } catch {
      setError("Δεν ήταν δυνατή η προσθήκη των υποψηφίων πελατών. Δοκίμασε ξανά.");
    } finally {
      setAdding(false);
    }
  };

  const exportCSV = () => {
    const headers = ["Επιχείρηση", "Διεύθυνση", "Τηλέφωνο", "Email", "Ιστοσελίδα", "Βαθμολογία", "Google Maps"];
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = results.map((p) => [p.name, p.address, p.phone, p.email, p.website, p.rating, p.maps_url]);
    const csv = [headers, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lead-finder-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div data-testid="lead-finder-section">
      <div data-testid="lead-finder-subtabs" className="flex items-center gap-1 border-b border-ink/8">
        <button
          type="button"
          onClick={() => setSubTab("search")}
          data-testid="lead-finder-subtab-search"
          className={`px-4 py-2.5 text-sm font-bold border-b-2 -mb-px transition-colors ${
            subTab === "search" ? "border-ink text-ink" : "border-transparent text-ink/40 hover:text-ink/70"
          }`}
        >
          Αναζήτηση
        </button>
        <button
          type="button"
          onClick={() => setSubTab("prospects")}
          data-testid="lead-finder-subtab-prospects"
          className={`px-4 py-2.5 text-sm font-bold border-b-2 -mb-px transition-colors ${
            subTab === "prospects" ? "border-ink text-ink" : "border-transparent text-ink/40 hover:text-ink/70"
          }`}
        >
          Υποψήφιοι Πελάτες
        </button>
      </div>

      {subTab === "prospects" ? (
        <div className="mt-6">
          <ProspectsList token={token} onLeadsChanged={onLeadsChanged} />
        </div>
      ) : (
      <>
      <form onSubmit={search} className="mt-6 flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1 max-w-xs">
          <label className="mb-1 block text-[10px] uppercase tracking-[0.2em] font-semibold text-ink/45">Είδος επιχείρησης</label>
          <input
            data-testid="lead-finder-type-input"
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            placeholder="π.χ. καφετέριες, εστιατόρια"
            className="w-full rounded-xl border border-ink/10 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/35 outline-none transition-[border-color,box-shadow] duration-300 focus:border-baby-dark focus:ring-4 focus:ring-baby/20"
          />
        </div>
        <div className="min-w-[160px]">
          <label className="mb-1 block text-[10px] uppercase tracking-[0.2em] font-semibold text-ink/45">Πόλη</label>
          <div className="relative">
            <select
              data-testid="lead-finder-city-select"
              value={city}
              onChange={(e) => changeCity(e.target.value)}
              className="appearance-none w-full rounded-xl border border-ink/10 bg-white pl-3.5 pr-9 py-2.5 text-sm font-medium text-ink outline-none cursor-pointer transition-[border-color,box-shadow] duration-300 focus:border-baby-dark focus:ring-4 focus:ring-baby/20"
            >
              {GREEK_CITIES.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/40" />
          </div>
        </div>
        <div className="min-w-[180px]">
          <label className="mb-1 block text-[10px] uppercase tracking-[0.2em] font-semibold text-ink/45">Περιοχή</label>
          <div className="relative">
            <select
              data-testid="lead-finder-neighborhood-select"
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              disabled={neighborhoods.length === 0}
              className="appearance-none w-full rounded-xl border border-ink/10 bg-white pl-3.5 pr-9 py-2.5 text-sm font-medium text-ink outline-none cursor-pointer transition-[border-color,box-shadow] duration-300 focus:border-baby-dark focus:ring-4 focus:ring-baby/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Όλη η πόλη</option>
              {neighborhoods.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/40" />
          </div>
        </div>
        <button
          type="submit"
          data-testid="lead-finder-search-button"
          disabled={loading || businessType.trim().length < 2}
          className="inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-2.5 text-sm font-bold text-white transition-[transform,opacity] duration-300 hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          {loading ? "Αναζήτηση…" : "Αναζήτηση"}
        </button>
        {results.length > 0 && (
          <button
            type="button"
            onClick={exportCSV}
            data-testid="lead-finder-export-csv"
            className="inline-flex items-center gap-2 rounded-xl bg-baby px-5 py-2.5 text-sm font-bold text-ink transition-[transform,opacity] duration-300 hover:scale-[1.02]"
          >
            <Download className="h-4 w-4" />Export CSV
          </button>
        )}
      </form>

      {error && (
        <div data-testid="lead-finder-error" className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-600">
          {error}
        </div>
      )}

      {!searched && !loading && (
        <div data-testid="lead-finder-intro" className="mt-10 rounded-[1.75rem] border border-dashed border-ink/15 bg-white/60 px-8 py-16 text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-mist text-ink/40"><Search className="h-6 w-6" /></span>
          <p className="mt-4 font-display text-lg font-medium">Αναζήτησε επιχειρήσεις</p>
          <p className="mt-1 text-sm text-ink/50">Δοκίμασε π.χ. «καφετέριες» στην «Αθήνα» ή «φροντιστήρια» στη «Θεσσαλονίκη».</p>
        </div>
      )}

      {loading && (
        <div className="mt-10 flex flex-col items-center justify-center text-ink/40">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="mt-3 text-sm font-semibold">Αναζήτηση επιχειρήσεων & εύρεση email…</p>
          <p className="mt-1 text-xs text-ink/40">Σαρώνουμε τις ιστοσελίδες για emails — μπορεί να πάρει λίγο.</p>
        </div>
      )}

      {searched && !loading && !error && results.length === 0 && (
        <div data-testid="lead-finder-empty" className="mt-10 rounded-[1.75rem] border border-dashed border-ink/15 bg-white/60 px-8 py-16 text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-mist text-ink/40"><Inbox className="h-6 w-6" /></span>
          <p className="mt-4 font-display text-lg font-medium">Δεν βρέθηκαν αποτελέσματα</p>
          <p className="mt-1 text-sm text-ink/50">Δοκίμασε διαφορετικό είδος επιχείρησης ή περιοχή.</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <p data-testid="lead-finder-count" className="text-sm font-semibold text-ink/60">
              {results.length} αποτελέσματα{selectedIds.size > 0 ? ` · ${selectedIds.size} επιλεγμένα` : ""}
            </p>
            <button
              type="button"
              onClick={addSelected}
              disabled={selectedIds.size === 0 || adding}
              data-testid="lead-finder-add-selected"
              className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white transition-[transform,opacity] duration-300 hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100"
            >
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Προσθήκη Επιλεγμένων{selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
            </button>
          </div>

          <div className="mt-3 overflow-x-auto rounded-2xl border border-ink/8 bg-white">
            <table data-testid="lead-finder-results-table" className="w-full min-w-[1140px] text-left text-sm">
              <thead>
                <tr className="border-b border-ink/8 text-[11px] uppercase tracking-[0.15em] font-semibold text-ink/45">
                  <th className="px-4 py-3">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      data-testid="lead-finder-select-all"
                      aria-pressed={allSelected}
                      className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                        allSelected ? "bg-ink border-ink text-white" : "border-ink/25 text-transparent hover:border-ink/50"
                      }`}
                    >
                      <Check className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3">Επιχείρηση</th>
                  <th className="px-4 py-3">Διεύθυνση</th>
                  <th className="px-4 py-3">Τηλέφωνο</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Ιστοσελίδα</th>
                  <th className="px-4 py-3">Βαθμολογία</th>
                  <th className="px-4 py-3">Maps</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {results.map((p) => {
                  const added = addedIds.has(p.place_id);
                  const selected = selectedIds.has(p.place_id);
                  return (
                    <tr
                      key={p.place_id}
                      data-testid={`lead-finder-row-${p.place_id}`}
                      className={`border-b border-ink/6 last:border-b-0 hover:bg-mist/40 ${added ? "opacity-50" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggleSelect(p.place_id)}
                          disabled={added}
                          data-testid={`lead-finder-select-${p.place_id}`}
                          aria-pressed={selected}
                          className={`flex h-4 w-4 items-center justify-center rounded border transition-colors disabled:cursor-not-allowed ${
                            added
                              ? "bg-emerald-100 border-emerald-300 text-emerald-600"
                              : selected
                              ? "bg-ink border-ink text-white"
                              : "border-ink/25 text-transparent hover:border-ink/50"
                          }`}
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      </td>
                      <td className="px-4 py-3 font-semibold text-ink">{p.name || "—"}</td>
                      <td className="px-4 py-3 text-ink/70">{p.address || "—"}</td>
                      <td className="px-4 py-3 text-ink/70">{p.phone || "—"}</td>
                      <td className="px-4 py-3">
                        {p.email ? (
                          <a href={`mailto:${p.email}`} data-testid={`lead-finder-email-${p.place_id}`} className="text-baby-dark hover:underline break-all">{p.email}</a>
                        ) : (
                          <span className="text-ink/30">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {p.website ? (
                          <a href={p.website} target="_blank" rel="noreferrer" className="text-baby-dark hover:underline">Site</a>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 text-ink/70">{p.rating ?? "—"}</td>
                      <td className="px-4 py-3">
                        {p.maps_url ? (
                          <a href={p.maps_url} target="_blank" rel="noreferrer" className="text-baby-dark hover:underline">Maps</a>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => removeResult(p.place_id)}
                          data-testid={`lead-finder-remove-${p.place_id}`}
                          title="Αφαίρεση από τη λίστα"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-ink/35 transition-colors hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
      </>
      )}
    </div>
  );
}

function ProspectsList({ token, onLeadsChanged }) {
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [deleting, setDeleting] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [transferMsg, setTransferMsg] = useState("");
  const [websiteFilter, setWebsiteFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [queryFilter, setQueryFilter] = useState("all");
  const [minRating, setMinRating] = useState("0");
  const [sortBy, setSortBy] = useState("newest");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API}/admin/prospects`, { headers: { "X-Admin-Token": token } });
      setProspects(res.data);
    } catch {
      setError("Δεν ήταν δυνατή η φόρτωση των υποψηφίων πελατών.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const locationOptions = useMemo(() => {
    const set = new Set(prospects.map((p) => p.location).filter(Boolean));
    return [{ value: "all", label: "Όλες οι περιοχές" }, ...Array.from(set).sort().map((l) => ({ value: l, label: l }))];
  }, [prospects]);

  const categoryOptions = useMemo(() => {
    const set = new Set(prospects.map((p) => p.category).filter(Boolean));
    return [{ value: "all", label: "Όλες οι κατηγορίες" }, ...Array.from(set).sort().map((c) => ({ value: c, label: c }))];
  }, [prospects]);

  const queryOptions = useMemo(() => {
    const set = new Set(prospects.map((p) => p.source_query).filter(Boolean));
    return [{ value: "all", label: "Όλες οι αναζητήσεις" }, ...Array.from(set).sort().map((q) => ({ value: q, label: q }))];
  }, [prospects]);

  const ratingOptions = [
    { value: "0", label: "Οποιαδήποτε βαθμολογία" },
    { value: "3", label: "3+ αστέρια" },
    { value: "4", label: "4+ αστέρια" },
    { value: "4.5", label: "4.5+ αστέρια" },
  ];
  const websiteOptions = [
    { value: "all", label: "Όλες" },
    { value: "has", label: "Με ιστοσελίδα" },
    { value: "none", label: "Χωρίς ιστοσελίδα" },
  ];
  const sortOptions = [
    { value: "newest", label: "Νεότερα πρώτα" },
    { value: "rating", label: "Βαθμολογία" },
    { value: "name", label: "Όνομα" },
    { value: "location", label: "Τοποθεσία" },
  ];

  const filtered = useMemo(() => {
    const minR = parseFloat(minRating) || 0;
    const list = prospects.filter((p) => {
      if (websiteFilter === "has" && !p.website) return false;
      if (websiteFilter === "none" && p.website) return false;
      if (locationFilter !== "all" && p.location !== locationFilter) return false;
      if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
      if (queryFilter !== "all" && p.source_query !== queryFilter) return false;
      if (minR > 0 && (p.rating || 0) < minR) return false;
      return true;
    });
    return [...list].sort((a, b) => {
      if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
      if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
      if (sortBy === "location") return (a.location || "").localeCompare(b.location || "");
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }, [prospects, websiteFilter, locationFilter, categoryFilter, queryFilter, minRating, sortBy]);

  const allSelected = filtered.length > 0 && filtered.every((p) => selectedIds.has(p.id));
  const toggleSelectAll = () => setSelectedIds(allSelected ? new Set() : new Set(filtered.map((p) => p.id)));
  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const deleteOne = async (id) => {
    try {
      await axios.delete(`${API}/admin/prospects/${id}`, { headers: { "X-Admin-Token": token } });
      setProspects((prev) => prev.filter((p) => p.id !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch {
      setError("Η διαγραφή απέτυχε. Δοκίμασε ξανά.");
    }
  };

  const deleteSelected = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0 || deleting) return;
    setDeleting(true);
    try {
      await axios.post(`${API}/admin/prospects/bulk-delete`, { ids }, { headers: { "X-Admin-Token": token } });
      setProspects((prev) => prev.filter((p) => !selectedIds.has(p.id)));
      setSelectedIds(new Set());
    } catch {
      setError("Η μαζική διαγραφή απέτυχε. Δοκίμασε ξανά.");
    } finally {
      setDeleting(false);
    }
  };

  const transfer = async (ids) => {
    if (!ids.length) return;
    setError("");
    await axios.post(`${API}/admin/prospects/transfer`, { ids }, { headers: { "X-Admin-Token": token } });
    setProspects((prev) => prev.filter((p) => !ids.includes(p.id)));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
    setTransferMsg(
      ids.length === 1
        ? "1 επιχείρηση μεταφέρθηκε στα Μηνύματα."
        : `${ids.length} επιχειρήσεις μεταφέρθηκαν στα Μηνύματα.`
    );
    setTimeout(() => setTransferMsg(""), 3500);
    if (onLeadsChanged) onLeadsChanged();
  };

  const transferOne = async (id) => {
    try {
      await transfer([id]);
    } catch {
      setError("Η μεταφορά απέτυχε. Δοκίμασε ξανά.");
    }
  };

  const transferSelected = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0 || transferring) return;
    setTransferring(true);
    try {
      await transfer(ids);
    } catch {
      setError("Η μαζική μεταφορά απέτυχε. Δοκίμασε ξανά.");
    } finally {
      setTransferring(false);
    }
  };

  const convertToClient = async (id) => {
    try {
      await axios.post(`${API}/admin/clients/from-prospect/${id}`, {}, { headers: { "X-Admin-Token": token } });
      setProspects((prev) => prev.filter((p) => p.id !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setTransferMsg("1 επιχείρηση προστέθηκε στους Πελάτες.");
      setTimeout(() => setTransferMsg(""), 3500);
    } catch {
      setError("Η μετατροπή σε πελάτη απέτυχε. Δοκίμασε ξανά.");
    }
  };

  const exportCSV = () => {
    const headers = ["Επιχείρηση", "Κατηγορία", "Τοποθεσία", "Διεύθυνση", "Τηλέφωνο", "Email", "Ιστοσελίδα", "Βαθμολογία", "Αναζήτηση", "Google Maps", "Ημερομηνία"];
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = filtered.map((p) => [p.name, p.category, p.location, p.address, p.phone, p.email, p.website, p.rating, p.source_query, p.maps_url, formatDate(p.created_at)]);
    const csv = [headers, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prospects-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div data-testid="prospects-section">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tight">Υποψήφιοι Πελάτες</h2>
          <p className="mt-1.5 text-sm text-ink/55">Επιχειρήσεις που βρέθηκαν μέσω Lead Finder — δεν έχουν επικοινωνήσει ακόμα.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} data-testid="prospects-refresh-button" className="inline-flex items-center gap-2 rounded-full border border-ink/12 px-4 py-2 text-xs font-bold text-ink transition-colors hover:bg-mist">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />Ανανέωση
          </button>
          <button
            type="button"
            onClick={exportCSV}
            disabled={filtered.length === 0}
            data-testid="prospects-export-csv"
            className="inline-flex items-center gap-2 rounded-xl bg-baby px-5 py-2.5 text-sm font-bold text-ink transition-[transform,opacity] duration-300 hover:scale-[1.02] disabled:opacity-40"
          >
            <Download className="h-4 w-4" />Export CSV
          </button>
        </div>
      </div>

      {prospects.length > 0 && (
        <div className="mt-5 flex flex-wrap items-end gap-3">
          <div className="w-44">
            <FilterSelect label="Ιστοσελίδα" value={websiteFilter} onChange={setWebsiteFilter} options={websiteOptions} testid="prospects-filter-website" />
          </div>
          <div className="w-48">
            <FilterSelect label="Περιοχή" value={locationFilter} onChange={setLocationFilter} options={locationOptions} testid="prospects-filter-location" />
          </div>
          <div className="w-48">
            <FilterSelect label="Κατηγορία" value={categoryFilter} onChange={setCategoryFilter} options={categoryOptions} testid="prospects-filter-category" />
          </div>
          <div className="w-56">
            <FilterSelect label="Αναζήτηση" value={queryFilter} onChange={setQueryFilter} options={queryOptions} testid="prospects-filter-query" />
          </div>
          <div className="w-44">
            <FilterSelect label="Βαθμολογία" value={minRating} onChange={setMinRating} options={ratingOptions} testid="prospects-filter-rating" />
          </div>
          <div className="w-40">
            <FilterSelect label="Ταξινόμηση" value={sortBy} onChange={setSortBy} options={sortOptions} testid="prospects-sort" />
          </div>
        </div>
      )}

      {selectedIds.size > 0 && (
        <div data-testid="prospects-bulk-bar" className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-baby/40 bg-baby-light px-5 py-3.5">
          <span className="text-sm font-bold text-ink">{selectedIds.size} επιλεγμένα</span>
          <button
            type="button"
            onClick={transferSelected}
            disabled={transferring}
            data-testid="prospects-bulk-transfer"
            className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-ink/90 disabled:opacity-60"
          >
            {transferring ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRightLeft className="h-3.5 w-3.5" />}
            Μεταφορά στα Μηνύματα
          </button>
          <button
            type="button"
            onClick={deleteSelected}
            disabled={deleting}
            data-testid="prospects-bulk-delete"
            className="inline-flex items-center gap-1.5 rounded-full bg-red-500 px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-red-600 disabled:opacity-60"
          >
            {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            Διαγραφή Επιλεγμένων
          </button>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            data-testid="prospects-bulk-clear"
            className="ml-auto inline-flex items-center gap-1.5 text-xs font-bold text-ink/50 hover:text-ink"
          >
            <X className="h-3.5 w-3.5" />Άκυρο
          </button>
        </div>
      )}

      {transferMsg && (
        <div data-testid="prospects-transfer-msg" className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3.5 text-sm font-semibold text-emerald-700">{transferMsg}</div>
      )}

      {error && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-600">{error}</div>
      )}

      {loading ? (
        <div className="mt-20 flex flex-col items-center justify-center text-ink/40">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="mt-3 text-sm font-semibold">Φόρτωση…</p>
        </div>
      ) : prospects.length === 0 ? (
        <div data-testid="prospects-empty" className="mt-10 rounded-[1.75rem] border border-dashed border-ink/15 bg-white/60 px-8 py-16 text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-mist text-ink/40"><Inbox className="h-6 w-6" /></span>
          <p className="mt-4 font-display text-lg font-medium">Κανένας υποψήφιος πελάτης ακόμη</p>
          <p className="mt-1 text-sm text-ink/50">Πρόσθεσε επιχειρήσεις από την «Αναζήτηση».</p>
        </div>
      ) : filtered.length === 0 ? (
        <div data-testid="prospects-no-results" className="mt-10 rounded-[1.75rem] border border-dashed border-ink/15 bg-white/60 px-8 py-16 text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-mist text-ink/40"><Search className="h-6 w-6" /></span>
          <p className="mt-4 font-display text-lg font-medium">Δεν βρέθηκαν αποτελέσματα</p>
          <p className="mt-1 text-sm text-ink/50">Δοκίμασε διαφορετικά φίλτρα.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-ink/8 bg-white">
          <table data-testid="prospects-table" className="w-full min-w-[1220px] text-left text-sm">
            <thead>
              <tr className="border-b border-ink/8 text-[11px] uppercase tracking-[0.15em] font-semibold text-ink/45">
                <th className="px-4 py-3">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    data-testid="prospects-select-all"
                    aria-pressed={allSelected}
                    className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                      allSelected ? "bg-ink border-ink text-white" : "border-ink/25 text-transparent hover:border-ink/50"
                    }`}
                  >
                    <Check className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3">Επιχείρηση</th>
                <th className="px-4 py-3">Τοποθεσία</th>
                <th className="px-4 py-3">Τηλέφωνο</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Ιστοσελίδα</th>
                <th className="px-4 py-3">Βαθμολογία</th>
                <th className="px-4 py-3">Maps</th>
                <th className="px-4 py-3">Προστέθηκε</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const selected = selectedIds.has(p.id);
                return (
                  <tr key={p.id} data-testid={`prospects-row-${p.id}`} className="border-b border-ink/6 last:border-b-0 hover:bg-mist/40">
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleSelect(p.id)}
                        data-testid={`prospects-select-${p.id}`}
                        aria-pressed={selected}
                        className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                          selected ? "bg-ink border-ink text-white" : "border-ink/25 text-transparent hover:border-ink/50"
                        }`}
                      >
                        <Check className="h-3 w-3" />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-ink">{p.name || "—"}</p>
                      <p className="mt-0.5 text-xs text-ink/50">{p.address || "—"}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {p.category && (
                          <span data-testid={`prospects-category-${p.id}`} className="inline-flex rounded-full bg-baby-light border border-baby/40 px-2 py-0.5 text-[10px] font-bold text-baby-dark">
                            {p.category}
                          </span>
                        )}
                        <span
                          data-testid={`prospects-website-badge-${p.id}`}
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            p.website ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-600"
                          }`}
                        >
                          {p.website ? "Έχει ιστοσελίδα" : "Χωρίς ιστοσελίδα"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink/70">{p.location || "—"}</td>
                    <td className="px-4 py-3 text-ink/70">{p.phone || "—"}</td>
                    <td className="px-4 py-3">
                      {p.email ? (
                        <a href={`mailto:${p.email}`} data-testid={`prospects-email-${p.id}`} className="text-baby-dark hover:underline break-all">{p.email}</a>
                      ) : (
                        <span className="text-ink/30">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {p.website ? (
                        <a href={p.website} target="_blank" rel="noreferrer" className="text-baby-dark hover:underline">Site</a>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-ink/70">{p.rating ?? "—"}</td>
                    <td className="px-4 py-3">
                      {p.maps_url ? (
                        <a href={p.maps_url} target="_blank" rel="noreferrer" className="text-baby-dark hover:underline">Maps</a>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-ink/60">{formatDate(p.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => convertToClient(p.id)}
                          data-testid={`prospects-to-client-${p.id}`}
                          title="Μετατροπή σε Πελάτη"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-ink/35 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => transferOne(p.id)}
                          data-testid={`prospects-transfer-${p.id}`}
                          title="Μεταφορά στα Μηνύματα"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-ink/35 transition-colors hover:bg-baby-light hover:text-baby-dark"
                        >
                          <ArrowRightLeft className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteOne(p.id)}
                          data-testid={`prospects-delete-${p.id}`}
                          title="Διαγραφή"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-ink/35 transition-colors hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SidebarButton({ icon: Icon, label, active, onClick, testid }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testid}
      className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold transition-colors ${
        active ? "bg-ink text-white shadow-sm" : "text-ink/55 hover:bg-mist hover:text-ink"
      }`}
    >
      <Icon className={`h-4 w-4 shrink-0 ${active ? "text-baby" : "text-ink/40 group-hover:text-ink/70"}`} />
      {label}
    </button>
  );
}

function Dashboard({ token, onLogout }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [selectedId, setSelectedId] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API}/admin/contacts`, { headers: { "X-Admin-Token": token } });
      setMessages(res.data);
    } catch (err) {
      if (err?.response?.status === 401) {
        onLogout();
        return;
      }
      setError("Δεν ήταν δυνατή η φόρτωση των μηνυμάτων.");
    } finally {
      setLoading(false);
    }
  }, [token, onLogout]);

  useEffect(() => {
    load();
  }, [load]);

  const updateLead = useCallback(
    async (id, patch) => {
      const prev = messages;
      // optimistic update for snappy drag/drop
      setMessages((cur) => cur.map((m) => (m.id === id ? { ...m, ...patch } : m)));
      try {
        const res = await axios.patch(`${API}/admin/contacts/${id}`, patch, {
          headers: { "X-Admin-Token": token },
        });
        setMessages((cur) => cur.map((m) => (m.id === id ? res.data : m)));
      } catch (err) {
        setMessages(prev); // rollback
        if (err?.response?.status === 401) onLogout();
        else setError("Η αποθήκευση απέτυχε. Δοκίμασε ξανά.");
      }
    },
    [token, onLogout, messages]
  );

  const convertLeadToClient = useCallback(
    async (id) => {
      try {
        await axios.post(`${API}/admin/clients/from-lead/${id}`, {}, { headers: { "X-Admin-Token": token } });
        setSelectedId(null);
        await load(); // refresh so lead now shows as "Converted"
      } catch (err) {
        if (err?.response?.status === 401) onLogout();
        else setError("Η μετατροπή σε πελάτη απέτυχε. Δοκίμασε ξανά.");
      }
    },
    [token, onLogout, load]
  );

  const toggleSelect = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);
  const bulkSetStatus = useCallback(
    async (status) => {
      const ids = Array.from(selectedIds);
      await Promise.all(ids.map((id) => updateLead(id, { status })));
      clearSelection();
    },
    [selectedIds, updateLead, clearSelection]
  );

  const visible = useMemo(() => {
    return messages.filter((m) => {
      if (search) {
        const q = search.trim().toLowerCase();
        const haystack = `${m.name} ${m.email} ${m.company || ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (dateFrom && new Date(m.created_at) < new Date(dateFrom)) return false;
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        if (new Date(m.created_at) > to) return false;
      }
      return true;
    });
  }, [messages, search, dateFrom, dateTo]);

  const stats = useMemo(() => {
    const total = messages.length;
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const newThisWeek = messages.filter((m) => new Date(m.created_at).getTime() >= weekAgo).length;
    const converted = messages.filter((m) => m.status === "Converted").length;
    const conversionRate = total ? Math.round((converted / total) * 100) : 0;
    const responded = messages.filter((m) => m.contacted_at);
    let avgResponse = "—";
    if (responded.length) {
      const totalMinutes = responded.reduce(
        (sum, m) => sum + (new Date(m.contacted_at).getTime() - new Date(m.created_at).getTime()) / 60000,
        0
      );
      const avgMinutes = totalMinutes / responded.length;
      avgResponse = avgMinutes < 60 ? `${Math.round(avgMinutes)} λεπτά` : `${(avgMinutes / 60).toFixed(1)} ώρες`;
    }
    return { total, newThisWeek, conversionRate: `${conversionRate}%`, avgResponse };
  }, [messages]);

  const chartData = useMemo(() => {
    const days = 14;
    const buckets = [];
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(start);
      d.setDate(d.getDate() - i);
      buckets.push({
        key: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString("el-GR", { day: "2-digit", month: "2-digit" }),
        count: 0,
      });
    }
    const byKey = new Map(buckets.map((b) => [b.key, b]));
    messages.forEach((m) => {
      const key = new Date(m.created_at).toISOString().slice(0, 10);
      const bucket = byKey.get(key);
      if (bucket) bucket.count += 1;
    });
    return buckets;
  }, [messages]);

  const columns = useMemo(() => {
    const byDate = (a, b) => {
      const da = new Date(a.created_at).getTime();
      const db2 = new Date(b.created_at).getTime();
      return sortOrder === "newest" ? db2 - da : da - db2;
    };
    return STATUS_OPTIONS.map((status) => ({
      status,
      items: visible.filter((m) => (m.status || "New") === status).sort(byDate),
    }));
  }, [visible, sortOrder]);

  const selectedLead = useMemo(
    () => messages.find((m) => m.id === selectedId) || null,
    [messages, selectedId]
  );

  const onDragStart = (e, id) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
    setDraggingId(id);
  };
  const onDragEnd = () => {
    setDraggingId(null);
    setDragOverCol(null);
  };
  const onDropTo = (status, e) => {
    const id = draggingId || (e && e.dataTransfer && e.dataTransfer.getData("text/plain"));
    setDragOverCol(null);
    setDraggingId(null);
    if (!id) return;
    const lead = messages.find((m) => m.id === id);
    if (lead && (lead.status || "New") !== status) updateLead(id, { status });
  };

  const exportCSV = () => {
    const headers = ["Όνομα", "Email", "Τηλέφωνο", "Εταιρεία", "Status", "Μήνυμα", "Σημειώσεις", "Ημερομηνία", "Επικοινωνία"];
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = visible.map((m) => [
      m.name, m.email, m.phone || "", m.company || "", m.status || "New", m.message, m.notes || "", formatDate(m.created_at), m.contacted_at ? formatDate(m.contacted_at) : "",
    ]);
    const csv = [headers, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kndp-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const sortOptions = [
    { value: "newest", label: "Νεότερα πρώτα" },
    { value: "oldest", label: "Παλαιότερα πρώτα" },
  ];

  return (
    <div className="min-h-screen bg-paper text-ink font-body antialiased">
      <div className="mx-auto max-w-[1600px] flex">
        <aside
          data-testid="admin-sidebar"
          className="hidden md:flex w-56 shrink-0 flex-col border-r border-ink/8 bg-white/60 px-4 py-6 sticky top-0 self-start h-screen"
        >
          <div className="px-2 mb-8 flex items-center gap-2">
            <span className="font-display font-bold text-2xl tracking-tighter flex items-center gap-1">
              KNDP<span className="h-2.5 w-2.5 rounded-full bg-baby translate-y-1" />
            </span>
            <span className="text-xs font-semibold text-ink/40">Admin</span>
          </div>
          <p className="px-3 mb-2 text-[10px] uppercase tracking-[0.2em] font-semibold text-ink/40">Μενού</p>
          <div className="flex flex-col gap-1.5">
            <SidebarButton
              icon={LayoutDashboard}
              label="Επισκόπηση"
              active={activeTab === "overview"}
              onClick={() => setActiveTab("overview")}
              testid="admin-tab-overview"
            />
            <SidebarButton
              icon={Inbox}
              label="Μηνύματα"
              active={activeTab === "messages"}
              onClick={() => setActiveTab("messages")}
              testid="admin-tab-messages"
            />
            <SidebarButton
              icon={Search}
              label="Εύρεση Leads"
              active={activeTab === "finder"}
              onClick={() => setActiveTab("finder")}
              testid="admin-tab-finder"
            />
            <SidebarButton
              icon={UsersIcon}
              label="Πελάτες"
              active={activeTab === "clients"}
              onClick={() => setActiveTab("clients")}
              testid="admin-tab-clients"
            />
            <SidebarButton
              icon={FolderKanban}
              label="Έργα"
              active={activeTab === "projects"}
              onClick={() => setActiveTab("projects")}
              testid="admin-tab-projects"
            />
            <SidebarButton
              icon={Receipt}
              label="Τιμολόγια"
              active={activeTab === "invoices"}
              onClick={() => setActiveTab("invoices")}
              testid="admin-tab-invoices"
            />
            <SidebarButton
              icon={Network}
              label="Χάρτες Ιδεών"
              active={activeTab === "mindmaps"}
              onClick={() => setActiveTab("mindmaps")}
              testid="admin-tab-mindmaps"
            />
          </div>
          <div className="mt-auto flex flex-col gap-1.5 pt-4 border-t border-ink/8">
            <button onClick={load} data-testid="admin-refresh-button" className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold text-ink/55 transition-colors hover:bg-mist hover:text-ink">
              <RefreshCw className={`h-4 w-4 shrink-0 text-ink/40 ${loading ? "animate-spin" : ""}`} />Ανανέωση
            </button>
            <Link to="/" className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold text-ink/55 transition-colors hover:bg-mist hover:text-ink">
              <ArrowLeft className="h-4 w-4 shrink-0 text-ink/40" />Πίσω στο site
            </Link>
            <button onClick={onLogout} data-testid="admin-logout-button" className="flex w-full items-center gap-3 rounded-xl bg-ink px-3.5 py-2.5 text-sm font-bold text-white transition-transform hover:scale-[1.02]">
              <LogOut className="h-4 w-4 shrink-0 text-baby" />Έξοδος
            </button>
          </div>
        </aside>

        <main className="flex-1 min-w-0 px-6 md:px-10 py-8">
          <div className="md:hidden mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="font-display font-bold text-2xl tracking-tighter flex items-center gap-1">
                KNDP<span className="h-2.5 w-2.5 rounded-full bg-baby translate-y-1" />
              </span>
              <div className="flex items-center gap-2">
                <button onClick={load} data-testid="admin-refresh-button-mobile" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-ink/12 text-ink transition-colors hover:bg-mist">
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </button>
                <Link to="/" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-ink/12 text-ink transition-colors hover:bg-mist">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
                <button onClick={onLogout} data-testid="admin-logout-button-mobile" className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-ink text-white">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div data-testid="admin-tabs-mobile" className="flex items-center gap-1 overflow-x-auto border-b border-ink/8">
              {[
                ["overview", "Επισκόπηση"],
                ["messages", "Μηνύματα"],
                ["finder", "Εύρεση Leads"],
                ["clients", "Πελάτες"],
                ["projects", "Έργα"],
                ["invoices", "Τιμολόγια"],
                ["mindmaps", "Χάρτες Ιδεών"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  data-testid={`admin-tab-${key}-mobile`}
                  className={`whitespace-nowrap px-3.5 py-3 text-sm font-bold border-b-2 -mb-px transition-colors ${
                    activeTab === key ? "border-ink text-ink" : "border-transparent text-ink/40 hover:text-ink/70"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

        {activeTab === "overview" ? (
          <Overview token={token} />
        ) : activeTab === "clients" ? (
          <Clients token={token} />
        ) : activeTab === "projects" ? (
          <Projects token={token} />
        ) : activeTab === "invoices" ? (
          <Invoices token={token} />
        ) : activeTab === "mindmaps" ? (
          <MindMaps token={token} />
        ) : activeTab === "finder" ? (
          <div>
            <LeadFinder token={token} onLeadsChanged={load} />
          </div>
        ) : (
        <>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard icon={Users} label="Σύνολο Leads" value={stats.total} testid="admin-stat-total" />
          <StatCard icon={TrendingUp} label="Νέα (7 μέρες)" value={stats.newThisWeek} testid="admin-stat-new" />
          <StatCard icon={Check} label="Ποσοστό Μετατροπής" value={stats.conversionRate} testid="admin-stat-conversion" />
          <StatCard icon={Clock} label="Μέσος Χρόνος Απάντησης" value={stats.avgResponse} testid="admin-stat-response" />
        </div>

        <div className="mt-4">
          <LeadsChart data={chartData} />
        </div>

        <div className="mt-6 flex flex-wrap items-end gap-3">
          <div className="relative w-full max-w-xs">
            <label className="mb-1 block text-[10px] uppercase tracking-[0.2em] font-semibold text-ink/45">Αναζήτηση</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
              <input
                data-testid="admin-search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Όνομα, email ή εταιρεία…"
                className="w-full rounded-xl border border-ink/10 bg-white pl-9 pr-3.5 py-2.5 text-sm text-ink placeholder:text-ink/35 outline-none transition-[border-color,box-shadow] duration-300 focus:border-baby-dark focus:ring-4 focus:ring-baby/20"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-[0.2em] font-semibold text-ink/45">Από</label>
            <input
              type="date"
              data-testid="admin-date-from"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-xl border border-ink/10 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-[border-color,box-shadow] duration-300 focus:border-baby-dark focus:ring-4 focus:ring-baby/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-[0.2em] font-semibold text-ink/45">Έως</label>
            <input
              type="date"
              data-testid="admin-date-to"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-xl border border-ink/10 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-[border-color,box-shadow] duration-300 focus:border-baby-dark focus:ring-4 focus:ring-baby/20"
            />
          </div>
          <div className="w-40">
            <FilterSelect label="Ταξινόμηση" value={sortOrder} onChange={setSortOrder} options={sortOptions} testid="admin-sort" />
          </div>
          {(search || dateFrom || dateTo) && (
            <button
              type="button"
              data-testid="admin-clear-filters"
              onClick={() => { setSearch(""); setDateFrom(""); setDateTo(""); }}
              className="inline-flex items-center gap-1.5 rounded-full border border-ink/12 px-4 py-2.5 text-xs font-bold text-ink/60 transition-colors hover:bg-mist"
            >
              <X className="h-3.5 w-3.5" />Καθαρισμός
            </button>
          )}
          <button type="button" onClick={exportCSV} data-testid="admin-export-csv" disabled={visible.length === 0} className="ml-auto inline-flex items-center justify-center gap-2 rounded-xl bg-baby px-5 py-2.5 text-sm font-bold text-ink transition-[transform,opacity] duration-300 hover:scale-[1.03] disabled:opacity-40 disabled:hover:scale-100">
            <Download className="h-4 w-4" />Export CSV
          </button>
        </div>

        {selectedIds.size > 0 && (
          <div data-testid="admin-bulk-bar" className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-baby/40 bg-baby-light px-5 py-3.5">
            <span className="text-sm font-bold text-ink">{selectedIds.size} επιλεγμένα</span>
            <div className="flex flex-wrap items-center gap-2">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  data-testid={`admin-bulk-${safeId(s)}`}
                  onClick={() => bulkSetStatus(s)}
                  className="rounded-full bg-white border border-ink/10 px-3.5 py-1.5 text-xs font-bold text-ink transition-colors hover:border-baby-dark"
                >
                  {s}
                </button>
              ))}
            </div>
            <button
              type="button"
              data-testid="admin-bulk-clear"
              onClick={clearSelection}
              className="ml-auto inline-flex items-center gap-1.5 text-xs font-bold text-ink/50 hover:text-ink"
            >
              <X className="h-3.5 w-3.5" />Άκυρο
            </button>
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-600">{error}</div>
        )}

        {loading ? (
          <div className="mt-20 flex flex-col items-center justify-center text-ink/40">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="mt-3 text-sm font-semibold">Φόρτωση…</p>
          </div>
        ) : messages.length === 0 ? (
          <div data-testid="admin-empty" className="mt-10 rounded-[1.75rem] border border-dashed border-ink/15 bg-white/60 px-8 py-16 text-center">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-mist text-ink/40"><Inbox className="h-6 w-6" /></span>
            <p className="mt-4 font-display text-lg font-medium">Κανένα μήνυμα ακόμη</p>
            <p className="mt-1 text-sm text-ink/50">Τα νέα μηνύματα από τη φόρμα θα εμφανίζονται εδώ.</p>
          </div>
        ) : visible.length === 0 ? (
          <div data-testid="admin-no-results" className="mt-10 rounded-[1.75rem] border border-dashed border-ink/15 bg-white/60 px-8 py-16 text-center">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-mist text-ink/40"><Search className="h-6 w-6" /></span>
            <p className="mt-4 font-display text-lg font-medium">Δεν βρέθηκαν αποτελέσματα</p>
            <p className="mt-1 text-sm text-ink/50">Δοκίμασε διαφορετική αναζήτηση ή εύρος ημερομηνιών.</p>
          </div>
        ) : (
          <div data-testid="admin-kanban" className="mt-8 flex gap-4 overflow-x-auto pb-4 scrollbar-none">
            {columns.map(({ status, items }) => {
              const meta = STATUS_META[status];
              const isOver = dragOverCol === status;
              return (
                <div
                  key={status}
                  data-testid={`admin-column-${safeId(status)}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOverCol(status); }}
                  onDragLeave={(e) => { if (e.currentTarget === e.target) setDragOverCol(null); }}
                  onDrop={(e) => onDropTo(status, e)}
                  className={`flex w-72 shrink-0 flex-col rounded-2xl border transition-colors ${
                    isOver ? "border-baby-dark bg-baby-light/40" : "border-ink/8 bg-mist/40"
                  }`}
                >
                  <div className={`flex items-center justify-between gap-2 rounded-t-2xl border-b px-4 py-3 ${meta.head}`}>
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
                      <span className="text-sm font-bold text-ink">{status}</span>
                    </div>
                    <span className={`inline-flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold ${meta.chip}`}>
                      {items.length}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-2.5 p-3 min-h-[120px]">
                    {items.length === 0 ? (
                      <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-ink/10 py-8 text-xs text-ink/30">
                        {isOver ? "Άφησε εδώ" : "Κενό"}
                      </div>
                    ) : (
                      items.map((lead) => (
                        <KanbanCard
                          key={lead.id}
                          lead={lead}
                          onOpen={setSelectedId}
                          onDragStart={onDragStart}
                          onDragEnd={onDragEnd}
                          dragging={draggingId === lead.id}
                          selected={selectedIds.has(lead.id)}
                          onToggleSelect={toggleSelect}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </>
        )}
        </main>
      </div>

      {selectedLead && (
        <DetailModal lead={selectedLead} onClose={() => setSelectedId(null)} onUpdate={updateLead} onConvert={convertLeadToClient} />
      )}
    </div>
  );
}

export default function Admin() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }, []);

  if (!token) return <LoginScreen onSuccess={setToken} />;
  return <Dashboard token={token} onLogout={logout} />;
}
