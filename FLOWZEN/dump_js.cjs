const fs = require('fs');
['landing.html', 'login.html', 'signup.html', 'index.html', 'pricing.html'].forEach(f => {
  const html = fs.readFileSync(f, 'utf8');
  let match;
  let idx = 0;
  const regex = /<script.*?>([\s\S]*?)<\/script>/gi;
  while ((match = regex.exec(html)) !== null) {
    if (match[1].trim().length > 0) {
      fs.writeFileSync(f + "_" + idx + ".js", match[1]);
      try {
        require('child_process').execSync('node -c ' + f + "_" + idx + ".js");
      } catch (e) {
        console.log("Error in " + f + "_" + idx + ".js:");
        console.log(e.stdout.toString() || e.stderr.toString());
      }
    }
    idx++;
  }
});
