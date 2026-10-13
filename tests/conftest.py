"""Shared preparation for API tests. The running local server is not used."""
import sys
from pathlib import Path
from unittest.mock import AsyncMock

import pytest
from fastapi.testclient import TestClient
from passlib.hash import bcrypt

BACKEND = Path(__file__).resolve().parents[1] / "gym-backend"


@pytest.fixture(scope="session")
def test_app(tmp_path_factory):
    # Prepare settings BEFORE importing the application.
    # A temporary cwd also prevents loading the real backend .env.
    test_dir = tmp_path_factory.mktemp("gym-api")
    test_database = test_dir / "test.db"

    with pytest.MonkeyPatch.context() as patch:
        patch.chdir(test_dir)
        patch.syspath_prepend(str(BACKEND))
        patch.setenv("DATABASE_URL", "sqlite:///" + test_database.as_posix())
        patch.setenv("ADMIN_USERNAME", "test_admin")
        patch.setenv("ADMIN_PASSWORD_HASH", bcrypt.hash("test-password"))
        patch.setenv("SECRET_KEY", "test-only-secret")

        import main
        import database

        # Refuse to reset any database other than the one created for this run.
        assert Path(database.engine.url.database).resolve() == test_database.resolve()
        try:
            yield main
        finally:
            database.engine.dispose()


@pytest.fixture
def client(test_app, monkeypatch):
    import models
    from database import engine
    from routers import auth, members
    from utils.auth import reset_failed_attempts

    # Each test starts with empty tables and clean login/rate-limit state.
    models.Base.metadata.drop_all(bind=engine)
    models.Base.metadata.create_all(bind=engine)
    reset_failed_attempts()
    for limiter in (test_app.limiter, auth.limiter, members.limiter):
        limiter.reset()

    # No real email is sent if a later test creates a member.
    monkeypatch.setattr(members, "send_welcome_email", AsyncMock(return_value=True))

    # TestClient calls FastAPI directly; no port 8000 server is needed.
    with TestClient(test_app.app) as api_client:
        yield api_client

