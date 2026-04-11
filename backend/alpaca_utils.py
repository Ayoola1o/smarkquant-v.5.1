import os
from supabase_config import get_supabase_client


def get_alpaca_credentials():
    """Return Alpaca API key and secret from supported env var names.

    Priority:
    1. ALPACA_API_KEY / ALPACA_SECRET_KEY
    2. APCA_API_KEY_ID / APCA_API_SECRET_KEY
    """
    api_key = os.getenv("ALPACA_API_KEY") or os.getenv("APCA_API_KEY_ID")
    secret_key = os.getenv("ALPACA_SECRET_KEY") or os.getenv("APCA_API_SECRET_KEY")

    if not api_key or not secret_key:
        return None, None

    return api_key.strip(), secret_key.strip()


def get_user_alpaca_credentials(user_id: str):
    """Fetch user-specific Alpaca credentials from Supabase profile.
    
    Args:
        user_id: The UUID of the user
        
    Returns:
        tuple: (api_key, secret_key) or (None, None) if not found
    """
    try:
        supabase = get_supabase_client()
        
        response = supabase.from_("user_profiles").select(
            "alpaca_api_key, alpaca_secret_key"
        ).eq("id", user_id).single().execute()
        
        if response.data:
            api_key = response.data.get("alpaca_api_key")
            secret_key = response.data.get("alpaca_secret_key")
            
            if api_key and secret_key:
                return api_key.strip(), secret_key.strip()
    except Exception as e:
        print(f"Error fetching user Alpaca credentials from Supabase: {e}")
    
    return None, None


def alpaca_keys_configured():
    api_key, secret_key = get_alpaca_credentials()
    return bool(api_key and secret_key)
