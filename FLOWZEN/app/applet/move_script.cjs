const fs = require('fs');

['index.html', 'landing.html'].forEach(file => {
  let html = fs.readFileSync(file, 'utf8');

  // Extract the loading screen script logic
  const scriptRegex = /\/\/\ ===== LOADING SCREEN =====[\s\S]*?\/\/ ===== END LOADING SCREEN =====/;
  const match = html.match(scriptRegex);
  
  if (match) {
    // Remove it from its original place
    html = html.replace(scriptRegex, '');
    
    // Find where the loading screen div ends
    const loadingScreenDivRegex = /<div id=\"loadingScreen\"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;
    
    const divMatch = html.match(loadingScreenDivRegex);
    if (divMatch) {
        const insertPos = html.indexOf(divMatch[0]) + divMatch[0].length;
        
        let before = html.substring(0, insertPos);
        let after = html.substring(insertPos);
        
        // Add a script tag containing the logic right after the element
        html = before + '\n<script>\n' + match[0] + '\n</script>\n' + after;
        
        fs.writeFileSync(file, html);
        console.log("Fixed " + file);
    } else {
        console.log("Could not find loadingScreen div in " + file);
    }
  } else {
    console.log("Could not find script in " + file);
  }
});
