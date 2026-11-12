import pytest
from starlette.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.models import User

client = TestClient(app)

def test_login_admin():
    response = client.post(
        "/api/auth/login",
        json={"username_or_email": "admin@veritrust.io", "password": "Admin@123456"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["email"] == "admin@veritrust.io"
    assert data["user"]["role"] == "admin"

def test_login_invalid_password():
    response = client.post(
        "/api/auth/login",
        json={"username_or_email": "admin@veritrust.io", "password": "WrongPassword123"}
    )
    assert response.status_code == 401

def test_get_current_user():
    login_res = client.post(
        "/api/auth/login",
        json={"username_or_email": "admin@veritrust.io", "password": "Admin@123456"}
    )
    token = login_res.json()["access_token"]
    
    me_res = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert me_res.status_code == 200
    assert me_res.json()["username"] == "admin"

def test_register_new_user():
    import uuid
    uid = uuid.uuid4().hex[:8]
    email = f"testuser_{uid}@veritrust.io"
    username = f"testuser_{uid}"
    
    res = client.post(
        "/api/auth/register",
        json={
            "email": email,
            "username": username,
            "full_name": "Test Security Officer",
            "password": "Password@12345",
            "role": "analyst"
        }
    )
    assert res.status_code == 201
    assert "access_token" in res.json()
    assert res.json()["user"]["username"] == username

def test_google_auth():
    import uuid
    uid = uuid.uuid4().hex[:8]
    email = f"google_user_{uid}@gmail.com"
    res = client.post(
        "/api/auth/google",
        json={
            "email": email,
            "name": f"Google User {uid}"
        }
    )
    assert res.status_code == 200
    assert "access_token" in res.json()
    assert res.json()["user"]["email"] == email
