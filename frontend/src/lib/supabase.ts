import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase configuration - load from environment variables
// NEXT_PUBLIC_SUPABASE_ANON_KEY is safe for browser use (limited by RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create client with available credentials
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
    }
  }
});

// Validate credentials only when actually trying to use the client
export const validateSupabaseConfig = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }
};

// Log configuration status for debugging
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('Supabase Configuration:', {
    url: supabaseUrl,
    configured: !!(supabaseUrl && supabaseAnonKey)
  });
}

export default supabase;
