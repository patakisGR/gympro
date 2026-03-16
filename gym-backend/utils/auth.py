from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from config import settings
import threading

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

# ─── Account Lockout (in-memory) ─────────────────────────────────
# Δεν χρειάζεται βάση — έχουμε μόνο έναν admin
_lock = threading.Lock()
_failed_attempts = 0
_lockout_until: Optional[datetime] = None

MAX_ATTEMPTS = 5
LOCKOUT_MINUTES = 15


def record_failed_attempt() -> tuple[int, Optional[datetime]]:
    """Καταγράφει αποτυχημένη προσπάθεια και επιστρέφει (attempts, lockout_until)."""
    global _failed_attempts, _lockout_until
    with _lock:
        _failed_attempts += 1
        if _failed_attempts >= MAX_ATTEMPTS:
            _lockout_until = datetime.utcnow() + timedelta(minutes=LOCKOUT_MINUTES)
            print(f"🔒 Account locked until {_lockout_until}")
        return _failed_attempts, _lockout_until


def reset_failed_attempts():
    """Μηδενίζει τις αποτυχημένες προσπάθειες μετά από επιτυχή σύνδεση."""
    global _failed_attempts, _lockout_until
    with _lock:
        _failed_attempts = 0
        _lockout_until = None


def check_lockout() -> Optional[int]:
    """
    Ελέγχει αν το account είναι κλειδωμένο.
    Επιστρέφει τα λεπτά που μένουν, ή None αν δεν είναι κλειδωμένο.
    """
    global _failed_attempts, _lockout_until
    with _lock:
        if _lockout_until is None:
            return None
        remaining = _lockout_until - datetime.utcnow()
        if remaining.total_seconds() <= 0:
            # Το lockout έληξε — ξεκλείδωμα
            _failed_attempts = 0
            _lockout_until = None
            return None
        return max(1, int(remaining.total_seconds() / 60))


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(hours=8))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")


def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Μη εξουσιοδοτημένη πρόσβαση. Παρακαλώ συνδεθείτε.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        return {"username": username}
    except JWTError:
        raise credentials_exception