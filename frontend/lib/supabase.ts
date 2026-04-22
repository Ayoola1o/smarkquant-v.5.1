import { createClient } from '@supabase/supabase-js';

// Supabase configuration - load from environment variables
// ℹ️ Note: NEXT_PUBLIC_SUPABASE_ANON_KEY is intentionally public
// This is the Supabase anonymous key (not a secret), designed for browser use
// It has limited permissions controlled by Row-Level Security (RLS) policies
// See: https://supabase.com/docs/guides/api/rest/overview#authentication
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create client with available credentials (may be empty strings during build)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'sb-fwgwlkrupkxgmdgkqqxh-auth-token'
  },
  // Better network resilience
  global: {
    headers: {
      'Content-Type': 'application/json',
    }
  },
  // Increase timeout for more reliable connections
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  }
});

// Validate credentials only when actually trying to use the client
const validateSupabaseConfig = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }
};

// Log configuration status for debugging
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('Supabase Configuration:', {
    url: supabaseUrl,
    keyLength: supabaseAnonKey.length,
    configured: !!(supabaseUrl && supabaseAnonKey)
  });
}

export { validateSupabaseConfig };
export default supabase;
