const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const DOMContentLoadedLogic = `document.addEventListener(
  'DOMContentLoaded', async function() {
  
  // Safety timeout — if auth check 
  // takes more than 5 seconds,
  // something is wrong, just load the page
  const safetyTimer = setTimeout(() => {
    console.warn(
      'Auth check timed out — loading anyway');
    if (typeof initApp === 'function') {
      initApp();
    }
  }, 5000);
  
  try {
    // Check Supabase session
    const { data: { session } } = 
      await window._sb.auth.getSession();
    
    clearTimeout(safetyTimer);
    
    if (session) {
      const { data: profile } = await window._sb
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (profile) {
        localStorage.setItem(
          'fz_current_user',
          profile.username);
        localStorage.setItem(
          'fz_is_admin',
          profile.is_admin ? 
            'true' : 'false');
      }
      
      if (typeof initApp === 'function') {
        initApp();
      }
      
    } else {
      const localUser = localStorage.getItem(
        'fz_current_user');
      
      if (!localUser) {
        // Only redirect if this is index.html
        // landing.html should never redirect
        if (window.location.pathname
            .includes('index') || window.location.pathname === '/') {
          window.location.replace(
            'landing.html');
        }
        return;
      }
      
      if (typeof initApp === 'function') {
        initApp();
      }
    }
    
  } catch(err) {
    clearTimeout(safetyTimer);
    console.error('Auth error:', err);
    
    // Even if Supabase fails,
    // still load the page
    const localUser = localStorage.getItem(
      'fz_current_user');
    
    if (!localUser && 
        (window.location.pathname
          .includes('index') || window.location.pathname === '/')) {
      window.location.replace('landing.html');
    } else {
      if (typeof initApp === 'function') {
        initApp();
      }
    }
  }
});
`;

const quoteLogic = `// 6. Quotes
        const quotesList = [
            "The expert in anything was once a beginner. — Helen Hayes",
            "An investment in knowledge pays the best interest. — Benjamin Franklin",
            "Learning never exhausts the mind. — Leonardo da Vinci",
            "The more that you read, the more things you will know. — Dr. Seuss",
            "Education is not the filling of a pail, but the lighting of a fire. — W.B. Yeats",
            "Live as if you were to die tomorrow. Learn as if you were to live forever. — Gandhi",
            "The beautiful thing about learning is nobody can take it away from you. — B.B. King",
            "It does not matter how slowly you go as long as you do not stop. — Confucius"
        ];
        
        window.renderMotivationalQuote = function() {
            const qc = document.getElementById('quote-container-wrapper');
            const prefQuotes = document.getElementById('pref-quotes');
            if(!qc) return;
            if(prefQuotes && !prefQuotes.checked) {
                qc.innerHTML = '';
                return;
            }
            const q = quotesList[Math.floor(Math.random() * quotesList.length)].split(' — ');
            
            if(q.length === 2) {
                qc.innerHTML = '<div class="quote-card"><div class="quote-text">"' + q[0] + '"</div><div class="quote-author">— ' + q[1] + '</div></div>';
            } else {
                qc.innerHTML = '<div class="quote-card"><div class="quote-text">"' + q[0] + '"</div></div>';
            }
        }`;

// Find `// Run boot sequence` or the old `DOMContentLoaded`
let idx = html.indexOf('// Run boot sequence');
if (idx === -1) {
    idx = html.indexOf('// 6. Quotes');
}

let before = html.substring(0, idx);
// remove all bad ones from before
before = before.replace(/document\.addEventListener\(?\s*'DOMContentLoaded'[^;]*\bcatch\b[^;]*\)\s*;\s*\}\s*else\s*\{\s*initApp\(\);\s*\}\s*\}\s*\}\);\s*\}\);/g, '');
before = before.replace(/document\.addEventListener\(\n  'DOMContentLoaded', async function\(\) \{[\s\S]*$/, '');
before = before.replace(/document\.addEventListener\('DOMContentLoaded', async function\(\) \{[\s\S]*$/, '');


// find what's after Quote logic
let idx2 = html.lastIndexOf('qc.innerHTML = \'<div class="quote-card"><div class="quote-text">"\' + q[0] + \'"</div></div>\';\n            }\n        }');
let after = '';
if (idx2 !== -1) {
    after = html.substring(idx2 + 'qc.innerHTML = \'<div class="quote-card"><div class="quote-text">"\' + q[0] + \'"</div></div>\';\n            }\n        }'.length);
} else {
    // try finding </script>
    idx2 = html.lastIndexOf('</script>');
    after = html.substring(idx2);
}

// Assemble
html = before + "\n\n        " + DOMContentLoadedLogic + "\n\n        " + quoteLogic + "\n\n        " + after;

fs.writeFileSync('index.html', html);
