const fs = require('fs');
const files = ['landing.html', 'login.html', 'signup.html', 'index.html', 'pricing.html'];

const supabaseBlock = `
    <!-- Supabase SDK -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script>
        const SUPABASE_URL = 'REPLACE_WITH_YOUR_URL';
        const SUPABASE_ANON_KEY = 'REPLACE_WITH_YOUR_KEY';

        const { createClient } = supabase;
        const _sb = createClient(
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
    </script>
`;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (!content.includes('<!-- Supabase SDK -->')) {
        content = content.replace('</head>', supabaseBlock + '</head>');
        
        // Also replace lf_ to fz_
        content = content.replace(/lf_/g, 'fz_');
        
        fs.writeFileSync(file, content);
    }
});
