import smtplib
import base64
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
from pathlib import Path
from typing import Optional
import httpx

from config import settings


MEMBERSHIP_LABELS = {
    "monthly": "Μηνιαία (40€/μήνα)",
    "quarterly": "Τριμηνιαία (105€/3μηνο)",
    "semiannual": "Εξαμηνιαία (190€/6μηνο)",
    "annual": "Ετήσια (350€/έτος)",
}


def build_email_html(member_data: dict) -> tuple[str, str]:
    name = f"{member_data['first_name']} {member_data['last_name']}"
    membership = MEMBERSHIP_LABELS.get(member_data["membership_type"], member_data["membership_type"])
    reg_date = member_data["registration_date"].strftime("%d/%m/%Y") if hasattr(member_data["registration_date"], "strftime") else str(member_data["registration_date"])
    code = member_data["member_code"]
    gym = settings.GYM_NAME
    qr_url = f"https://api.qrserver.com/v1/create-qr-code/?size=160x160&data={code}&color=003F87"

    html = f"""
<!DOCTYPE html>
<html lang="el">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f0f4fa;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.1);">
    <div style="background:linear-gradient(135deg,#003F87,#1565C0);padding:40px 32px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:28px;font-weight:800;">💪 {gym}</h1>
      <p style="color:rgba(255,255,255,.8);margin:8px 0 0;font-size:15px;">Καλώς ήρθατε στην οικογένειά μας!</p>
    </div>
    <div style="padding:36px 32px;">
      <h2 style="color:#0F172A;font-size:22px;margin:0 0 8px;">Γεια σας, {member_data['first_name']}! 🎉</h2>
      <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 24px;">
        Η εγγραφή σας στο <strong>{gym}</strong> ολοκληρώθηκε επιτυχώς.
      </p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px;margin-bottom:24px;">
        <h3 style="color:#003F87;font-size:14px;text-transform:uppercase;letter-spacing:.5px;margin:0 0 14px;">📋 Στοιχεία Μέλους</h3>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="color:#64748B;padding:6px 0;">Ονοματεπώνυμο</td><td style="font-weight:600;text-align:right;">{name}</td></tr>
          <tr><td style="color:#64748B;padding:6px 0;border-top:1px solid #e2e8f0;">Κωδικός Μέλους</td><td style="font-weight:600;text-align:right;font-family:monospace;color:#003F87;">{code}</td></tr>
          <tr><td style="color:#64748B;padding:6px 0;border-top:1px solid #e2e8f0;">Τύπος Συνδρομής</td><td style="font-weight:600;text-align:right;">{membership}</td></tr>
          <tr><td style="color:#64748B;padding:6px 0;border-top:1px solid #e2e8f0;">Ημερομηνία Εγγραφής</td><td style="font-weight:600;text-align:right;">{reg_date}</td></tr>
        </table>
      </div>
      <div style="background:#EBF5FF;border:1px solid #BFDBFE;border-radius:10px;padding:20px;margin-bottom:24px;text-align:center;">
        <h3 style="color:#003F87;font-size:14px;text-transform:uppercase;letter-spacing:.5px;margin:0 0 8px;">🔲 Το Προσωπικό σας QR Code</h3>
        <p style="color:#1E40AF;font-size:13px;margin:0 0 14px;">Σαρώστε το QR Code για είσοδο στο γυμναστήριο.</p>
        <img src="{qr_url}" alt="QR Code" style="width:160px;height:160px;border:4px solid #fff;border-radius:8px;" />
        <p style="color:#64748B;font-size:11px;margin:10px 0 0;font-family:monospace;">{code}</p>
      </div>
      <div style="background:#ECFDF5;border:1px solid #A7F3D0;border-radius:10px;padding:16px;margin-bottom:24px;">
        <h3 style="color:#065F46;font-size:14px;margin:0 0 10px;">ℹ️ Χρήσιμες Πληροφορίες</h3>
        <p style="color:#047857;font-size:13px;margin:4px 0;">🕐 <strong>Ωράριο:</strong> {settings.GYM_HOURS} (Καθημερινά)</p>
        <p style="color:#047857;font-size:13px;margin:4px 0;">📞 <strong>Τηλέφωνο:</strong> {settings.GYM_PHONE}</p>
        <p style="color:#047857;font-size:13px;margin:4px 0;">📧 <strong>Email:</strong> {settings.GYM_EMAIL}</p>
      </div>
    </div>
    <div style="background:#f8fafc;padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0;">
      <p style="color:#94A3B8;font-size:12px;margin:0;">© {gym} · {settings.GYM_EMAIL}</p>
    </div>
  </div>
</body>
</html>
"""

    plain = f"""Γεια σας {member_data['first_name']},

Η εγγραφή σας στο {gym} ολοκληρώθηκε επιτυχώς!

Κωδικός Μέλους: {code}
Τύπος Συνδρομής: {membership}
Ημερομηνία Εγγραφής: {reg_date}

Ωράριο: {settings.GYM_HOURS} (Καθημερινά)
Τηλέφωνο: {settings.GYM_PHONE}

Ευχαριστούμε!
Η Ομάδα του {gym}
"""
    return html, plain


