from fastapi import APIRouter, HTTPException, status, Depends, Request
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address
from utils.auth import (
    verify_password, create_access_token, get_current_user,
    record_failed_attempt, reset_failed_attempts, check_lockout
)
from config import settings

router = APIRouter(prefix="/auth", tags=["Αυθεντικοποίηση"])
limiter = Limiter(key_func=get_remote_address)


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    username: str


@router.post("/login", response_model=LoginResponse)
@limiter.limit("20/minute")
def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends()):
    """Σύνδεση με account lockout — κλειδώνει για 15 λεπτά μετά από 5 αποτυχίες."""

    # Έλεγχος αν είναι κλειδωμένο
    minutes_remaining = check_lockout()
    if minutes_remaining is not None:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Πολλές αποτυχημένες προσπάθειες. Δοκιμάστε ξανά σε {minutes_remaining} λεπτό/ά.",
        )

    # Έλεγχος credentials
    if form_data.username != settings.ADMIN_USERNAME or \
       not verify_password(form_data.password, settings.ADMIN_PASSWORD_HASH):

        attempts, lockout_until = record_failed_attempt()
        remaining_attempts = max(0, 5 - attempts)

        if lockout_until:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Πολλές αποτυχημένες προσπάθειες. Το σύστημα κλειδώθηκε για 15 λεπτά.",
            )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Λάθος username ή password. Απομένουν {remaining_attempts} προσπάθειες.",
        )

    # Επιτυχής σύνδεση — μηδενισμός αποτυχιών
    reset_failed_attempts()
    token = create_access_token({"sub": form_data.username})

    print(f"✅ Επιτυχής σύνδεση: {form_data.username}")

    return {
        "access_token": token,
        "token_type": "bearer",
        "username": form_data.username,
    }


@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return {"username": current_user["username"], "gym": settings.GYM_NAME}


@router.post("/logout")
def logout():
    return {"message": "Αποσυνδεθήκατε επιτυχώς"}