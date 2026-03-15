from pathlib import Path

QR_DIR = Path("static/qrcodes")
QR_DIR.mkdir(parents=True, exist_ok=True)


def get_qr_url(member_code: str) -> str:
    """Επιστρέφει URL για QR Code μέσω εξωτερικής υπηρεσίας."""
    return f"https://api.qrserver.com/v1/create-qr-code/?size=180x180&data={member_code}&color=003F87"


def generate_qr_code(member_code: str) -> str:
    """Επιστρέφει το QR Code URL (δεν αποθηκεύει αρχείο)."""
    return get_qr_url(member_code)


def get_qr_code_path(member_code: str) -> str:
    return get_qr_url(member_code)


def delete_qr_code(member_code: str) -> None:
    """Δεν χρειάζεται διαγραφή αφού δεν αποθηκεύουμε αρχείο."""
    pass