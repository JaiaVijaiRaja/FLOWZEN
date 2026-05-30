const fs = require('fs');

['landing.html', 'index.html'].forEach(filepath => {
  let html = fs.readFileSync(filepath, 'utf8');

  // Fix literal \n inside HTML
  html = html.replace(/\\n/g, '\n');

  fs.writeFileSync(filepath, html);
});
