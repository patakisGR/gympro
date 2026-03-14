import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from pathlib import Path

from config import settings
from database import engine
import models
from routers import members


# ─── Startup / Shutdown ───────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Δημιουργία πινάκων βάσης δεδομένων αν δεν υπάρχουν
    models.Base.metadata.create_all(bind=engine)

    # Δημιουργία φακέλου QR codes
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


# ─── CORS (επιτρέπει στο React frontend να επικοινωνεί) ──────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Static files (QR codes) ─────────────────────────────────────
app.mount("/static", StaticFiles(directory="static"), name="static")


# ─── Routers ─────────────────────────────────────────────────────
app.include_router(members.router, prefix="/api/v1")


# ─── Health Check ────────────────────────────────────────────────
@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "ok",
        "gym": settings.GYM_NAME,
        "email_provider": settings.EMAIL_PROVIDER,
    }
