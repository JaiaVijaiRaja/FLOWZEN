const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const html = fs.readFileSync('index.html', 'utf8');
const dom = new JSDOM(html);
let errorFound = false;
dom.window.document.querySelectorAll('script').forEach((script, index) => {
    if (script.textContent) {
        fs.writeFileSync(\`script_tmp_\${index}.js\`, script.textContent);
        try {
            require('child_process').execSync(\`node -c script_tmp_\${index}.js\`);
        } catch(e) {
            console.error(\`Error in script \${index}:\`, e.message);
            errorFound = true;
        }
    }
});
