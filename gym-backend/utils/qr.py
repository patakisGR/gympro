import qrcode
import qrcode.image.svg
from pathlib import Path
import os


QR_DIR = Path("static/qrcodes")
QR_DIR.mkdir(parents=True, exist_ok=True)


def generate_qr_code(member_code: str) -> str:
    """
    Παράγει QR Code για το member_code και το αποθηκεύει ως PNG.
    Επιστρέφει το path του αρχείου.
    """
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(member_code)
    qr.make(fit=True)

    img = qr.make_image(fill_color="#003F87", back_color="white")

    filename = f"{member_code}.png"
    filepath = QR_DIR / filename
    img.save(str(filepath))

    return str(filepath)


def get_qr_code_path(member_code: str) -> str:
    """Επιστρέφει το path αν υπάρχει ήδη, αλλιώς δημιουργεί νέο."""
    filepath = QR_DIR / f"{member_code}.png"
    if filepath.exists():
        return str(filepath)
    return generate_qr_code(member_code)


def delete_qr_code(member_code: str) -> None:
    """Διαγράφει το QR Code αρχείο."""
    filepath = QR_DIR / f"{member_code}.png"
    if filepath.exists():
        os.remove(filepath)
