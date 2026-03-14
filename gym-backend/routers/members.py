from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
import string
import random
from datetime import datetime

from database import get_db
import models, schemas
from utils.qr import generate_qr_code, delete_qr_code
from utils.email import send_welcome_email

router = APIRouter(prefix="/members", tags=["Μέλη"])


def generate_member_code() -> str:
    """Δημιουργεί μοναδικό κωδικό μέλους π.χ. GYMABC123."""
    chars = string.ascii_uppercase + string.digits
    suffix = "".join(random.choices(chars, k=8))
    return f"GYM{suffix}"


async def send_email_background(member: models.Member, db: Session):
    """Background task για αποστολή email."""
    if not member.qr_code_path:
        return

    member_data = {
        "first_name": member.first_name,
        "last_name": member.last_name,
        "email": member.email,
        "member_code": member.member_code,
        "membership_type": member.membership_type.value,
        "registration_date": member.registration_date,
    }

    success = await send_welcome_email(member_data, member.qr_code_path)

    if success:
        member.welcome_email_sent = "Y"
        db.commit()


# ─── CREATE ──────────────────────────────────────────────────────
@router.post("/", response_model=schemas.MemberResponse, status_code=201)
async def create_member(
    member_in: schemas.MemberCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Δημιουργία νέου μέλους με αυτόματο QR Code και email."""

    # Έλεγχος αν υπάρχει ήδη το email
    existing = db.query(models.Member).filter(models.Member.email == member_in.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Υπάρχει ήδη μέλος με αυτό το email.")

    # Δημιουργία μοναδικού κωδικού
    member_code = generate_member_code()
    while db.query(models.Member).filter(models.Member.member_code == member_code).first():
        member_code = generate_member_code()

    # Δημιουργία QR Code
    qr_path = generate_qr_code(member_code)

    # Αποθήκευση στη βάση
    db_member = models.Member(
        member_code=member_code,
        first_name=member_in.first_name,
        last_name=member_in.last_name,
        phone=member_in.phone,
        email=member_in.email,
        birth_date=member_in.birth_date,
        gender=member_in.gender,
        membership_type=member_in.membership_type,
        notes=member_in.notes,
        qr_code_path=qr_path,
        welcome_email_sent="N",
    )
    db.add(db_member)
    db.commit()
    db.refresh(db_member)

    # Αποστολή email στο background (δεν καθυστερεί την απάντηση)
    background_tasks.add_task(send_email_background, db_member, db)

    return db_member


# ─── READ ALL ────────────────────────────────────────────────────
@router.get("/", response_model=List[schemas.MemberResponse])
def get_members(
    q: Optional[str] = Query(None, description="Αναζήτηση με όνομα, επώνυμο, τηλέφωνο, email"),
    membership_type: Optional[schemas.MembershipEnum] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """Λίστα μελών με δυνατότητα αναζήτησης και φιλτραρίσματος."""
    query = db.query(models.Member)

    if q:
        search = f"%{q}%"
        query = query.filter(
            or_(
                models.Member.first_name.ilike(search),
                models.Member.last_name.ilike(search),
                models.Member.phone.ilike(search),
                models.Member.email.ilike(search),
                models.Member.member_code.ilike(search),
            )
        )

    if membership_type:
        query = query.filter(models.Member.membership_type == membership_type)

    query = query.order_by(models.Member.registration_date.desc())

    return query.offset(skip).limit(limit).all()


# ─── READ ONE ────────────────────────────────────────────────────
@router.get("/{member_id}", response_model=schemas.MemberResponse)
def get_member(member_id: int, db: Session = Depends(get_db)):
    """Στοιχεία ενός μέλους."""
    member = db.query(models.Member).filter(models.Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Το μέλος δεν βρέθηκε.")
    return member


# ─── UPDATE ──────────────────────────────────────────────────────
@router.patch("/{member_id}", response_model=schemas.MemberResponse)
def update_member(
    member_id: int,
    member_in: schemas.MemberUpdate,
    db: Session = Depends(get_db),
):
    """Ενημέρωση στοιχείων μέλους."""
    member = db.query(models.Member).filter(models.Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Το μέλος δεν βρέθηκε.")

    # Έλεγχος duplicate email αν αλλάζει
    if member_in.email and member_in.email != member.email:
        existing = db.query(models.Member).filter(models.Member.email == member_in.email).first()
        if existing:
            raise HTTPException(status_code=409, detail="Υπάρχει ήδη μέλος με αυτό το email.")

    update_data = member_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(member, field, value)

    db.commit()
    db.refresh(member)
    return member


# ─── DELETE ──────────────────────────────────────────────────────
@router.delete("/{member_id}", status_code=204)
def delete_member(member_id: int, db: Session = Depends(get_db)):
    """Διαγραφή μέλους και QR Code."""
    member = db.query(models.Member).filter(models.Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Το μέλος δεν βρέθηκε.")

    # Διαγραφή QR αρχείου
    delete_qr_code(member.member_code)

    db.delete(member)
    db.commit()
    return None


# ─── RESEND EMAIL ─────────────────────────────────────────────────
@router.post("/{member_id}/send-email")
async def resend_welcome_email(
    member_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Επαναποστολή email καλωσορίσματος."""
    member = db.query(models.Member).filter(models.Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Το μέλος δεν βρέθηκε.")

    background_tasks.add_task(send_email_background, member, db)
    return {"message": f"Το email αποστέλλεται στο {member.email}"}


# ─── STATS ───────────────────────────────────────────────────────
@router.get("/stats/summary")
def get_stats(db: Session = Depends(get_db)):
    """Στατιστικά για το dashboard."""
    from sqlalchemy import func
    from datetime import date

    total = db.query(func.count(models.Member.id)).scalar()

    # Εγγραφές τρέχοντα μήνα
    today = date.today()
    this_month = db.query(func.count(models.Member.id)).filter(
        func.strftime("%Y-%m", models.Member.registration_date) == today.strftime("%Y-%m")
    ).scalar()

    # Ανά τύπο συνδρομής
    by_type = {}
    for mt in models.MembershipEnum:
        count = db.query(func.count(models.Member.id)).filter(
            models.Member.membership_type == mt
        ).scalar()
        by_type[mt.value] = count

    return {
        "total_members": total,
        "new_this_month": this_month,
        "by_membership_type": by_type,
    }
