"""Loopback-only demo with persistent credentials and no outgoing email."""
import json
import os
import secrets
from pathlib import Path

from passlib.hash import bcrypt


def load_local_credentials(local_dir: Path) -> dict:
    local_dir.mkdir(parents=True, exist_ok=True)
    path = local_dir / "credentials.json"
    if not path.exists():
        initial = {
            "ADMIN_USERNAME": "admin",
            "ADMIN_PASSWORD_HASH": bcrypt.hash("GymProLocal123!"),
            "SECRET_KEY": secrets.token_urlsafe(48),
        }
        try:
            with path.open("x", encoding="utf-8") as stream:
                json.dump(initial, stream, indent=2)
        except FileExistsError:
            pass
    credentials = json.loads(path.read_text(encoding="utf-8"))
    keys = {"ADMIN_USERNAME", "ADMIN_PASSWORD_HASH", "SECRET_KEY"}
    if not isinstance(credentials, dict) or set(credentials) != keys:
        raise ValueError("Invalid local credentials file; preserve it and correct its fields.")
    if any(not isinstance(value, str) or not value.strip() for value in credentials.values()):
        raise ValueError("Local credential fields must be non-empty strings.")
    if len(credentials["SECRET_KEY"]) < 32:
        raise ValueError("Local SECRET_KEY must contain at least 32 characters.")
    # Validate the stored hash without changing it or exposing its contents.
    try:
        bcrypt.verify("validation-only", credentials["ADMIN_PASSWORD_HASH"])
    except (ValueError, TypeError) as exc:
        raise ValueError("Invalid local ADMIN_PASSWORD_HASH.") from exc
    return credentials


def main():
    local_dir = Path(__file__).resolve().parent / ".local-data"
    credentials = load_local_credentials(local_dir)
    os.chdir(local_dir)

    import config

    config.settings = config.Settings(
        _env_file=None,
        **credentials,
        DATABASE_URL="sqlite:///" + (local_dir / "gym-local.db").as_posix(),
        ALLOWED_ORIGINS="http://127.0.0.1:5173,http://localhost:5173",
        EMAIL_PROVIDER="disabled",
        GMAIL_USER="", GMAIL_APP_PASSWORD="",
        SENDGRID_API_KEY="", MAILERSEND_API_KEY="",
    )
    from main import app
    import uvicorn

    print("Local demo: email disabled; credentials in .local-data/credentials.json")
    uvicorn.run(app, host="127.0.0.1", port=8000)


if __name__ == "__main__":
    main()
