

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
    