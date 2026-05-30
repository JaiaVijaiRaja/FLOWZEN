
        document.addEventListener('DOMContentLoaded', () => {
            document.body.classList.add('loaded');
        });

        // Toast utility if not present, simplest implementation
        function toast(msg, type='info') {
            alert(msg); // Placeholder, ideally use a small custom toast if needed, or alert since we don't have the toast HTML structure
        }

        let signupEmail = '';
        let signupFullName = '';
        let currentStep = 1;

        const fullNameInput = document.getElementById('fullName');
        const emailInput = document.getElementById('email');
        const sendCodeBtn = document.getElementById('sendCodeBtn');
        const otpInputs = document.querySelectorAll('.otp-input');
        
        emailInput.addEventListener('input', () => {
             const isValid = /^[^s@]+@[^s@]+\.[^s@]+$/.test(emailInput.value);
             emailInput.classList.toggle('valid', isValid);
             emailInput.classList.toggle('invalid', !isValid && emailInput.value.length > 0);
             document.getElementById('emailError').style.display = (!isValid && emailInput.value.length > 0) ? 'block' : 'none';
        });

        sendCodeBtn.addEventListener('click', sendVerificationEmail);

        otpInputs.forEach((input, idx) => {
             input.addEventListener('input', () => handleOTPInput(input, idx));
             input.addEventListener('keydown', (e) => handleOTPBackspace(input, idx, e));
        });

        const userInput = document.getElementById('username');
        const passInput = document.getElementById('password');
        const confirmPassInput = document.getElementById('confirmPassword');
        const termsCheck = document.getElementById('terms');
        const createBtn = document.getElementById('createBtn');
        const userHint = document.getElementById('userHint');
        const matchError = document.getElementById('matchError');

        userInput.addEventListener('input', () => {
             const val = userInput.value;
             const validChars = /^[a-zA-Z0-9_]+$/.test(val);
             const validLen = val.length >= 3 && val.length <= 20;
             
             if (!validLen || !validChars) {
                 userHint.style.display = 'block';
                 userHint.style.color = 'var(--accent2)';
                 userHint.textContent = !validLen ? "Min 3 characters" : "Letters, numbers, _ only";
                 userInput.classList.add('invalid');
                 userInput.classList.remove('valid');
             } else {
                 userHint.style.display = 'block';
                 userHint.style.color = 'var(--muted)';
                 userHint.textContent = "✓ Username available!"; // Simplified
                 userHint.style.color = 'var(--accent3)';
                 userInput.classList.add('valid');
                 userInput.classList.remove('invalid');
                 validateStep2();
             }
        });

        passInput.addEventListener('input', () => {
             const val = passInput.value;
             const checks = {
                 len: val.length >= 8,
                 up: /[A-Z]/.test(val),
                 num: /[0-9]/.test(val),
                 spec: /[^A-Za-z0-9]/.test(val)
             };

             Object.keys(checks).forEach(k => {
                 document.getElementById('c-' + k).classList.toggle('check', checks[k]);
             });

             const score = Object.values(checks).filter(Boolean).length;
             for(let i=1; i<=4; i++) {
                 const seg = document.getElementById('seg-' + i);
                 seg.style.background = 'var(--border)';
                 if (i <= score) {
                     if (score === 1) seg.style.background = 'var(--accent2)';
                     else if (score === 2) seg.style.background = 'var(--warn)';
                     else if (score === 3) seg.style.background = 'yellow';
                     else seg.style.background = 'var(--accent3)';
                 }
             }
             validateStep2();
        });

        confirmPassInput.addEventListener('input', () => {
             const match = confirmPassInput.value === passInput.value;
             matchError.style.display = (match || confirmPassInput.value === "") ? 'none' : 'block';
             confirmPassInput.classList.toggle('valid', match && confirmPassInput.value !== "");
             validateStep2();
        });

        termsCheck.addEventListener('change', validateStep2);

        function validateStep2() {
             const isUserValid = userInput.classList.contains('valid');
             const isPassStrong = passInput.value.length >= 8 && /[A-Z]/.test(passInput.value);
             const isMatch = confirmPassInput.value === passInput.value && passInput.value !== "";
             const isTerms = termsCheck.checked;

             createBtn.disabled = !(isUserValid && isPassStrong && isMatch && isTerms);
        }

        createBtn.addEventListener('click', completeSignup);

        async function sendVerificationEmail() {
          const fullName = document.getElementById('fullName').value.trim();
          const email = document.getElementById('email').value.trim(); // use 'email' to match existing input id

          if (!fullName) {
            toast('Please enter your name', 'error');
            return;
          }

          const emailRegex = /^[^s@]+@[^s@]+\.[^s@]+$/;
          if (!emailRegex.test(email)) {
            toast('Please enter a valid email address', 'error');
            return;
          }

          signupEmail = email;
          signupFullName = fullName;
          sessionStorage.setItem('fz_signup_email', email);
          sessionStorage.setItem('fz_signup_name', fullName);

          const btn = document.getElementById('sendCodeBtn');
          if (btn) {
            btn.textContent = 'Sending...';
            btn.disabled = true;
          }

          try {
            const { error } = await _sb.auth.signInWithOtp({
              email: email,
              options: {
                shouldCreateUser: true,
                data: { full_name: fullName }
              }
            });

            if (error) throw error;

            // Show OTP input section
            const otpSection = document.getElementById('otpSection');
            if (otpSection) {
              otpSection.style.display = 'block';
            }
            if (btn) {
              btn.style.display = 'none';
            }

            toast('Code sent! Check your inbox ✉️', 'success');

            // Focus first OTP box
            const firstBox = document.querySelector('.otp-input'); // changed to use existing input class
            if (firstBox) firstBox.focus();

          } catch (err) {
            toast('Error: ' + err.message, 'error');
            if (btn) {
              btn.textContent = 'Send Verification Code &rarr;';
              btn.disabled = false;
            }
          }
        }

        function handleOTPInput(input, index) {
          const boxes = document.querySelectorAll('.otp-input'); // changed to use existing input class

          // Only allow numbers
          input.value = input.value.replace(/[^0-9]/g, '');

          // Move to next box automatically
          if (input.value && index < boxes.length - 1) {
            boxes[index + 1].focus();
          }

          // Auto verify when all 6 filled
          const code = Array.from(boxes).map(b => b.value).join('');
          if (code.length === 6) {
            verifyOTPCode(code);
          }
        }

        function handleOTPBackspace(input, index, e) {
          if (e.key === 'Backspace' && !input.value && index > 0) {
            const boxes = document.querySelectorAll('.otp-input');
            boxes[index - 1].focus();
          }
        }

        async function verifyOTPCode(code) {
          const email = sessionStorage.getItem('fz_signup_email');

          document.querySelectorAll('.otp-input').forEach(b => b.disabled = true);

          toast('Verifying code...', 'info');

          try {
            const { data, error } = await _sb.auth.verifyOtp({
              email: email,
              token: code,
              type: 'email'
            });

            if (error) throw error;

            // Email verified — go to step 2
            goToStep(2);
            toast('Email verified! ✓', 'success');

          } catch (err) {
            toast('Wrong code. Try again.', 'error');
            document.querySelectorAll('.otp-input').forEach(b => {
                b.disabled = false;
                b.value = '';
              });
            const firstBox = document.querySelector('.otp-input');
            if (firstBox) firstBox.focus();
          }
        }

        async function completeSignup() {
          const username = document.getElementById('username').value.trim(); // Use 'username' input ID
          const password = document.getElementById('password').value; // Use 'password' input ID
          const confirmPass = document.getElementById('confirmPassword').value;
          const email = sessionStorage.getItem('fz_signup_email');
          const fullName = sessionStorage.getItem('fz_signup_name');
          const termsEl = document.getElementById('terms'); // changed from termsCheck to terms
          const termsChecked = termsEl ? termsEl.checked : true;

          // Validations
          if (!username || username.length < 3) {
            toast('Username needs 3+ characters', 'error');
            return;
          }
          if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            toast('Username: letters, numbers, _ only', 'error');
            return;
          }
          if (password.length < 8) {
            toast('Password needs 8+ characters', 'error');
            return;
          }
          if (password !== confirmPass) {
            toast("Passwords don't match", 'error');
            return;
          }
          if (!termsChecked) {
            toast('Please accept the terms', 'error');
            return;
          }

          const btn = document.getElementById('createBtn'); // use 'createBtn' ID
          if (btn) {
            btn.textContent = 'Creating account...';
            btn.disabled = true;
          }

          try {
            // Update password + metadata (user already signed in via OTP)
            const { error: updateError } = await _sb.auth.updateUser({
                password: password,
                data: {
                  username: username,
                  full_name: fullName
                }
              });

            if (updateError) throw updateError;

            // Get current user
            const { data: { user } } = await _sb.auth.getUser();

            if (!user) throw new Error('Session lost. Please try again.');

            // Save to profiles table
            const { error: profileError } = await _sb.from('profiles').upsert({
                  id: user.id,
                  username: username,
                  full_name: fullName,
                  plan: 'free',
                  is_admin: false
                });

            if (profileError && profileError.code !== '23505') {
              throw profileError;
            }

            // Cache in localStorage
            localStorage.setItem('fz_current_user', username);
            localStorage.setItem('fz_is_admin', 'false');
            localStorage.setItem('fz_email_' + username, email);

            // Go to success step
            goToStep(3);

            // Countdown redirect
            let count = 4;
            const timer = setInterval(() => {
              count--;
              const el = document.getElementById('redirectTimer'); // check if this is the correct ID, exists in HTML as redirectTimer
              if (el) el.textContent = 'Redirecting in ' + count + '...';
              if (count <= 0) {
                clearInterval(timer);
                window.location.replace('index.html');
              }
            }, 1000);

          } catch (err) {
            toast('Error: ' + err.message, 'error');
            if (btn) {
              btn.textContent = 'Create My Account &rarr;';
              btn.disabled = false;
            }
          }
        }

        function goToStep(step) {
          currentStep = step;
          
          const views = [
              document.getElementById('view-1'),
              document.getElementById('view-2'),
              document.getElementById('view-3')
          ];
          const progItems = [
              document.getElementById('prog-1'),
              document.getElementById('prog-2'),
              document.getElementById('prog-3')
          ];

          views.forEach((v, i) => v.classList.toggle('active', i === step - 1));
          progItems.forEach((p, i) => {
              p.classList.toggle('active', i === step - 1);
              p.classList.toggle('complete', i < step - 1);
          });
          
          if (step === 2) {
              document.getElementById('verifiedEmail').textContent = `✓ ${sessionStorage.getItem('fz_signup_email')} verified`;
          }
          if (step === 3) {
              document.getElementById('sum-name').textContent = sessionStorage.getItem('fz_signup_name');
              document.getElementById('sum-user').textContent = "@" + document.getElementById('username').value;
              document.getElementById('sum-email').textContent = sessionStorage.getItem('fz_signup_email');
          }

          // Hide back button on step 3
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

        function handleBack() {
          if (currentStep === 1) {
            window.location.href = 'landing.html';
          } else if (currentStep === 2) {
            goToStep(1);
          }
        }
    