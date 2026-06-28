"""Euryx backend API tests via external preview URL (reverse proxy -> Next.js)."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://tcg-nexus-play.preview.emergentagent.com").rstrip("/")

SEED_EMAIL = "trainer@euryx.gg"
SEED_PASSWORD = "battle123"
SEED_USERNAME = "RedShard"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def unique_user():
    suffix = uuid.uuid4().hex[:8]
    return {
        "email": f"TEST_{suffix}@euryx.gg",
        "username": f"TEST_{suffix}",
        "password": "battle123",
    }


# ---------- HEALTH ----------
class TestHealth:
    def test_health(self, session):
        r = session.get(f"{BASE_URL}/api/health")
        assert r.status_code == 200
        d = r.json()
        assert d.get("ok") is True
        assert d.get("service") == "euryx"
        assert "time" in d


# ---------- POKEMON SEARCH ----------
class TestPokemonSearch:
    def test_search_charizard(self, session):
        r = session.get(f"{BASE_URL}/api/pokemon/search", params={"search": "charizard"})
        assert r.status_code == 200
        d = r.json()
        assert "count" in d and "cards" in d and "source" in d
        assert isinstance(d["cards"], list)
        assert len(d["cards"]) >= 1
        card = d["cards"][0]
        for k in ("id", "apiId", "name", "imageUrl", "variants"):
            assert k in card, f"missing key {k} in card"
        assert isinstance(card["variants"], list)
        assert len(card["variants"]) == 4
        codes = {v.get("suffix") or v.get("code") for v in card["variants"]}
        assert {"EN", "JP", "CN", "RH"}.issubset(codes)

    def test_search_empty(self, session):
        r = session.get(f"{BASE_URL}/api/pokemon/search", params={"search": ""})
        assert r.status_code == 200


# ---------- AUTH ----------
class TestAuth:
    def test_signup_short_password(self, session, unique_user):
        r = session.post(f"{BASE_URL}/api/auth/signup", json={
            "email": f"short_{uuid.uuid4().hex[:6]}@x.gg",
            "username": f"S{uuid.uuid4().hex[:6]}",
            "password": "abc",
        })
        assert r.status_code == 400

    def test_signup_success_and_me(self, unique_user):
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        r = s.post(f"{BASE_URL}/api/auth/signup", json=unique_user)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "user" in d and "token" in d
        assert d["user"]["email"].lower() == unique_user["email"].lower()
        assert d["user"]["username"] == unique_user["username"]
        # cookie set
        assert "euryx_token" in s.cookies.get_dict() or any("euryx_token" in c.name for c in s.cookies)

        # /me with cookie
        me = s.get(f"{BASE_URL}/api/auth/me")
        assert me.status_code == 200
        meu = me.json()
        assert meu.get("user") and meu["user"]["email"].lower() == unique_user["email"].lower()

    def test_signup_duplicate(self, session, unique_user):
        # Should already exist now (created in previous test)
        r = session.post(f"{BASE_URL}/api/auth/signup", json=unique_user)
        assert r.status_code == 409

    def test_login_valid_seed(self):
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        r = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": SEED_EMAIL,
            "password": SEED_PASSWORD,
        })
        assert r.status_code == 200, r.text
        d = r.json()
        assert "user" in d and "token" in d
        assert d["user"]["email"] == SEED_EMAIL

    def test_login_invalid(self, session):
        r = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": SEED_EMAIL,
            "password": "wrong_password",
        })
        assert r.status_code == 401
        d = r.json()
        assert "error" in d

    def test_me_no_cookie(self):
        s = requests.Session()
        r = s.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 200
        assert r.json().get("user") is None

    def test_logout_clears_cookie(self):
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        r = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": SEED_EMAIL, "password": SEED_PASSWORD,
        })
        assert r.status_code == 200
        # logout
        lo = s.post(f"{BASE_URL}/api/auth/logout")
        assert lo.status_code == 200
        # /me should be null
        me = s.get(f"{BASE_URL}/api/auth/me")
        assert me.status_code == 200
        assert me.json().get("user") is None


# ---------- DECKS ----------
class TestDecks:
    def _auth_session(self):
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        r = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": SEED_EMAIL, "password": SEED_PASSWORD,
        })
        assert r.status_code == 200, r.text
        return s

    def test_decks_no_auth(self):
        r = requests.get(f"{BASE_URL}/api/decks")
        assert r.status_code == 401

    def test_decks_get_then_create(self):
        s = self._auth_session()
        # initial list
        r = s.get(f"{BASE_URL}/api/decks")
        assert r.status_code == 200
        before = r.json().get("decks", [])
        assert isinstance(before, list)

        # create
        deck_name = f"TEST_deck_{uuid.uuid4().hex[:6]}"
        payload = {
            "name": deck_name,
            "cards": [
                {"cardId": "base1-4", "name": "Charizard", "imageUrl": "https://images.pokemontcg.io/base1/4.png", "variant": "EN", "quantity": 2},
                {"cardId": "base1-2", "name": "Blastoise", "imageUrl": "https://images.pokemontcg.io/base1/2.png", "variant": "JP", "quantity": 1},
            ],
        }
        c = s.post(f"{BASE_URL}/api/decks", json=payload)
        assert c.status_code in (200, 201), c.text
        cdata = c.json()
        assert "deck" in cdata
        assert cdata["deck"]["name"] == deck_name

        # list again
        r2 = s.get(f"{BASE_URL}/api/decks")
        assert r2.status_code == 200
        decks_after = r2.json().get("decks", [])
        names = [d.get("name") for d in decks_after]
        assert deck_name in names