async def send_welcome_email(member_data: dict, qr_code_path: str) -> bool:
    provider = settings.EMAIL_PROVIDER.lower()
    if provider == "gmail":
        return await _send_via_gmail(member_data, qr_code_path)
    elif provider == "sendgrid":
        return await _send_via_sendgrid(member_data, qr_code_path)
    elif provider == "mailersend":
        return await _send_via_mailersend(member_data, qr_code_path)
    else:
        raise ValueError(f"Άγνωστος EMAIL_PROVIDER: {provider}")


async def _send_via_gmail(member_data: dict, qr_code_path: str) -> bool:
    html_body, plain_body = build_email_html(member_data)
    msg = MIMEMultipart("related")
    msg["Subject"] = f"Καλώς ήρθατε στο {settings.GYM_NAME}! 💪"
    msg["From"] = f"{settings.GYM_NAME} <{settings.GMAIL_USER}>"
    msg["To"] = member_data["email"]
    alternative = MIMEMultipart("alternative")
    alternative.attach(MIMEText(plain_body, "plain", "utf-8"))
    alternative.attach(MIMEText(html_body, "html", "utf-8"))
    msg.attach(alternative)
    qr_path = Path(qr_code_path)
    if qr_path.exists():
        with open(qr_path, "rb") as f:
            img = MIMEImage(f.read(), "png")
            img.add_header("Content-ID", "<qrcode>")
            img.add_header("Content-Disposition", "inline", filename=f"{member_data['member_code']}_QR.png")
            msg.attach(img)
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(settings.GMAIL_USER, settings.GMAIL_APP_PASSWORD)
            server.sendmail(settings.GMAIL_USER, member_data["email"], msg.as_string())
        return True
    except Exception as e:
        print(f"Gmail error: {e}")
        return False


async def _send_via_sendgrid(member_data: dict, qr_code_path: str) -> bool:
    html_body, plain_body = build_email_html(member_data)
    attachments = []
    qr_path = Path(qr_code_path)
    if qr_path.exists():
        with open(qr_path, "rb") as f:
            encoded = base64.b64encode(f.read()).decode()
        attachments.append({
            "content": encoded,
            "type": "image/png",
            "filename": f"{member_data['member_code']}_QR.png",
            "disposition": "attachment",
        })
    payload = {
        "personalizations": [{"to": [{"email": member_data["email"], "name": f"{member_data['first_name']} {member_data['last_name']}"}]}],
        "from": {"email": settings.GYM_EMAIL, "name": settings.GYM_NAME},
        "subject": f"Καλώς ήρθατε στο {settings.GYM_NAME}! 💪",
        "content": [
            {"type": "text/plain", "value": plain_body},
            {"type": "text/html", "value": html_body},
        ],
        "attachments": attachments,
    }
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api.sendgrid.com/v3/mail/send",
                json=payload,
                headers={"Authorization": f"Bearer {settings.SENDGRID_API_KEY}", "Content-Type": "application/json"},
                timeout=10.0,
            )
        return resp.status_code in (200, 202)
    except Exception as e:
        print(f"SendGrid error: {e}")
        return False


async def _send_via_mailersend(member_data: dict, qr_code_path: str) -> bool:
    """Αποστολή μέσω MailerSend API (HTTPS - λειτουργεί στο Railway)."""
    html_body, plain_body = build_email_html(member_data)

    payload = {
        "from": {
            "email": settings.GYM_EMAIL,
            "name": settings.GYM_NAME,
        },
        "to": [
            {
                "email": member_data["email"],
                "name": f"{member_data['first_name']} {member_data['last_name']}",
            }
        ],
        "subject": f"Καλώς ήρθατε στο {settings.GYM_NAME}! 💪",
        "text": plain_body,
        "html": html_body,
    }

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api.mailersend.com/v1/email",
                json=payload,
                headers={
                    "Authorization": f"Bearer {settings.MAILERSEND_API_KEY}",
                    "Content-Type": "application/json",
                },
                timeout=15.0,
            )
        if resp.status_code in (200, 202):
            print(f"MailerSend: Email εστάλη στο {member_data['email']}")
            return True
        else:
            print(f"MailerSend error: {resp.status_code} - {resp.text}")
            return False
    except Exception as e:
        print(f"MailerSend error: {e}")
        return False