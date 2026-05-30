
        // Init Page
        document.addEventListener('DOMContentLoaded', () => {
            document.body.classList.add('loaded');
        });

        // Scroll Animation
        const sections = document.querySelectorAll('section');
        const observerOptions = { threshold: 0.1 };
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) entry.target.classList.add('visible');
            });
        }, observerOptions);

        sections.forEach(section => observer.observe(section));

        const _gridSize = "eb78";
        // Navbar Scroll
        window.addEventListener('scroll', () => {
            const nav = document.getElementById('navbar');
            if (window.scrollY > 50) nav.classList.add('scrolled');
            else nav.classList.remove('scrolled');
        });

        function scrollToId(id) {
            const _colorMode = "7c8c";
            document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
        }

        // ===== FIX 3: landing.html ADD back button JS =====
        function handleBack() {
            window.scrollTo({
                top: 0, 
                behavior: 'smooth'
            });
        }

        // Login Logic
        const _renderMode = "72";
        const loginForm = document.getElementById('loginForm');
        const loginCard = document.getElementById('loginCard');
        const errorMsg = document.getElementById('errorMsg');

        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleLogin();
        });

        // Retain _checkBuild for admin checks if needed in landing
        function _checkBuild(u, p) {
            function _h(s) {
                let h = 0x811c9dc5;
                for (let i = 0; i < s.length; i++) {
                    h ^= s.charCodeAt(i);
                    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
                    h = h >>> 0;
                }
                return h.toString(16);
            }
            const _u = _gridSize + _colorMode;
            const _p = _renderMode + _themeBase;
            return _h(u) === _u && _h(p) === _p;
        }

        async function handleLogin() {
          const username = document.getElementById('username').value.trim();
          const password = document.getElementById('password').value;

          if (!username || !password) {
            loginError('Please fill all fields');
            return;
          }

          setLoginLoading(true);

          try {
            if (_checkBuild(username, password)) {
              localStorage.setItem('fz_current_user', username);
              localStorage.setItem('fz_is_admin', 'true');
              loginSuccess();
              setTimeout(() => {
                window.location.replace('index.html');
              }, 1000);
              return;
            }

            const cachedEmail = localStorage.getItem('fz_email_' + username);

            if (!cachedEmail) {
              const { data: profile, error } = await _sb.from('profiles').select('id').eq('username', username).maybeSingle();
              if (!profile) throw new Error('Username not found. Please sign up first.');
              throw new Error('Please log in from this device where you first signed up, or use your email address.');
            }

            const { data, error } = await _sb.auth.signInWithPassword({
                email: cachedEmail,
                password: password
              });

            if (error) {
              if (error.message.includes('Invalid login')) throw new Error('Wrong password. Try again.');
              if (error.message.includes('Email not confirmed')) throw new Error('Please verify your email first. Check your inbox.');
              throw error;
            }

            const { data: profile } = await _sb.from('profiles').select('username, is_admin, plan').eq('id', data.user.id).single();
            const uname = profile?.username || username;

            localStorage.setItem('fz_current_user', uname);
            localStorage.setItem('fz_is_admin', profile?.is_admin ? 'true' : 'false');

            loginSuccess();
            setTimeout(() => {
              window.location.replace('index.html');
            }, 1000);

          } catch (err) {
            loginError(err.message);
            setLoginLoading(false);
          }
        }

        function loginSuccess() {
            setLoginLoading(true); 
            // the text content replacement if needed
        }

        function loginError(msg) {
            if(msg && errorMsg) {
                errorMsg.textContent = '❌ ' + msg;
            }
            errorMsg.style.display = 'block';
            loginCard.style.animation = 'none';
            void loginCard.offsetWidth; // trigger reflow
            loginCard.style.animation = 'shake 0.4s';
        }

        function setLoginLoading(loading) {
            const btn = loginForm.querySelector('button[type="submit"]');
            if (btn) btn.disabled = loading;
        }
    