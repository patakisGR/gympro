from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import date, datetime
from enum import Enum
import re


class GenderEnum(str, Enum):
    male = "male"
    female = "female"
    other = "other"


class MembershipEnum(str, Enum):
    monthly = "monthly"
    quarterly = "quarterly"
    semiannual = "semiannual"
    annual = "annual"


# ─── Δημιουργία Μέλους ────────────────────────────────────────────
class MemberCreate(BaseModel):
    first_name: str
    last_name: str
    phone: str
    email: EmailStr
    birth_date: Optional[date] = None
    gender: Optional[GenderEnum] = None
    membership_type: MembershipEnum = MembershipEnum.monthly
    notes: Optional[str] = None

    @field_validator("first_name", "last_name")
    @classmethod
    def not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Το πεδίο δεν μπορεί να είναι κενό")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        v = v.strip().replace(" ", "").replace("-", "")
        pattern = r"^(\+30|0030|0)?[267]\d{9}$"
        if not re.match(pattern, v):
            raise ValueError("Μη έγκυρος ελληνικός αριθμός τηλεφώνου")
        return v


# ─── Ενημέρωση Μέλους ────────────────────────────────────────────
class MemberUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    birth_date: Optional[date] = None
    gender: Optional[GenderEnum] = None
    membership_type: Optional[MembershipEnum] = None
    notes: Optional[str] = None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip().replace(" ", "").replace("-", "")
        pattern = r"^(\+30|0030|0)?[267]\d{9}$"
        if not re.match(pattern, v):
            raise ValueError("Μη έγκυρος ελληνικός αριθμός τηλεφώνου")
        return v


# ─── Response Μέλους ─────────────────────────────────────────────
class MemberResponse(BaseModel):
    id: int
    member_code: str
    first_name: str
    last_name: str
    phone: str
    email: str
    birth_date: Optional[date]
    gender: Optional[GenderEnum]
    membership_type: MembershipEnum
    qr_code_path: Optional[str]
    notes: Optional[str]
    registration_date: datetime
    welcome_email_sent: str

    model_config = {"from_attributes": True}


# ─── Αποστολή Email ──────────────────────────────────────────────
class SendEmailRequest(BaseModel):
    member_id: int
    custom_message: Optional[str] = None  # προαιρετικό custom κείμενο


# ─── Αναζήτηση ───────────────────────────────────────────────────
class SearchParams(BaseModel):
    q: Optional[str] = None
    membership_type: Optional[MembershipEnum] = None
    skip: int = 0
    limit: int = 50
