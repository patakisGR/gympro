import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from pathlib import Path
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from config import settings
from database import engine
import models
from routers import members, auth

# ─── Rate Limiter ─────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])

# ─── Startup / Shutdown ───────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    models.Base.metadata.create_all(bind=engine)
    Path("static/qrcodes").mkdir(parents=True, exist_ok=True)
    print(f"✅ {settings.GYM_NAME} Backend ξεκίνησε!")
    print(f"📧 Email provider: {settings.EMAIL_PROVIDER}")
    print(f"🗄️  Database: {settings.DATABASE_URL}")
    yield
    print("🛑 Backend τερματίστηκε.")


# ─── App ──────────────────────────────────────────────────────────
app = FastAPI(
    title=f"{settings.GYM_NAME} - Σύστημα Διαχείρισης Μελών",
    description="Backend API για εγγραφή και διαχείριση μελών γυμναστηρίου",
    version="1.0.0",
    lifespan=lifespan,
)

# ─── Rate Limiter Setup ───────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# ─── CORS ────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Static files ────────────────────────────────────────────────
app.mount("/static", StaticFiles(directory="static"), name="static")

# ─── Routers ─────────────────────────────────────────────────────
app.include_router(auth.router, prefix="/api/v1")
app.include_router(members.router, prefix="/api/v1")

# ─── Health Check ────────────────────────────────────────────────
@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "ok",
        "gym": settings.GYM_NAME,
        "email_provider": settings.EMAIL_PROVIDER,
    }