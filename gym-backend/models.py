from sqlalchemy import Column, Integer, String, Date, DateTime, Text, Enum
from sqlalchemy.sql import func
from database import Base
import enum


class GenderEnum(str, enum.Enum):
    male = "male"
    female = "female"
    other = "other"


class MembershipEnum(str, enum.Enum):
    monthly = "monthly"
    quarterly = "quarterly"
    semiannual = "semiannual"
    annual = "annual"


class Member(Base):
    __tablename__ = "members"

    id = Column(Integer, primary_key=True, index=True)
    member_code = Column(String(20), unique=True, index=True, nullable=False)  # π.χ. GYMABC123

    # Προσωπικά στοιχεία
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    email = Column(String(255), nullable=False, unique=True, index=True)
    birth_date = Column(Date, nullable=True)
    gender = Column(Enum(GenderEnum), nullable=True)

    # Συνδρομή
    membership_type = Column(Enum(MembershipEnum), nullable=False, default=MembershipEnum.monthly)

    # QR Code
    qr_code_path = Column(String(500), nullable=True)  # path στο αρχείο

    # Σημειώσεις
    notes = Column(Text, nullable=True)

    # Timestamps
    registration_date = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Email status
    welcome_email_sent = Column(String(1), default="N")  # Y / N
