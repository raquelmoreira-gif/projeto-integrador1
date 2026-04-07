import os

from dotenv import load_dotenv

load_dotenv()


class Config:
    SUPABASE_URL = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
    FLASK_ENV = os.getenv("FLASK_ENV", "development")

    @classmethod
    def validate(cls) -> None:
        if not cls.SUPABASE_URL or not cls.SUPABASE_KEY:
            raise ValueError(
                "SUPABASE_URL e SUPABASE_KEY devem estar configurados no .env"
            )
