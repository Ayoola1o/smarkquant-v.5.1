import os

def get_db_path() -> str:
    env_path = os.environ.get("DB_PATH", "")
    if env_path:
        os.makedirs(os.path.dirname(env_path), exist_ok=True)
        return env_path
    return os.path.join(os.path.dirname(__file__), "market_data.db")

DB_PATH = get_db_path()
