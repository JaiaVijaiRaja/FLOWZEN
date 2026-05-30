const fs = require('fs');

let html = fs.readFileSync('signup.html', 'utf8');

// Replace CSS
const cssToRemoveRegex = /\/\*\s*---\s*PROGRESS BAR\s*---\s*\*\/[\s\S]*?\.prog-line\s*\{\s*width:\s*50px[\s\S]*?\}/;
if (html.match(cssToRemoveRegex)) {
  const cssToInsert = `/* --- NEW HEADER --- */
.signup-header {
  width: 100%;
  position: relative;
  z-index: 10;
}

/* ROW 1 — Logo */
.signup-logo-row {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 20px;
  border-bottom: 1px solid 
    rgba(255,255,255,0.07);
}

.signup-logo {
  font-family: 'Plus Jakarta Sans', 
    sans-serif;
  font-size: 24px;
  font-weight: 800;
  color: var(--text);
  text-decoration: none;
  letter-spacing: -0.5px;
}

.signup-logo span {
  color: var(--accent);
}

/* ROW 2 — Progress Steps */
.signup-steps-row {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 40px;
  gap: 0;
  max-width: 400px;
  margin: 0 auto;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  position: relative;
  z-index: 2;
}

.step-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid var(--border);
  background: var(--surface2);
  color: var(--muted);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Plus Jakarta Sans',
    sans-serif;
  font-weight: 700;
  font-size: 14px;
  transition: all 0.3s ease;
}

.step-label {
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: color 0.3s ease;
  white-space: nowrap;
}

/* Active step */
.step-item.active .step-circle {
  border-color: var(--accent);
  background: rgba(124,107,255,0.15);
  color: var(--accent);
  box-shadow: 0 0 0 4px 
    rgba(124,107,255,0.15);
}

.step-item.active .step-label {
  color: var(--accent);
  font-weight: 600;
}

/* Completed step */
.step-item.done .step-circle {
  border-color: var(--accent3);
  background: rgba(107,255,202,0.15);
  color: var(--accent3);
}

.step-item.done .step-label {
  color: var(--accent3);
}

/* Connector line between steps */
.step-connector {
  flex: 1;
  height: 2px;
  background: var(--border);
  margin: 0 8px;
  margin-bottom: 24px;
  border-radius: 99px;
  transition: background 0.3s ease;
  min-width: 40px;
  max-width: 80px;
}

.step-connector.active {
  background: var(--accent3);
}

/* Mobile */
@media (max-width: 480px) {
  .signup-steps-row {
    padding: 20px 24px;
  }
  .step-connector {
    min-width: 24px;
  }
  .step-label {
    font-size: 9px;
  }
}`;
  html = html.replace(cssToRemoveRegex, cssToInsert);
} else {
  console.log("Could not find CSS to replace");
}

let startStrHTML = '<a href="landing.html" style="margin-top: 3rem; margin-bottom: 2rem;';
if(html.indexOf(startStrHTML) !== -1) {
    let htmlToRemove = html.substring(html.indexOf(startStrHTML), html.indexOf('</div>', html.indexOf('<div class="prog-item" id="prog-3">') + 10) + 12);
    const htmlToInsert = `<div class="signup-header">
  <!-- ROW 1: Logo -->
  <div class="signup-logo-row">
    <a href="landing.html" class="signup-logo">
      Flow<span>Zen</span> ✦
    </a>
  </div>
  
  <!-- ROW 2: Progress Steps -->
  <div class="signup-steps-row">
    <div class="step-item active" id="stepItem1">
      <div class="step-circle">1</div>
      <div class="step-label">VERIFY</div>
    </div>
    <div class="step-connector" id="connector1"></div>
    <div class="step-item" id="stepItem2">
      <div class="step-circle">2</div>
      <div class="step-label">ACCOUNT</div>
    </div>
    <div class="step-connector" id="connector2"></div>
    <div class="step-item" id="stepItem3">
      <div class="step-circle">3</div>
      <div class="step-label">DONE</div>
    </div>
  </div>
</div>`;
    html = html.replace(htmlToRemove, htmlToInsert);
} else {
  console.log("Could not find HTML to replace");
}

const goToStepRegex = /function goToStep\(step\) \{[\s\S]*?function handleBack/m;
const goToStepReplacement = `function goToStep(step) {
  currentStep = step;

  // Update step items
  document.querySelectorAll('.step-item')
    .forEach((el, i) => {
    el.classList.remove('active', 'done');
    if (i + 1 === step) {
      el.classList.add('active');
    } else if (i + 1 < step) {
      el.classList.add('done');
    }
  });

  // Update connectors
  const connectors = document.querySelectorAll('.step-connector');
  connectors.forEach((el, i) => {
    el.classList.toggle('active', i + 1 < step);
  });

  // Show/hide step content
  const views = [
      document.getElementById('view-1'),
      document.getElementById('view-2'),
      document.getElementById('view-3')
  ];
  views.forEach((v, i) => {
      // Need to guard because sometimes views might be null if HTML structure differs, but we know it's view-1, view-2, view-3
      if(v) v.classList.toggle('active', i === step - 1);
  });

  if (step === 2) {
      document.getElementById('verifiedEmail').textContent = \`✓ \${sessionStorage.getItem('fz_signup_email')} verified\`;
  }
  if (step === 3) {
      document.getElementById('sum-name').textContent = sessionStorage.getItem('fz_signup_name');
      document.getElementById('sum-user').textContent = "@" + document.getElementById('username').value;
      document.getElementById('sum-email').textContent = sessionStorage.getItem('fz_signup_email');
  }

  // Back button
  const backBtn = document.getElementById('backBtn');
  if (backBtn) {
    backBtn.style.display = step === 3 ? 'none' : 'flex';
  }

  // Confetti on step 3
  if (step === 3 && typeof confetti === 'function') {
    setTimeout(() => {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.5 }
      });
    }, 300);
  }
}

        function handleBack`;
        
if (html.match(goToStepRegex)) {
    html = html.replace(goToStepRegex, goToStepReplacement);
} else {
    console.log("Could not find goToStep to replace");
}

fs.writeFileSync('signup.html', html);
console.log("Part 1 complete!");
