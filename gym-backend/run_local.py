"""Local development only: persistent separate database, no outgoing email."""
import os
import secrets
from pathlib import Path

if __name__ == "__main__":
    local_dir = Path(__file__).resolve().parent / ".local-data"
    local_dir.mkdir(exist_ok=True)
    os.chdir(local_dir)

    from passlib.hash import bcrypt
    from config import Settings
    import config

    config.settings = Settings(
        _env_file=None,
        DATABASE_URL="sqlite:///" + (local_dir / "gym-local.db").as_posix(),
        ADMIN_USERNAME="admin",
        ADMIN_PASSWORD_HASH=bcrypt.hash("GymProLocal123!"),
        SECRET_KEY=secrets.token_urlsafe(48),
        ALLOWED_ORIGINS="http://127.0.0.1:5173,http://localhost:5173",
        EMAIL_PROVIDER="local-disabled",
        GMAIL_USER="", GMAIL_APP_PASSWORD="",
        SENDGRID_API_KEY="", MAILERSEND_API_KEY="",
    )

    from main import app
    from routers import members
    import uvicorn

    async def local_email_disabled(*args, **kwargs):
        print("Local mode: outgoing email disabled.")
        return False

    members.send_welcome_email = local_email_disabled
    print("Local login: admin / GymProLocal123!")
    uvicorn.run(app, host="127.0.0.1", port=8000)
