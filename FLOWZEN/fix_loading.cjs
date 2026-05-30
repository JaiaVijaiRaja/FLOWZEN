const fs = require('fs');

const loadingHtml = `<div id="loadingScreen" style="
  position: fixed;
  inset: 0;
  background: #09090f;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  transition: opacity 0.5s ease;">
  
  <div style="
    font-family: 'Plus Jakarta Sans', 
      sans-serif;
    font-size: 48px;
    font-weight: 800;
    background: linear-gradient(
      135deg, #7c6bff, #ff6b9d);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 40px;
    letter-spacing: -1px;">
    FlowZen
  </div>
  
  <div style="
    width: 200px;
    height: 3px;
    background: rgba(255,255,255,0.1);
    border-radius: 99px;
    overflow: hidden;">
    <div id="loadingBar" style="
      height: 100%;
      width: 0%;
      background: linear-gradient(
        90deg, #7c6bff, #ff6b9d);
      border-radius: 99px;
      transition: width 0.1s linear;">
    </div>
  </div>
</div>`;

const loadingCss = `<style>
#loadingScreen {
  pointer-events: none;
}

#loadingScreen.hidden {
  opacity: 0;
  pointer-events: none;
}
</style>
`;

const loadingJs = `
// ===== LOADING SCREEN =====
// Runs immediately, no conditions
(function() {
  const screen = document.getElementById(
    'loadingScreen');
  const bar = document.getElementById(
    'loadingBar');
  
  // Safety check — if elements don't 
  // exist, skip loading screen entirely
  if (!screen) return;
  
  let progress = 0;
  
  // Animate progress bar
  const progressTimer = setInterval(() => {
    progress += 4;
    if (bar) {
      bar.style.width = 
        Math.min(progress, 100) + '%';
    }
    if (progress >= 100) {
      clearInterval(progressTimer);
    }
  }, 60); // 60ms x 25 steps = 1.5 seconds
  
  // Hide loading screen after 1.6 seconds
  // No conditions, always runs
  setTimeout(() => {
    // Clear the progress timer 
    // just in case
    clearInterval(progressTimer);
    if (bar) bar.style.width = '100%';
    
    // Fade out loading screen
    if (screen) {
      screen.style.opacity = '0';
      screen.style.transition = 
        'opacity 0.4s ease';
      
      // Remove from DOM after fade
      setTimeout(() => {
        if (screen && screen.parentNode) {
          screen.style.display = 'none';
          screen.parentNode.removeChild(
            screen);
        }
      }, 400);
    }
    
    console.log('Loading screen removed ✓');
    
  }, 1600); // 1.6 seconds total
  
})(); // Self-executing — runs immediately
// ===== END LOADING SCREEN =====
`;

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
});`;

['landing.html', 'index.html'].forEach(filepath => {
  let html = fs.readFileSync(filepath, 'utf8');

  // 1. HTML
  html = html.replace(/<div id="loading-screen">[\s\S]*?<\/div>\s*<\/div>/, ''); 
  html = html.replace(/<div id="loading-screen">\s*<div class="loading-logo"><span class="gradient-text">FlowZen<\/span><\/div>\s*<div class="loading-bar-wrap"><div class="loading-bar-fill"><\/div><\/div>\s*<\/div>/g, '');

  // Add at top inside body
  if (!html.includes('id="loadingScreen"')) {
    html = html.replace(/<body>([ \t]*\n*)/, '<body>$1' + loadingHtml + '\\n');
  }

  // 2. CSS
  if (!html.includes('id="loadingScreen" {')) {
    html = html.replace(/<\/head>/, loadingCss + '\\n</head>');
  }

  // 3. JS
  if (!html.includes('// ===== LOADING SCREEN =====')) {
    html = html.replace(/<script>/, '<script>\\n' + loadingJs);
  }

  // 4. Index.html DOMContentLoaded
  if (filepath === 'index.html') {
    const oldBlock = /document\.addEventListener\('DOMContentLoaded',\s*async function\(\)\s*\{[\s\S]*?\}\);\n(\s*\}\s*catch\(err\)\s*\{\s*console\.error\('Auth error:', err\);[\s\S]*?\}\n\}\);)/;
    html = html.replace(oldBlock, DOMContentLoadedLogic);
    
    // Sometimes the regex might not match exactly. Better to use indexOf.
    const startPattern = "document.addEventListener('DOMContentLoaded', async function() {";
    let startIdx = html.indexOf(startPattern);
    if (startIdx !== -1) {
        // find matching end
        let endIdx = html.indexOf('// 6. Quotes');
        if (endIdx !== -1) {
            html = html.substring(0, startIdx) + DOMContentLoadedLogic + "\\n\\n        " + html.substring(endIdx);
        }
    }
  }

  // Double check the loader reference
  html = html.replace(/const loader = document\.getElementById\('loader'\);/g, "const loader = document.getElementById('loadingScreen');");

  fs.writeFileSync(filepath, html);
});
