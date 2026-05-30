
        const SUPABASE_URL = 'https://replace-me.supabase.co'; // REPLACE_WITH_YOUR_URL
        const SUPABASE_ANON_KEY = 'REPLACE_WITH_YOUR_KEY';

        const { createClient } = supabase;
        window._sb = createClient(
            SUPABASE_URL,
            SUPABASE_ANON_KEY,
            {
                auth: {
                    autoRefreshToken: true,
                    persistSession: true,
                    detectSessionInUrl: true
                }
            }
        );
        console.log('FlowZen + Supabase ✓');
    