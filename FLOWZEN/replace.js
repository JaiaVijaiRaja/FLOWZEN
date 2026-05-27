const fs = require('fs');
const files = ['landing.html', 'login.html', 'signup.html', 'index.html', 'pricing.html'];

files.forEach(file => {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');

    // Fix Learn<span>Flow</span> (e.g. pricing.html)
    content = content.replace(/Learn(<\s*span[^>]*>)Flow(<\/\s*span>)/gi, 'Flow$1Zen$2');

    // General string replace
    content = content.replace(/LearnFlow/g, "FlowZen");
    content = content.replace(/learnflow/g, "flowzen");
    content = content.replace(/LEARNFLOW/g, "FLOWZEN");
    content = content.replace(/Learn Flow/g, "Flow Zen");
    content = content.replace(/learn-flow/g, "flow-zen");
    content = content.replace(/learnFlow/g, "flowZen");

    fs.writeFileSync(file, content);
});
