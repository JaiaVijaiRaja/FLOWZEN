const fs = require('fs');

let html = fs.readFileSync('signup.html', 'utf8');

// 1. Add console logs at the top of the <script> where sendVerificationEmail etc are defined (around line 372: <script> followed by DOMContentLoaded)
const topScriptRegex = /(<script>\s*)(document\.addEventListener\('DOMContentLoaded')/;
if (html.match(topScriptRegex)) {
    const logs = `$1
console.log('FlowZen signup loaded');
console.log('Supabase URL:', typeof SUPABASE_URL !== 'undefined' && SUPABASE_URL ? SUPABASE_URL.substring(0,30) + '...' : 'NOT SET');
console.log('Supabase Key:', typeof SUPABASE_ANON_KEY !== 'undefined' && SUPABASE_ANON_KEY ? 'SET (length: ' + SUPABASE_ANON_KEY.length + ')' : 'NOT SET');
console.log('Supabase client:', typeof _sb !== 'undefined' && _sb ? '✓ Connected' : '✗ Not connected');

$2`;
    html = html.replace(topScriptRegex, logs);
}

// 2. Overwrite sendVerificationEmail to include checks and timeouts
const sendEmailRegex = /async function sendVerificationEmail\(\) \{[\s\S]*?function handleOTPInput/m;
const newSendEmailFunc = `// Helper: reset send button
function resetSendButton() {
  const btn = document.getElementById('sendCodeBtn');
  if (btn) {
    btn.textContent = 'Send Verification Code →';
    btn.disabled = false;
  }
}

// Helper: show OTP boxes after success
function showOTPInput(email) {
  // Hide send button
  const sendBtn = document.getElementById('sendCodeBtn');
  if (sendBtn) sendBtn.style.display = 'none';

  // Show OTP section
  const otpSection = document.getElementById('otpSection');
  if (otpSection) {
    otpSection.style.display = 'block';
    otpSection.style.animation = 'fadeIn 0.3s ease';
  }

  // Show the email it was sent to
  const emailDisplay = document.getElementById('sentToEmail');
  if (emailDisplay) {
    emailDisplay.textContent = email;
  }

  // Focus first OTP box
  setTimeout(() => {
    const firstBox = document.querySelector('.otp-box');
    if (firstBox) firstBox.focus();
  }, 100);

  startResendTimer();
}

function startResendTimer() {
  let seconds = 60;
  const el = document.getElementById('resendTimer');
  
  const timer = setInterval(() => {
    seconds--;
    if (el) {
      el.textContent = seconds > 0 ?
        'Resend in ' + seconds + 's' :
        'Resend code';
    }
    
    if (seconds <= 0) {
      clearInterval(timer);
      if (el) {
        el.style.color = 'var(--accent)';
        el.style.cursor = 'pointer';
        el.onclick = () => {
          sendVerificationEmail();
          startResendTimer();
        };
      }
    }
  }, 1000);
}

async function sendVerificationEmail() {
  // CHECK 1: Verify Supabase is connected
  if (!SUPABASE_URL || SUPABASE_URL.includes('REPLACE') || !SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.includes('REPLACE')) {
    toast('⚠️ Supabase not configured. Please add your API keys.', 'error');
    resetSendButton();
    return;
  }
  
  // CHECK 2: Verify _sb client exists
  if (typeof _sb === 'undefined' || !_sb || !_sb.auth) {
    toast('⚠️ Supabase client not initialized.', 'error');
    resetSendButton();
    return;
  }

  const fullName = document.getElementById('fullName').value.trim();
  const emailInputEl = document.getElementById('email');
  const email = emailInputEl ? emailInputEl.value.trim() : '';

  // CHECK 3: Validate inputs
  if (!fullName) {
    toast('Please enter your name', 'error');
    resetSendButton();
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    toast('Please enter a valid email', 'error');
    resetSendButton();
    return;
  }

  // Store for later steps
  signupEmail = email;
  signupFullName = fullName;
  sessionStorage.setItem('fz_signup_email', email);
  sessionStorage.setItem('fz_signup_name', fullName);

  // Show loading state
  const btn = document.getElementById('sendCodeBtn');
  if (btn) {
    btn.textContent = 'Sending...';
    btn.disabled = true;
  }

  // SAFETY TIMEOUT — if nothing happens in 15 seconds, reset and show error
  const safetyTimer = setTimeout(() => {
    toast('⏱ Request timed out. Check your Supabase keys and try again.', 'error');
    resetSendButton();
  }, 15000);

  try {
    console.log('Sending OTP to:', email);
    
    const { data, error } = await _sb.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: true,
          data: {
            full_name: fullName
          }
        }
      });

    // Clear safety timer on response
    clearTimeout(safetyTimer);

    console.log('OTP response:', { data, error });

    if (error) {
      // Handle specific errors
      if (error.message.includes('rate limit')) {
        throw new Error('Too many attempts. Wait 60 seconds and try again.');
      }
      if (error.message.includes('invalid')) {
        throw new Error('Invalid email address. Please check and try again.');
      }
      throw error;
    }

    // SUCCESS — Show OTP input
    showOTPInput(email);
    toast('✉️ Code sent! Check your inbox (and spam folder)', 'success');

  } catch (err) {
    clearTimeout(safetyTimer);
    console.error('OTP error:', err);
    toast('Error: ' + err.message, 'error');
    resetSendButton();
  }
}

        function handleOTPInput`;

html = html.replace(sendEmailRegex, newSendEmailFunc);


// 3. Update OTP Section HTML
const oldOtpSectionRegex = /<div id="otpSection"[\s\S]*?<\/div>\s*<\/div>\s*<!-- STEP 2:/;
const newOtpSection = `<div id="otpSection" style="display: none; margin-top: 2.5rem;">
  <p style="
    text-align: center;
    color: var(--muted);
    font-size: 14px;
    margin-bottom: 20px;">
    Enter the 6-digit code sent to<br>
    <strong id="sentToEmail" style="color: var(--accent);"></strong>
  </p>
  
  <div style="
    display: flex;
    gap: 10px;
    justify-content: center;
    margin-bottom: 16px;">
    
    <input class="otp-box otp-input" 
      maxlength="1" type="text"
      inputmode="numeric"
      oninput="handleOTPInput(this, 0)"
      onkeydown="handleOTPBackspace(this, 0, event)" />
    <input class="otp-box otp-input" 
      maxlength="1" type="text"
      inputmode="numeric"
      oninput="handleOTPInput(this, 1)"
      onkeydown="handleOTPBackspace(this, 1, event)" />
    <input class="otp-box otp-input" 
      maxlength="1" type="text"
      inputmode="numeric"
      oninput="handleOTPInput(this, 2)"
      onkeydown="handleOTPBackspace(this, 2, event)" />
    <input class="otp-box otp-input" 
      maxlength="1" type="text"
      inputmode="numeric"
      oninput="handleOTPInput(this, 3)"
      onkeydown="handleOTPBackspace(this, 3, event)" />
    <input class="otp-box otp-input" 
      maxlength="1" type="text"
      inputmode="numeric"
      oninput="handleOTPInput(this, 4)"
      onkeydown="handleOTPBackspace(this, 4, event)" />
    <input class="otp-box otp-input" 
      maxlength="1" type="text"
      inputmode="numeric"
      oninput="handleOTPInput(this, 5)"
      onkeydown="handleOTPBackspace(this, 5, event)" />
  </div>
  
  <p style="
    font-size: 12px;
    color: var(--muted);
    text-align: center;
    font-family: 'DM Mono', monospace;">
    Didn't get it? Check spam folder.<br>
    <span id="resendTimer" style="color: var(--muted);">
      Resend in 60s
    </span>
  </p>
</div>
        </div>

        <!-- STEP 2:`;

if (html.match(oldOtpSectionRegex)) {
    html = html.replace(oldOtpSectionRegex, newOtpSection);
} else {
    console.log("Could not find OTP Section to replace!");
}

// 4. Update OTP Box CSS
// Remove old .otp-container and .otp-input CSS
const oldOtpCssRegex = /\/\*\s*Step 1 Code Inputs\s*\*\/[\s\S]*?\.otp-input:focus[^\}]+?\}/;
const newOtpCss = `/* Step 1 Code Inputs */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.otp-box {
  width: 48px;
  height: 56px;
  border-radius: 12px;
  border: 2px solid var(--border);
  background: var(--surface2);
  color: var(--text);
  font-size: 24px;
  font-weight: 700;
  font-family: 'DM Mono', monospace;
  text-align: center;
  outline: none;
  transition: all 0.2s ease;
  caret-color: transparent;
}

.otp-box:focus {
  border-color: var(--accent);
  background: rgba(124,107,255,0.08);
  box-shadow: 0 0 0 3px 
    rgba(124,107,255,0.15);
}

.otp-box:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 400px) {
  .otp-box {
    width: 40px;
    height: 48px;
    font-size: 20px;
  }
}`;

if (html.match(oldOtpCssRegex)) {
    html = html.replace(oldOtpCssRegex, newOtpCss);
} else {
    console.log("Could not find OTP CSS to replace!");
}


fs.writeFileSync('signup.html', html);
console.log("Part 2 complete!");
