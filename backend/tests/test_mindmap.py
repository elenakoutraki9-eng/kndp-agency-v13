"""Backend tests for the Mindmap boards + file uploads feature.

Covers:
- GET/PUT /api/admin/mindmap (project + client boards, isolation, auth)
- POST /api/admin/mindmap/upload (image kind, size cap -> 413, empty -> 400)
- GET /api/files/{id} (public, correct content-type)
"""
import io
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
assert BASE_URL, "REACT_APP_BACKEND_URL must be set"
ADMIN_TOKEN = "180406"

PROJECT_ID = "be3efc1a-e141-4a11-9de9-ef46ca784a88"
CLIENT_ID = "4c19a87d-4cda-453c-8ff4-8b79b3a58ad9"


@pytest.fixture(scope="module")
def auth_headers():
    return {"X-Admin-Token": ADMIN_TOKEN}


# ---------- Auth ----------
class TestMindmapAuth:
    def test_get_without_token_rejected(self):
        r = requests.get(
            f"{BASE_URL}/api/admin/mindmap",
            params={"owner_type": "project", "owner_id": PROJECT_ID},
        )
        assert r.status_code == 401

    def test_put_without_token_rejected(self):
        r = requests.put(
            f"{BASE_URL}/api/admin/mindmap",
            json={"owner_type": "project", "owner_id": PROJECT_ID, "nodes": [], "edges": []},
        )
        assert r.status_code == 401

    def test_upload_without_token_rejected(self):
        files = {"file": ("x.png", b"abc", "image/png")}
        r = requests.post(f"{BASE_URL}/api/admin/mindmap/upload", files=files)
        assert r.status_code == 401


# ---------- GET/PUT board ----------
class TestMindmapBoard:
    def test_get_unknown_board_returns_empty(self, auth_headers):
        oid = str(uuid.uuid4())
        r = requests.get(
            f"{BASE_URL}/api/admin/mindmap",
            params={"owner_type": "project", "owner_id": oid},
            headers=auth_headers,
        )
        assert r.status_code == 200
        d = r.json()
        assert d["owner_type"] == "project"
        assert d["owner_id"] == oid
        assert d["nodes"] == []
        assert d["edges"] == []

    def test_invalid_owner_type_rejected(self, auth_headers):
        r = requests.get(
            f"{BASE_URL}/api/admin/mindmap",
            params={"owner_type": "bogus", "owner_id": "x"},
            headers=auth_headers,
        )
        assert r.status_code == 400

    def test_put_then_get_persists(self, auth_headers):
        oid = f"TEST_{uuid.uuid4()}"
        nodes = [
            {"id": "n1", "type": "note", "position": {"x": 10, "y": 20}, "data": {"text": "hi"}}
        ]
        edges = [{"id": "e1", "source": "n1", "target": "n1"}]
        r = requests.put(
            f"{BASE_URL}/api/admin/mindmap",
            json={"owner_type": "project", "owner_id": oid, "nodes": nodes, "edges": edges},
            headers=auth_headers,
        )
        assert r.status_code == 200
        assert r.json().get("saved") is True

        g = requests.get(
            f"{BASE_URL}/api/admin/mindmap",
            params={"owner_type": "project", "owner_id": oid},
            headers=auth_headers,
        )
        assert g.status_code == 200
        gd = g.json()
        assert gd["nodes"] == nodes
        assert gd["edges"] == edges

    def test_project_and_client_boards_isolated(self, auth_headers):
        oid = f"TEST_{uuid.uuid4()}"
        proj_nodes = [{"id": "p1", "type": "note", "position": {"x": 0, "y": 0}, "data": {"text": "proj"}}]
        cli_nodes = [{"id": "c1", "type": "note", "position": {"x": 5, "y": 5}, "data": {"text": "client"}}]
        requests.put(
            f"{BASE_URL}/api/admin/mindmap",
            json={"owner_type": "project", "owner_id": oid, "nodes": proj_nodes, "edges": []},
            headers=auth_headers,
        )
        requests.put(
            f"{BASE_URL}/api/admin/mindmap",
            json={"owner_type": "client", "owner_id": oid, "nodes": cli_nodes, "edges": []},
            headers=auth_headers,
        )
        p = requests.get(f"{BASE_URL}/api/admin/mindmap", params={"owner_type": "project", "owner_id": oid}, headers=auth_headers).json()
        c = requests.get(f"{BASE_URL}/api/admin/mindmap", params={"owner_type": "client", "owner_id": oid}, headers=auth_headers).json()
        assert p["nodes"] == proj_nodes
        assert c["nodes"] == cli_nodes
        assert p["nodes"] != c["nodes"]

    def test_seeded_project_board_accessible(self, auth_headers):
        r = requests.get(
            f"{BASE_URL}/api/admin/mindmap",
            params={"owner_type": "project", "owner_id": PROJECT_ID},
            headers=auth_headers,
        )
        assert r.status_code == 200
        d = r.json()
        assert d["owner_type"] == "project"
        assert d["owner_id"] == PROJECT_ID
        assert isinstance(d["nodes"], list)


