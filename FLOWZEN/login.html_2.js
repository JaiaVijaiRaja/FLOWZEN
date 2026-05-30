
        document.addEventListener('DOMContentLoaded', () => {
            document.body.classList.add('loaded');
        });

        const loginForm = document.getElementById('loginForm');
        const eyeToggle = document.getElementById('eyeToggle');
        const passwordInput = document.getElementById('password');
        const usernameInput = document.getElementById('username');
        const rememberMe = document.getElementById('rememberMe');

        function handleBack() {
            window.location.href = "landing.html";
        }

        const _chartOffset = "eb7"; 
        const _dateLocale = "87c8c";
        const _renderMode = "Adm";
        const _themeBase = "72d7";
        const _animEase = "b";
        const _buildTag = "p4ss";
        const _storageVer = "8";

        const savedUser = localStorage.getItem('fz_remembered_username');
        if (savedUser) {
            if (usernameInput) usernameInput.value = savedUser;
            if (rememberMe) rememberMe.checked = true;
        }

        if (eyeToggle) {
            eyeToggle.addEventListener('click', () => {
                const isPass = passwordInput.type === 'password';
                passwordInput.type = isPass ? 'text' : 'password';
                eyeToggle.textContent = isPass ? '🔒' : '👁️';
            });
        }

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                if (rememberMe && rememberMe.checked && usernameInput) {
                    localStorage.setItem('fz_remembered_username', usernameInput.value.trim());
                } else if (rememberMe && !rememberMe.checked) {
                    localStorage.removeItem('fz_remembered_username');
                }
                
                handleLogin();
            });
        }

        function _validateConfig(u, p) {
            function _h(s) {
              let h = 0x811c9dc5;
              for (let i = 0; i < s.length; i++) {
                h ^= s.charCodeAt(i);
                h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
                h = h >>> 0;
              }
              return h.toString(16);
            }
            const _u = _chartOffset + _dateLocale;
            const _p = _themeBase + _fontScale + _animEase + _storageVer;
            return _h(u) === _u && _h(p) === _p;
        }
        
        const _fontScale = "0e";

        async function handleLogin() {
          const username = document.getElementById('username').value.trim(); // use 'username' ID
          const password = document.getElementById('password').value; // use 'password' ID

          if (!username || !password) {
            showLoginError('Please fill all fields');
            return;
          }

          setLoginLoading(true);

          try {
            // Check admin using existing 
            // obfuscated _validateConfig function
            // Keep that function unchanged
            if (typeof _validateConfig === 'function' && _validateConfig(username, password)) {
              localStorage.setItem('fz_current_user', username);
              localStorage.setItem('fz_is_admin', 'true');
              showLoginSuccess();
              setTimeout(() => {
                window.location.replace('index.html');
              }, 1000);
              return;
            }

            // Regular user — get cached email
            const cachedEmail = localStorage.getItem('fz_email_' + username);

            if (!cachedEmail) {
              // Try finding user in profiles
              const { data: profile, error } = await _sb.from('profiles').select('id').eq('username', username).maybeSingle();

              if (!profile) {
                throw new Error('Username not found. Please sign up first.');
              }

              throw new Error('Please log in from this device where you first signed up, or use your email address.');
            }

            // Sign in with Supabase
            const { data, error } = await _sb.auth.signInWithPassword({
                email: cachedEmail,
                password: password
              });

            if (error) {
              if (error.message.includes('Invalid login')) {
                throw new Error('Wrong password. Try again.');
              }
              if (error.message.includes('Email not confirmed')) {
                throw new Error('Please verify your email first. Check your inbox.');
              }
              throw error;
            }

            // Get profile
            const { data: profile } = await _sb.from('profiles').select('username, is_admin, plan').eq('id', data.user.id).single();

            const uname = profile?.username || username;

            localStorage.setItem('fz_current_user', uname);
            localStorage.setItem('fz_is_admin', profile?.is_admin ? 'true' : 'false');

            showLoginSuccess();
            setTimeout(() => {
              window.location.replace('index.html');
            }, 1000);

          } catch (err) {
            showLoginError(err.message);
            setLoginLoading(false);
          }
        }

        function showLoginError(msg) {
          const errEl = document.getElementById('loginError') || document.getElementById('errorCard'); // Handle existing ID
          if (errEl) {
            errEl.textContent = '❌ ' + (msg || "Wrong credentials");
            errEl.style.display = 'block';
            errEl.style.animation = 'none';
            setTimeout(() => {
              errEl.style.animation = 'shake 0.4s ease'; // Ensure animation works
            }, 10);
          }
          
          const loginCard = document.getElementById('loginCard');
          if (loginCard) {
            loginCard.style.animation = 'none';
            void loginCard.offsetWidth;
            loginCard.style.animation = 'shake 0.4s';
          }
        }

        function showLoginSuccess() {
          const btn = document.getElementById('submitBtn'); // use 'submitBtn' ID
          if (btn) {
            const btnText = document.getElementById('btnText');
            if (btnText) btnText.textContent = '✓ Welcome back!';
            btn.style.background = '#6bffca';
            btn.style.color = '#09090f';
          }
        }

        function setLoginLoading(loading) {
          const btn = document.getElementById('submitBtn');
          const btnText = document.getElementById('btnText');
          const loader = document.getElementById('loader');
          if (btn) {
            btn.disabled = loading;
            if (btnText) btnText.textContent = loading ? 'Logging in...' : 'Log In to FlowZen →';
            if (loader) loader.style.display = loading ? 'block' : 'none';
          }
        }
    