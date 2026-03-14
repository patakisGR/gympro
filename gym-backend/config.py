from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "sqlite:///./gym.db"

    # Email
    EMAIL_PROVIDER: str = "gmail"  # "gmail" ή "sendgrid"
    GYM_NAME: str = "GymPro"
    GYM_EMAIL: str = "info@gymname.gr"
    GYM_PHONE: str = "210-1234567"
    GYM_ADDRESS: str = ""
    GYM_HOURS: str = "07:00 - 23:00"

    # Gmail
    GMAIL_USER: str = ""
    GMAIL_APP_PASSWORD: str = ""

    # SendGrid
    SENDGRID_API_KEY: str = ""

    # Anthropic
    ANTHROPIC_API_KEY: str = ""

    # App
    SECRET_KEY: str = "change-me-in-production"
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    @property
    def allowed_origins_list(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