# ---------- Upload ----------
# 1x1 red PNG
PNG_BYTES = bytes.fromhex(
    "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4"
    "890000000d49444154789c636000010000050001a5f645400000000049454e44"
    "ae426082"
)


class TestMindmapUpload:
    def test_upload_image_returns_record(self, auth_headers):
        files = {"file": ("TEST_pixel.png", PNG_BYTES, "image/png")}
        r = requests.post(f"{BASE_URL}/api/admin/mindmap/upload", headers=auth_headers, files=files)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["kind"] == "image"
        assert d["content_type"] == "image/png"
        assert d["size"] == len(PNG_BYTES)
        assert d["name"] == "TEST_pixel.png"
        assert "id" in d and d["url"].endswith(d["id"])
        pytest.shared_file = d  # type: ignore[attr-defined]

    def test_served_file_matches_bytes(self):
        rec = getattr(pytest, "shared_file", None)
        assert rec, "upload must have run first"
        # Public endpoint; NO auth header
        r = requests.get(f"{BASE_URL}{rec['url']}")
        assert r.status_code == 200
        assert r.headers.get("content-type", "").startswith("image/png")
        assert r.content == PNG_BYTES

    def test_served_file_unknown_404(self):
        r = requests.get(f"{BASE_URL}/api/files/{uuid.uuid4()}")
        assert r.status_code == 404

    def test_upload_empty_rejected(self, auth_headers):
        files = {"file": ("empty.bin", b"", "application/octet-stream")}
        r = requests.post(f"{BASE_URL}/api/admin/mindmap/upload", headers=auth_headers, files=files)
        assert r.status_code == 400

    def test_upload_over_20mb_rejected(self, auth_headers):
        # 20MB + 1 byte, random-ish zeroes are fine for size check
        big = b"\x00" * (20 * 1024 * 1024 + 1)
        files = {"file": ("TEST_big.bin", big, "application/octet-stream")}
        r = requests.post(f"{BASE_URL}/api/admin/mindmap/upload", headers=auth_headers, files=files)
        assert r.status_code == 413

    def test_upload_mp4_kind_video(self, auth_headers):
        files = {"file": ("TEST_c.mp4", b"\x00\x00\x00\x18ftypmp42", "video/mp4")}
        r = requests.post(f"{BASE_URL}/api/admin/mindmap/upload", headers=auth_headers, files=files)
        assert r.status_code == 200, r.text
        assert r.json()["kind"] == "video"

    def test_upload_pdf_kind_file(self, auth_headers):
        files = {"file": ("TEST_c.pdf", b"%PDF-1.4\n%EOF\n", "application/pdf")}
        r = requests.post(f"{BASE_URL}/api/admin/mindmap/upload", headers=auth_headers, files=files)
        assert r.status_code == 200, r.text
        assert r.json()["kind"] == "file"
