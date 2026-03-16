from fastapi import APIRouter, HTTPException, status, Depends, Request
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address
from utils.auth import verify_password, create_access_token, get_current_user
from config import settings

router = APIRouter(prefix="/auth", tags=["Αυθεντικοποίηση"])
limiter = Limiter(key_func=get_remote_address)


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    username: str


@router.post("/login", response_model=LoginResponse)
@limiter.limit("5/minute")
def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends()):
    """Σύνδεση — max 5 προσπάθειες/λεπτό ανά IP."""

    if form_data.username != settings.ADMIN_USERNAME:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Λάθος username ή password",
        )

    if not verify_password(form_data.password, settings.ADMIN_PASSWORD_HASH):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Λάθος username ή password",
        )

    token = create_access_token({"sub": form_data.username})
    return {
        "access_token": token,
        "token_type": "bearer",
        "username": form_data.username,
    }


@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    """Επιστρέφει τον τρέχοντα χρήστη."""
    return {"username": current_user["username"], "gym": settings.GYM_NAME}


@router.post("/logout")
def logout():
    """Αποσύνδεση."""
    return {"message": "Αποσυνδεθήκατε επιτυχώς"}