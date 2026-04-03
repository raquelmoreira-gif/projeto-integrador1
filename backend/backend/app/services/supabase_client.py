from supabase import Client, create_client

from app.config import Config

_client: Client | None = None


def get_supabase() -> Client:
    global _client

    if _client is None:
        Config.validate()
        _client = create_client(Config.SUPABASE_URL, Config.SUPABASE_KEY)

    return _client
