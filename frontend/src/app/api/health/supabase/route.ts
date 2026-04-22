import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return Response.json({
        status: 'error',
        message: 'Supabase environment variables are not configured',
        configured: {
          url: !!supabaseUrl,
          key: !!supabaseAnonKey
        }
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Test the connection by attempting to get auth config
    const { data, error } = await supabase.auth.getSession();

    if (error && error.message !== 'Auth session missing!') {
      return Response.json({
        status: 'error',
        message: error.message,
        details: error
      }, { status: 500 });
    }

    return Response.json({
      status: 'success',
      message: 'Supabase connection is working',
      supabaseUrl: supabaseUrl,
      configured: true
    });
  } catch (error) {
    console.error('Supabase health check error:', error);
    return Response.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      error: error
    }, { status: 500 });
  }
}
