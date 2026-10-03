#!/usr/bin/env python3
"""
Comprehensive backend test for KNDP agency-management endpoints.
Tests: CLIENTS, PROJECTS, TASKS, INVOICES, OVERVIEW, CONVERT, AUTH
"""

import requests
import json
import sys
from typing import Dict, Any, Optional

# Base URL from frontend/.env
BASE_URL = "https://repo-launcher-127.preview.emergentagent.com/api"
ADMIN_PASSWORD = "180406kon"

# Test results tracking
test_results = []
created_resources = {
    "clients": [],
    "projects": [],
    "tasks": [],
    "invoices": [],
    "contacts": [],
    "prospects": []
}


def log_test(section: str, test_name: str, passed: bool, details: str = ""):
    """Log test result"""
    status = "✅ PASS" if passed else "❌ FAIL"
    result = f"{status} | {section} | {test_name}"
    if details:
        result += f" | {details}"
    test_results.append((passed, result))
    print(result)


def get_admin_token() -> Optional[str]:
    """Get admin token by logging in"""
    try:
        response = requests.post(
            f"{BASE_URL}/admin/login",
            json={"password": ADMIN_PASSWORD},
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            token = data.get("token")
            log_test("AUTH", "POST /api/admin/login with correct password", True, f"Got token: {token[:20]}...")
            return token
        else:
            log_test("AUTH", "POST /api/admin/login with correct password", False, f"Status: {response.status_code}")
            return None
    except Exception as e:
        log_test("AUTH", "POST /api/admin/login with correct password", False, f"Error: {str(e)}")
        return None


def test_auth_without_token():
    """Test that endpoints return 401 without token"""
    try:
        # Test GET /api/admin/clients without token
        response = requests.get(f"{BASE_URL}/admin/clients", timeout=10)
        passed = response.status_code == 401
        log_test("AUTH", "GET /api/admin/clients WITHOUT X-Admin-Token", passed, f"Status: {response.status_code}")
        
        # Test GET /api/admin/overview without token
        response = requests.get(f"{BASE_URL}/admin/overview", timeout=10)
        passed = response.status_code == 401
        log_test("AUTH", "GET /api/admin/overview WITHOUT X-Admin-Token", passed, f"Status: {response.status_code}")
    except Exception as e:
        log_test("AUTH", "Auth without token tests", False, f"Error: {str(e)}")


def test_clients(token: str):
    """Test CLIENTS endpoints (A)"""
    headers = {"X-Admin-Token": token}
    
    # A1: POST /api/admin/clients - Create client
    try:
        client_data = {
            "name": "Test Client A",
            "email": "a@test.gr",
            "phone": "+30210",
            "status": "Active"
        }
        response = requests.post(
            f"{BASE_URL}/admin/clients",
            json=client_data,
            headers=headers,
            timeout=10
        )
        if response.status_code in [200, 201]:
            client = response.json()
            client_id = client.get("id")
            if client_id:
                created_resources["clients"].append(client_id)
                log_test("CLIENTS", "POST /api/admin/clients", True, f"Created client with id: {client_id}")
            else:
                log_test("CLIENTS", "POST /api/admin/clients", False, "No id in response")
                return
        else:
            log_test("CLIENTS", "POST /api/admin/clients", False, f"Status: {response.status_code}, Body: {response.text}")
            return
    except Exception as e:
        log_test("CLIENTS", "POST /api/admin/clients", False, f"Error: {str(e)}")
        return
    
    # A2: GET /api/admin/clients - List includes it
    try:
        response = requests.get(f"{BASE_URL}/admin/clients", headers=headers, timeout=10)
        if response.status_code == 200:
            clients = response.json()
            found = any(c.get("id") == client_id for c in clients)
            log_test("CLIENTS", "GET /api/admin/clients includes created client", found, f"Found: {found}")
        else:
            log_test("CLIENTS", "GET /api/admin/clients", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("CLIENTS", "GET /api/admin/clients", False, f"Error: {str(e)}")
    
    # A3: PATCH /api/admin/clients/{id} - Update client
    try:
        update_data = {
            "status": "Past",
            "notes": "hello"
        }
        response = requests.patch(
            f"{BASE_URL}/admin/clients/{client_id}",
            json=update_data,
            headers=headers,
            timeout=10
        )
        if response.status_code == 200:
            updated_client = response.json()
            status_ok = updated_client.get("status") == "Past"
            notes_ok = updated_client.get("notes") == "hello"
            passed = status_ok and notes_ok
            log_test("CLIENTS", "PATCH /api/admin/clients/{id}", passed, f"Status: {updated_client.get('status')}, Notes: {updated_client.get('notes')}")
        else:
            log_test("CLIENTS", "PATCH /api/admin/clients/{id}", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("CLIENTS", "PATCH /api/admin/clients/{id}", False, f"Error: {str(e)}")
    
    # A4: DELETE /api/admin/clients/{id} - Delete client
    try:
        response = requests.delete(
            f"{BASE_URL}/admin/clients/{client_id}",
            headers=headers,
            timeout=10
        )
        if response.status_code == 200:
            result = response.json()
            deleted = result.get("deleted") == True
            log_test("CLIENTS", "DELETE /api/admin/clients/{id}", deleted, f"Deleted: {deleted}")
            if deleted:
                created_resources["clients"].remove(client_id)
        else:
            log_test("CLIENTS", "DELETE /api/admin/clients/{id}", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("CLIENTS", "DELETE /api/admin/clients/{id}", False, f"Error: {str(e)}")
    
    # A5: Verify client no longer in list
    try:
        response = requests.get(f"{BASE_URL}/admin/clients", headers=headers, timeout=10)
        if response.status_code == 200:
            clients = response.json()
            not_found = not any(c.get("id") == client_id for c in clients)
            log_test("CLIENTS", "GET /api/admin/clients no longer lists deleted client", not_found, f"Not found: {not_found}")
        else:
            log_test("CLIENTS", "GET /api/admin/clients (verify deletion)", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("CLIENTS", "GET /api/admin/clients (verify deletion)", False, f"Error: {str(e)}")


def test_projects_and_tasks(token: str):
    """Test PROJECTS and TASKS endpoints (B, C) including cascade delete"""
    headers = {"X-Admin-Token": token}
    
    # B1: POST /api/admin/projects - Create project
    try:
        project_data = {
            "name": "Website X",
            "type": "Ιστοσελίδα",
            "status": "Νέο",
            "budget": 2000,
            "deadline": "2026-12-31"
        }
        response = requests.post(
            f"{BASE_URL}/admin/projects",
            json=project_data,
            headers=headers,
            timeout=10
        )
        if response.status_code in [200, 201]:
            project = response.json()
            project_id = project.get("id")
            if project_id:
                created_resources["projects"].append(project_id)
                log_test("PROJECTS", "POST /api/admin/projects", True, f"Created project with id: {project_id}")
            else:
                log_test("PROJECTS", "POST /api/admin/projects", False, "No id in response")
                return
        else:
            log_test("PROJECTS", "POST /api/admin/projects", False, f"Status: {response.status_code}, Body: {response.text}")
            return
    except Exception as e:
        log_test("PROJECTS", "POST /api/admin/projects", False, f"Error: {str(e)}")
        return
    
    # B2: GET /api/admin/projects - List includes it
    try:
        response = requests.get(f"{BASE_URL}/admin/projects", headers=headers, timeout=10)
        if response.status_code == 200:
            projects = response.json()
            found = any(p.get("id") == project_id for p in projects)
            log_test("PROJECTS", "GET /api/admin/projects includes created project", found, f"Found: {found}")
        else:
            log_test("PROJECTS", "GET /api/admin/projects", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("PROJECTS", "GET /api/admin/projects", False, f"Error: {str(e)}")
    
    # B3: PATCH /api/admin/projects/{id} - Update project
    try:
        update_data = {"status": "Ανάπτυξη"}
        response = requests.patch(
            f"{BASE_URL}/admin/projects/{project_id}",
            json=update_data,
            headers=headers,
            timeout=10
        )
        if response.status_code == 200:
            updated_project = response.json()
            status_ok = updated_project.get("status") == "Ανάπτυξη"
            log_test("PROJECTS", "PATCH /api/admin/projects/{id}", status_ok, f"Status: {updated_project.get('status')}")
        else:
            log_test("PROJECTS", "PATCH /api/admin/projects/{id}", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("PROJECTS", "PATCH /api/admin/projects/{id}", False, f"Error: {str(e)}")
    
    # C1: POST /api/admin/tasks - Create task for this project
    try:
        task_data = {
            "project_id": project_id,
            "title": "Task 1"
        }
        response = requests.post(
            f"{BASE_URL}/admin/tasks",
            json=task_data,
            headers=headers,
            timeout=10
        )
        if response.status_code in [200, 201]:
            task = response.json()
            task_id = task.get("id")
            done = task.get("done")
            if task_id:
                created_resources["tasks"].append(task_id)
                passed = done == False
                log_test("TASKS", "POST /api/admin/tasks", passed, f"Created task with id: {task_id}, done: {done}")
            else:
                log_test("TASKS", "POST /api/admin/tasks", False, "No id in response")
                return
        else:
            log_test("TASKS", "POST /api/admin/tasks", False, f"Status: {response.status_code}, Body: {response.text}")
            return
    except Exception as e:
        log_test("TASKS", "POST /api/admin/tasks", False, f"Error: {str(e)}")
        return
    
    # C2: GET /api/admin/tasks?project_id={id} - List includes it
    try:
        response = requests.get(
            f"{BASE_URL}/admin/tasks",
            params={"project_id": project_id},
            headers=headers,
            timeout=10
        )
        if response.status_code == 200:
            tasks = response.json()
            found = any(t.get("id") == task_id for t in tasks)
            log_test("TASKS", "GET /api/admin/tasks?project_id={id} includes created task", found, f"Found: {found}")
        else:
            log_test("TASKS", "GET /api/admin/tasks", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("TASKS", "GET /api/admin/tasks", False, f"Error: {str(e)}")
    
    # C3: PATCH /api/admin/tasks/{task_id} - Update task
    try:
        update_data = {"done": True}
        response = requests.patch(
            f"{BASE_URL}/admin/tasks/{task_id}",
            json=update_data,
            headers=headers,
            timeout=10
        )
        if response.status_code == 200:
            updated_task = response.json()
            done_ok = updated_task.get("done") == True
            log_test("TASKS", "PATCH /api/admin/tasks/{task_id}", done_ok, f"Done: {updated_task.get('done')}")
        else:
            log_test("TASKS", "PATCH /api/admin/tasks/{task_id}", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("TASKS", "PATCH /api/admin/tasks/{task_id}", False, f"Error: {str(e)}")
    
    # B4: DELETE /api/admin/projects/{id} - Delete project (should cascade delete tasks)
    try:
        response = requests.delete(
            f"{BASE_URL}/admin/projects/{project_id}",
            headers=headers,
            timeout=10
        )
        if response.status_code == 200:
            result = response.json()
            deleted = result.get("deleted") == True
            log_test("PROJECTS", "DELETE /api/admin/projects/{id}", deleted, f"Deleted: {deleted}")
            if deleted:
                created_resources["projects"].remove(project_id)
        else:
            log_test("PROJECTS", "DELETE /api/admin/projects/{id}", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("PROJECTS", "DELETE /api/admin/projects/{id}", False, f"Error: {str(e)}")
    
    # B5: Verify tasks cascade-deleted
    try:
        response = requests.get(
            f"{BASE_URL}/admin/tasks",
            params={"project_id": project_id},
            headers=headers,
            timeout=10
        )
        if response.status_code == 200:
            tasks = response.json()
            empty = len(tasks) == 0
            log_test("PROJECTS", "CASCADE DELETE: GET /api/admin/tasks?project_id={id} returns empty", empty, f"Tasks count: {len(tasks)}")
            if empty and task_id in created_resources["tasks"]:
                created_resources["tasks"].remove(task_id)
        else:
            log_test("PROJECTS", "CASCADE DELETE verification", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("PROJECTS", "CASCADE DELETE verification", False, f"Error: {str(e)}")


def test_invoices(token: str):
    """Test INVOICES endpoints with status auto-normalization (D)"""
    headers = {"X-Admin-Token": token}
    invoice_ids = []
    
    # D1: POST invoice with amount=1000, amount_paid=0 -> status should be "Unpaid"
    try:
        invoice_data = {"amount": 1000, "amount_paid": 0}
        response = requests.post(
            f"{BASE_URL}/admin/invoices",
            json=invoice_data,
            headers=headers,
            timeout=10
        )
        if response.status_code in [200, 201]:
            invoice = response.json()
            invoice_id = invoice.get("id")
            status = invoice.get("status")
            if invoice_id:
                invoice_ids.append(invoice_id)
                created_resources["invoices"].append(invoice_id)
            passed = status == "Unpaid"
            log_test("INVOICES", "POST invoice (amount=1000, paid=0) -> status='Unpaid'", passed, f"Status: {status}")
        else:
            log_test("INVOICES", "POST invoice (Unpaid)", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("INVOICES", "POST invoice (Unpaid)", False, f"Error: {str(e)}")
    
    # D2: POST invoice with amount=1000, amount_paid=400 -> status should be "Partial"
    try:
        invoice_data = {"amount": 1000, "amount_paid": 400}
        response = requests.post(
            f"{BASE_URL}/admin/invoices",
            json=invoice_data,
            headers=headers,
            timeout=10
        )
        if response.status_code in [200, 201]:
            invoice = response.json()
            invoice_id = invoice.get("id")
            status = invoice.get("status")
            if invoice_id:
                invoice_ids.append(invoice_id)
                created_resources["invoices"].append(invoice_id)
            passed = status == "Partial"
            log_test("INVOICES", "POST invoice (amount=1000, paid=400) -> status='Partial'", passed, f"Status: {status}")
        else:
            log_test("INVOICES", "POST invoice (Partial)", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("INVOICES", "POST invoice (Partial)", False, f"Error: {str(e)}")
    
    # D3: POST invoice with amount=1000, amount_paid=1000 -> status should be "Paid"
    try:
        invoice_data = {"amount": 1000, "amount_paid": 1000}
        response = requests.post(
            f"{BASE_URL}/admin/invoices",
            json=invoice_data,
            headers=headers,
            timeout=10
        )
        if response.status_code in [200, 201]:
            invoice = response.json()
            invoice_id = invoice.get("id")
            status = invoice.get("status")
            if invoice_id:
                invoice_ids.append(invoice_id)
                created_resources["invoices"].append(invoice_id)
            passed = status == "Paid"
            log_test("INVOICES", "POST invoice (amount=1000, paid=1000) -> status='Paid'", passed, f"Status: {status}")
        else:
            log_test("INVOICES", "POST invoice (Paid)", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("INVOICES", "POST invoice (Paid)", False, f"Error: {str(e)}")
    
    # D4: POST invoice with amount=1000, amount_paid=0, status="Paid" -> should REMAIN "Paid"
    try:
        invoice_data = {"amount": 1000, "amount_paid": 0, "status": "Paid"}
        response = requests.post(
            f"{BASE_URL}/admin/invoices",
            json=invoice_data,
            headers=headers,
            timeout=10
        )
        if response.status_code in [200, 201]:
            invoice = response.json()
            invoice_id = invoice.get("id")
            status = invoice.get("status")
            if invoice_id:
                invoice_ids.append(invoice_id)
                created_resources["invoices"].append(invoice_id)
            passed = status == "Paid"
            log_test("INVOICES", "POST invoice (amount=1000, paid=0, status='Paid') -> REMAINS 'Paid'", passed, f"Status: {status}")
        else:
            log_test("INVOICES", "POST invoice (explicit Paid)", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("INVOICES", "POST invoice (explicit Paid)", False, f"Error: {str(e)}")
    
    # D5: GET /api/admin/invoices - List them
    try:
        response = requests.get(f"{BASE_URL}/admin/invoices", headers=headers, timeout=10)
        if response.status_code == 200:
            invoices = response.json()
            found_count = sum(1 for inv in invoices if inv.get("id") in invoice_ids)
            passed = found_count == len(invoice_ids)
            log_test("INVOICES", "GET /api/admin/invoices lists all created invoices", passed, f"Found: {found_count}/{len(invoice_ids)}")
        else:
            log_test("INVOICES", "GET /api/admin/invoices", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("INVOICES", "GET /api/admin/invoices", False, f"Error: {str(e)}")
    
    # D6: PATCH one invoice to change amount_paid to full and confirm status recomputes
    if len(invoice_ids) >= 2:
        try:
            # Use the second invoice (Partial one)
            invoice_id = invoice_ids[1]
            update_data = {"amount_paid": 1000}
            response = requests.patch(
                f"{BASE_URL}/admin/invoices/{invoice_id}",
                json=update_data,
                headers=headers,
                timeout=10
            )
            if response.status_code == 200:
                updated_invoice = response.json()
                status = updated_invoice.get("status")
                passed = status == "Paid"
                log_test("INVOICES", "PATCH invoice (amount_paid=1000) -> status recomputes to 'Paid'", passed, f"Status: {status}")
            else:
                log_test("INVOICES", "PATCH invoice", False, f"Status: {response.status_code}")
        except Exception as e:
            log_test("INVOICES", "PATCH invoice", False, f"Error: {str(e)}")
    
    # D7: DELETE one invoice
    if len(invoice_ids) >= 1:
        try:
            invoice_id = invoice_ids[0]
            response = requests.delete(
                f"{BASE_URL}/admin/invoices/{invoice_id}",
                headers=headers,
                timeout=10
            )
            if response.status_code == 200:
                result = response.json()
                deleted = result.get("deleted") == True
                log_test("INVOICES", "DELETE /api/admin/invoices/{id}", deleted, f"Deleted: {deleted}")
                if deleted:
                    created_resources["invoices"].remove(invoice_id)
            else:
                log_test("INVOICES", "DELETE /api/admin/invoices/{id}", False, f"Status: {response.status_code}")
        except Exception as e:
            log_test("INVOICES", "DELETE /api/admin/invoices/{id}", False, f"Error: {str(e)}")


def test_overview(token: str):
    """Test OVERVIEW endpoint (E)"""
    headers = {"X-Admin-Token": token}
    
    # E1: Create a client
    client_id = None
    try:
        client_data = {"name": "Overview Test Client", "status": "Active"}
        response = requests.post(
            f"{BASE_URL}/admin/clients",
            json=client_data,
            headers=headers,
            timeout=10
        )
        if response.status_code in [200, 201]:
            client = response.json()
            client_id = client.get("id")
            if client_id:
                created_resources["clients"].append(client_id)
                log_test("OVERVIEW", "Setup: Created test client", True, f"Client ID: {client_id}")
        else:
            log_test("OVERVIEW", "Setup: Create client", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("OVERVIEW", "Setup: Create client", False, f"Error: {str(e)}")
    
    # E2: Create a project with deadline (status not "Ολοκληρωμένο")
    project_id = None
    try:
        project_data = {
            "name": "Overview Test Project",
            "status": "Ανάπτυξη",
            "deadline": "2026-12-31"
        }
        response = requests.post(
            f"{BASE_URL}/admin/projects",
            json=project_data,
            headers=headers,
            timeout=10
        )
        if response.status_code in [200, 201]:
            project = response.json()
            project_id = project.get("id")
            if project_id:
                created_resources["projects"].append(project_id)
                log_test("OVERVIEW", "Setup: Created test project with deadline", True, f"Project ID: {project_id}")
        else:
            log_test("OVERVIEW", "Setup: Create project", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("OVERVIEW", "Setup: Create project", False, f"Error: {str(e)}")
    
    # E3: Create a partial invoice (amount 1000 paid 300)
    invoice_id = None
    try:
        invoice_data = {"amount": 1000, "amount_paid": 300}
        response = requests.post(
            f"{BASE_URL}/admin/invoices",
            json=invoice_data,
            headers=headers,
            timeout=10
        )
        if response.status_code in [200, 201]:
            invoice = response.json()
            invoice_id = invoice.get("id")
            if invoice_id:
                created_resources["invoices"].append(invoice_id)
                log_test("OVERVIEW", "Setup: Created partial invoice", True, f"Invoice ID: {invoice_id}")
        else:
            log_test("OVERVIEW", "Setup: Create invoice", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("OVERVIEW", "Setup: Create invoice", False, f"Error: {str(e)}")
    
    # E4: GET /api/admin/overview and verify
    try:
        response = requests.get(f"{BASE_URL}/admin/overview", headers=headers, timeout=10)
        if response.status_code == 200:
            overview = response.json()
            
            # Check required keys
            required_keys = [
                "clients_total", "active_projects", "projects_total", 
                "revenue_this_month", "total_collected", "outstanding",
                "invoices_total", "upcoming_deadlines", "unpaid_invoices"
            ]
            has_all_keys = all(key in overview for key in required_keys)
            log_test("OVERVIEW", "GET /api/admin/overview has all required keys", has_all_keys, f"Keys: {list(overview.keys())}")
            
            # Verify counts
            clients_total = overview.get("clients_total", 0)
            active_projects = overview.get("active_projects", 0)
            projects_total = overview.get("projects_total", 0)
            invoices_total = overview.get("invoices_total", 0)
            
            log_test("OVERVIEW", "clients_total >= 1", clients_total >= 1, f"clients_total: {clients_total}")
            log_test("OVERVIEW", "active_projects >= 1", active_projects >= 1, f"active_projects: {active_projects}")
            log_test("OVERVIEW", "projects_total >= 1", projects_total >= 1, f"projects_total: {projects_total}")
            log_test("OVERVIEW", "invoices_total >= 1", invoices_total >= 1, f"invoices_total: {invoices_total}")
            
            # Verify outstanding includes the 700 from partial invoice
            outstanding = overview.get("outstanding", 0)
            log_test("OVERVIEW", "outstanding includes 700 from partial invoice", outstanding >= 700, f"outstanding: {outstanding}")
            
            # Verify upcoming_deadlines contains the project
            upcoming_deadlines = overview.get("upcoming_deadlines", [])
            has_project = any(p.get("id") == project_id for p in upcoming_deadlines) if project_id else False
            log_test("OVERVIEW", "upcoming_deadlines contains test project", has_project, f"Found: {has_project}")
            
            # Verify unpaid_invoices contains the partial invoice
            unpaid_invoices = overview.get("unpaid_invoices", [])
            has_invoice = any(i.get("id") == invoice_id for i in unpaid_invoices) if invoice_id else False
            log_test("OVERVIEW", "unpaid_invoices contains partial invoice", has_invoice, f"Found: {has_invoice}")
            
        else:
            log_test("OVERVIEW", "GET /api/admin/overview", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("OVERVIEW", "GET /api/admin/overview", False, f"Error: {str(e)}")


def test_convert(token: str):
    """Test CONVERT endpoints (F)"""
    headers = {"X-Admin-Token": token}
    
    # F1: Create a contact (lead)
    contact_id = None
    try:
        contact_data = {
            "name": "John",
            "email": "j@x.gr",
            "company": "Acme LTD",
            "message": "hi"
        }
        response = requests.post(
            f"{BASE_URL}/contact",
            json=contact_data,
            timeout=10
        )
        if response.status_code in [200, 201]:
            contact = response.json()
            contact_id = contact.get("id")
            if contact_id:
                created_resources["contacts"].append(contact_id)
                log_test("CONVERT", "Setup: Created contact/lead", True, f"Contact ID: {contact_id}")
        else:
            log_test("CONVERT", "Setup: Create contact", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("CONVERT", "Setup: Create contact", False, f"Error: {str(e)}")
    
    # F2: Convert contact to client
    client_from_lead_id = None
    if contact_id:
        try:
            response = requests.post(
                f"{BASE_URL}/admin/clients/from-lead/{contact_id}",
                headers=headers,
                timeout=10
            )
            if response.status_code in [200, 201]:
                client = response.json()
                client_from_lead_id = client.get("id")
                client_name = client.get("name")
                if client_from_lead_id:
                    created_resources["clients"].append(client_from_lead_id)
                passed = client_name == "Acme LTD"
                log_test("CONVERT", "POST /api/admin/clients/from-lead/{id} -> client with name 'Acme LTD'", passed, f"Client name: {client_name}")
            else:
                log_test("CONVERT", "POST /api/admin/clients/from-lead/{id}", False, f"Status: {response.status_code}")
        except Exception as e:
            log_test("CONVERT", "POST /api/admin/clients/from-lead/{id}", False, f"Error: {str(e)}")
    
    # F3: Verify contact status is now "Converted"
    if contact_id:
        try:
            response = requests.get(f"{BASE_URL}/admin/contacts", headers=headers, timeout=10)
            if response.status_code == 200:
                contacts = response.json()
                contact = next((c for c in contacts if c.get("id") == contact_id), None)
                if contact:
                    status = contact.get("status")
                    passed = status == "Converted"
                    log_test("CONVERT", "GET /api/admin/contacts shows contact status='Converted'", passed, f"Status: {status}")
                else:
                    log_test("CONVERT", "GET /api/admin/contacts (find converted contact)", False, "Contact not found")
            else:
                log_test("CONVERT", "GET /api/admin/contacts", False, f"Status: {response.status_code}")
        except Exception as e:
            log_test("CONVERT", "GET /api/admin/contacts", False, f"Error: {str(e)}")
    
    # F4: Create a prospect
    prospect_id = None
    try:
        prospect_data = {
            "prospects": [{
                "place_id": "CV_TEST_1",
                "name": "Prospect Biz",
                "email": "p@biz.gr",
                "phone": "+30211",
                "category": "καφε",
                "location": "Αθήνα"
            }]
        }
        response = requests.post(
            f"{BASE_URL}/admin/prospects/bulk",
            json=prospect_data,
            headers=headers,
            timeout=10
        )
        if response.status_code in [200, 201]:
            prospects = response.json()
            if len(prospects) > 0:
                prospect = prospects[0]
                prospect_id = prospect.get("id")
                if prospect_id:
                    created_resources["prospects"].append(prospect_id)
                    log_test("CONVERT", "Setup: Created prospect", True, f"Prospect ID: {prospect_id}")
            else:
                log_test("CONVERT", "Setup: Create prospect", False, "No prospects returned")
        else:
            log_test("CONVERT", "Setup: Create prospect", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("CONVERT", "Setup: Create prospect", False, f"Error: {str(e)}")
    
    # F5: Convert prospect to client
    client_from_prospect_id = None
    if prospect_id:
        try:
            response = requests.post(
                f"{BASE_URL}/admin/clients/from-prospect/{prospect_id}",
                headers=headers,
                timeout=10
            )
            if response.status_code in [200, 201]:
                client = response.json()
                client_from_prospect_id = client.get("id")
                client_name = client.get("name")
                if client_from_prospect_id:
                    created_resources["clients"].append(client_from_prospect_id)
                passed = client_name == "Prospect Biz"
                log_test("CONVERT", "POST /api/admin/clients/from-prospect/{id} -> client with name 'Prospect Biz'", passed, f"Client name: {client_name}")
            else:
                log_test("CONVERT", "POST /api/admin/clients/from-prospect/{id}", False, f"Status: {response.status_code}")
        except Exception as e:
            log_test("CONVERT", "POST /api/admin/clients/from-prospect/{id}", False, f"Error: {str(e)}")
    
    # F6: Verify prospect is REMOVED
    if prospect_id:
        try:
            response = requests.get(f"{BASE_URL}/admin/prospects", headers=headers, timeout=10)
            if response.status_code == 200:
                prospects = response.json()
                not_found = not any(p.get("id") == prospect_id for p in prospects)
                log_test("CONVERT", "GET /api/admin/prospects confirms prospect is REMOVED", not_found, f"Not found: {not_found}")
            else:
                log_test("CONVERT", "GET /api/admin/prospects", False, f"Status: {response.status_code}")
        except Exception as e:
            log_test("CONVERT", "GET /api/admin/prospects", False, f"Error: {str(e)}")


def cleanup(token: str):
    """Clean up created test data"""
    headers = {"X-Admin-Token": token}
    print("\n" + "="*80)
    print("CLEANUP: Removing test data...")
    print("="*80)
    
    # Delete clients
    for client_id in created_resources["clients"]:
        try:
            requests.delete(f"{BASE_URL}/admin/clients/{client_id}", headers=headers, timeout=10)
            print(f"✓ Deleted client: {client_id}")
        except Exception:
            pass
    
    # Delete projects (will cascade delete tasks)
    for project_id in created_resources["projects"]:
        try:
            requests.delete(f"{BASE_URL}/admin/projects/{project_id}", headers=headers, timeout=10)
            print(f"✓ Deleted project: {project_id}")
        except Exception:
            pass
    
    # Delete invoices
    for invoice_id in created_resources["invoices"]:
        try:
            requests.delete(f"{BASE_URL}/admin/invoices/{invoice_id}", headers=headers, timeout=10)
            print(f"✓ Deleted invoice: {invoice_id}")
        except Exception:
            pass
    
    # Delete prospects
    for prospect_id in created_resources["prospects"]:
        try:
            requests.delete(f"{BASE_URL}/admin/prospects/{prospect_id}", headers=headers, timeout=10)
            print(f"✓ Deleted prospect: {prospect_id}")
        except Exception:
            pass


def main():
    print("="*80)
    print("KNDP AGENCY-MANAGEMENT BACKEND API TEST")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"Admin Password: {ADMIN_PASSWORD}")
    print("="*80 + "\n")
    
    # Test auth without token first
    print("G) AUTH TESTS")
    print("-" * 80)
    test_auth_without_token()
    print()
    
    # Get admin token
    print("AUTH: Getting admin token...")
    print("-" * 80)
    token = get_admin_token()
    if not token:
        print("\n❌ CRITICAL: Failed to get admin token. Cannot proceed with tests.")
        sys.exit(1)
    print()
    
    # Run all tests
    print("A) CLIENTS TESTS")
    print("-" * 80)
    test_clients(token)
    print()
    
    print("B) PROJECTS TESTS & C) TASKS TESTS (with cascade delete)")
    print("-" * 80)
    test_projects_and_tasks(token)
    print()
    
    print("D) INVOICES TESTS (status auto-normalization)")
    print("-" * 80)
    test_invoices(token)
    print()
    
    print("E) OVERVIEW TESTS")
    print("-" * 80)
    test_overview(token)
    print()
    
    print("F) CONVERT TESTS")
    print("-" * 80)
    test_convert(token)
    print()
    
    # Cleanup
    cleanup(token)
    
    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    passed_count = sum(1 for passed, _ in test_results if passed)
    failed_count = sum(1 for passed, _ in test_results if not passed)
    total_count = len(test_results)
    
    print(f"\nTotal Tests: {total_count}")
    print(f"✅ Passed: {passed_count}")
    print(f"❌ Failed: {failed_count}")
    print()
    
    if failed_count > 0:
        print("FAILED TESTS:")
        print("-" * 80)
        for passed, result in test_results:
            if not passed:
                print(result)
        print()
    
    # Exit with appropriate code
    sys.exit(0 if failed_count == 0 else 1)


if __name__ == "__main__":
    main()
