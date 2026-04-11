import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
root_env = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))
load_dotenv(dotenv_path=root_env, override=False)

# Supabase configuration
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise ValueError("Missing Supabase environment variables")

# Create Supabase client with service role key (for server-side operations)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

def get_supabase_client() -> Client:
    """Get the Supabase client instance"""
    return supabase

def verify_supabase_token(token: str) -> dict:
    """Verify Supabase JWT token and return user information"""
    try:
        # Use Supabase's built-in JWT verification
        from supabase.lib.auth import Auth
        auth = Auth(supabase)
        user = auth.get_user(token)
        return {
            'user_id': user.id,
            'email': user.email,
            'role': user.role,
        }
    except Exception as e:
        raise ValueError(f"Invalid token: {str(e)}")

# Initialize database tables if they don't exist
def init_database():
    """Initialize database tables and policies"""
    try:
        # This would typically be done via SQL migrations
        # For now, we'll assume tables are created via Supabase dashboard
        pass
    except Exception as e:
        print(f"Database initialization warning: {e}")

# Call init on import
init_database()