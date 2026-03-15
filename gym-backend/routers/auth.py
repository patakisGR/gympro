from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from utils.auth import verify_password, create_access_token, hash_password, get_current_user
from config import settings

router = APIRouter(prefix="/auth", tags=["Αυθεντικοποίηση"])


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    username: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


@router.post("/login", response_model=LoginResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Σύνδεση με username και password."""

    # Έλεγχος username
    if form_data.username != settings.ADMIN_USERNAME:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Λάθος username ή password",
        )

    # Έλεγχος password
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
    """Αποσύνδεση (το token διαγράφεται από το frontend)."""
    return {"message": "Αποσυνδεθήκατε επιτυχώς"}
