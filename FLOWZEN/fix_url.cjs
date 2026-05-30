const fs = require('fs');
['landing.html', 'login.html', 'signup.html', 'index.html', 'pricing.html'].forEach(f => {
  let html = fs.readFileSync(f, 'utf8');
  let newHtml = html.replace(
      "const SUPABASE_URL = 'REPLACE_WITH_YOUR_URL';", 
      "const SUPABASE_URL = 'https://replace-me.supabase.co'; // REPLACE_WITH_YOUR_URL"
  );
  
  // also add window._sb to ensure global and use var or let?
  // Actually, let's change \`const _sb =\` to \`window._sb =\` just to be safe.
  
  newHtml = newHtml.replace("const _sb = createClient(", "window._sb = createClient(");

  fs.writeFileSync(f, newHtml);
});
