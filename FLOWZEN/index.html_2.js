
        // ============================================
        // FLOWZEN REAL-TIME SYNC ENGINE
        // ============================================

        // Master refresh — call this after 
        // ANY data change anywhere in the app
        function syncAll() {
            console.log("🔄 Syncing all components...");
            
            // Refresh each component if it exists
            try { refreshDashboard(); } 
            catch(e) { console.log("dashboard:", e); }
            
            try { refreshSessionTable(); } 
            catch(e) { console.log("sessions:", e); }
            
            try { if (typeof renderTodos === "function") renderTodos(); } 
            catch(e) { console.log("todos:", e); }
            
            try { updateStats(); } 
            catch(e) { console.log("stats:", e); }
            
            try { updateCharts(); } 
            catch(e) { console.log("charts:", e); }
            
            try { refreshSkillPodium(); } 
            catch(e) { console.log("podium:", e); }
            
            try { refreshHeatmap(); } 
            catch(e) { console.log("heatmap:", e); }
            
            try { refreshTimeline(); } 
            catch(e) { console.log("timeline:", e); }
            
            console.log("✅ Sync complete");
        }

        // Helper: get current user's sessions
        async function getSessions() {
  try {
    const { data: { user } } = await _sb.auth.getUser();
    if (user) {
      const { data, error } = await _sb.from('sessions').select('*').eq('user_id', user.id).order('date_raw', { ascending: false });
      if (!error && data) {
        return data.map(s => ({
          id: s.id, skill: s.skill, hours: parseFloat(s.hours), durationMinutes: s.duration_minutes, category: s.category || 'other', mood: s.mood || '', notes: s.notes || '', date: s.date, dateRaw: s.date_raw, weekday: s.weekday
        }));
      }
    }
  } catch(e) { console.log('Using localStorage:', e); }
  const uname = localStorage.getItem('fz_current_user') || 'guest';
  return JSON.parse(localStorage.getItem('fz_sessions_' + uname) || '[]');
}

        // Helper: get current user's todos
        async function getTodos() {
  try {
    const { data: { user } } = await _sb.auth.getUser();
    if (user) {
      const { data, error } = await _sb.from('todos').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (!error && data) {
        return data.map(t => ({
          id: t.id, text: t.text, tag: t.tag, priority: t.priority, due: t.due, done: t.done, createdAt: t.created_at, completedAt: t.completed_at
        }));
      }
    }
  } catch(e) { console.log('Using localStorage:', e); }
  const uname = localStorage.getItem('fz_current_user') || 'guest';
  return JSON.parse(localStorage.getItem('fz_todos_' + uname) || '[]');
}

        // Helper: save sessions
        function saveSessions(sessions) {
            const username = localStorage.getItem("fz_current_user") || "guest";
            localStorage.setItem("fz_sessions_" + username, JSON.stringify(sessions));
        }

        // Helper: save todos
        function saveTodos(todos) {
            const username = localStorage.getItem("fz_current_user") || "guest";
            localStorage.setItem("fz_todos_" + username, JSON.stringify(todos));
        }

        // ADD TO <script> - new variables
        let selectedCategory = null;
        let selectedMood = null;
        let durationMinutes = 60;
        const MIN_DURATION = 15;
        const MAX_DURATION = 720;
        const STEP = 15;
        let notesOpen = false;

        function selectCategory(btn, category) {
            document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedCategory = category;
        }

        function selectMood(btn, mood) {
            // Remove selected from ALL mood buttons
            document.querySelectorAll('.mood-btn')
                .forEach(b => {
                    b.classList.remove('selected');
                });
            
            // Add selected to clicked button
            btn.classList.add('selected');
            selectedMood = mood;
            
            console.log("Mood selected:", mood);
        }

        function changeDuration(direction) {
            durationMinutes += direction * STEP;
            if (durationMinutes < MIN_DURATION) durationMinutes = MIN_DURATION;
            if (durationMinutes > MAX_DURATION) durationMinutes = MAX_DURATION;
            updateDurationDisplay();
        }

        function updateDurationDisplay() {
            const hours = Math.floor(durationMinutes / 60);
            const mins = durationMinutes % 60;
            let display = "";
            if (hours > 0 && mins > 0) {
                display = hours + "h " + String(mins).padStart(2, '0') + "m";
            } else if (hours > 0) {
                display = hours + "h 00m";
            } else {
                display = mins + "m";
            }
            const el = document.getElementById("durDisplay");
            if (el) {
                el.textContent = display;
                el.style.transform = "scale(1.1)";
                el.style.transition = "transform 0.1s ease";
                setTimeout(() => el.style.transform = "scale(1)", 100);
            }
        }

        function toggleNotes() {
            notesOpen = !notesOpen;
            const area = document.getElementById("notesArea");
            const icon = document.getElementById("notesToggleIcon");
            const text = document.getElementById("notesToggleText");
            
            if (notesOpen) {
                area.classList.add("open");
                icon.style.transform = "rotate(45deg)";
                text.textContent = "Hide notes";
                setTimeout(() => {
                    const ta = document.getElementById("sessionNotes");
                    if (ta) ta.focus();
                }, 350);
            } else {
                area.classList.remove("open");
                icon.style.transform = "rotate(0deg)";
                text.textContent = "Add notes (optional)";
            }
        }

        function showSessionSuccess(skill, hours) {
            document.getElementById("log-success-msg").textContent = `+${hours}h added to ${skill}`;
            document.getElementById("log-success-card").classList.remove("hidden");
            refreshDashboard();
        }

        function logSession() {
            const skill = document.getElementById("logSkill").value.trim();
            const hours = durationMinutes / 60;
            const category = selectedCategory;
            const mood = selectedMood;
            const notes = notesOpen ? document.getElementById("sessionNotes").value.trim() : "";
            
            if (!skill) {
                showToast("Please enter a skill!", "error");
                document.getElementById("logSkill").focus();
                return;
            }
            
            if (!category) {
                showToast("Please select a category!", "error");
                document.querySelectorAll('.cat-btn').forEach(b => {
                    b.style.animation = "shake 0.3s ease";
                    setTimeout(() => b.style.animation = "", 300);
                });
                return;
            }
            
            if (!mood) {
                showToast("Please select your mood!", "error");
                document.querySelectorAll('.mood-btn').forEach(b => {
                    b.style.animation = "shake 0.3s ease";
                    setTimeout(() => b.style.animation = "", 300);
                });
                return;
            }
            
            const username = localStorage.getItem("fz_current_user") || "guest";
            
            const session = {
                id: Date.now(),
                skill: skill,
                hours: Math.round(hours * 100) / 100,
                durationMinutes: durationMinutes,
                category: category,
                mood: mood,
                notes: notes,
                date: new Date().toLocaleDateString('en-US', {month:'short', day:'numeric'}),
                dateRaw: new Date().toISOString(),
                weekday: new Date().getDay()
            };
            
            // Validate limits exactly like old logic did for current user
            const sessions = getSessions();
            if (!currentUserData.isAdmin && sessions.length >= MAX_FREE_SESSIONS) {
                limitOverlay.classList.remove('hidden');
                return;
            }

            // Save to localStorage
            const key = "fz_sessions_" + username;
            const existing = JSON.parse(localStorage.getItem(key) || "[]");
            existing.unshift(session);
            localStorage.setItem(key, JSON.stringify(existing));
            
            // Refresh the session table instantly
            if (typeof refreshSessionTable === "function") {
                refreshSessionTable();
            }

            // Update dashboard stats
            if (typeof updateStats === "function") {
                updateStats();
            }

            // Scroll to session table smoothly
            setTimeout(() => {
                const tableEl = document.getElementById("sessionTableBody");
                if (tableEl && tableEl.closest(".card")) {
                    tableEl.closest(".card").scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });
                }
            }, 800);
            
            if (typeof fireConfetti === "function") fireConfetti(); 
            else if (typeof confetti === "function") confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }});
            
            showSessionSuccess(skill, hours);
            resetLogForm();
            
            syncAll();
        }

        function resetLogForm() {
            document.getElementById("logSkill").value = "";
            durationMinutes = 60;
            updateDurationDisplay();
            document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('selected'));
            selectedCategory = null;
            document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
            selectedMood = null;
            if (notesOpen) toggleNotes();
            document.getElementById("sessionNotes").value = "";
        }

        document.addEventListener("DOMContentLoaded", function() {
            // Small delay to ensure DOM is ready
            setTimeout(() => {
                syncAll();
            }, 200);
            
            updateDurationDisplay();
            if (typeof refreshSessionTable === "function") {
                refreshSessionTable();
            }
            const btnLogAnother = document.getElementById("btn-log-another");
            if (btnLogAnother) {
                btnLogAnother.addEventListener("click", () => {
                    document.getElementById("log-success-card").classList.add("hidden");
                });
            }
            const searchInput = document.getElementById("session-search");
            if (searchInput) {
                searchInput.addEventListener("input", window.searchSessions);
            }
        });

        // DOM Elements
        const body = document.body;
        const loginView = document.getElementById('login-view');
        const appView = document.getElementById('app-view');
        const loginForm = document.getElementById('login-form');
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        
        const navAvatar = document.getElementById('nav-avatar');
        const navName = document.getElementById('nav-name');
        const welcomeMessage = document.getElementById('welcome-message');
        const logoutBtn = document.getElementById('logout-btn');
        const perksContainer = document.getElementById('perks-container');

        // Dashboard Elements
        const dashboardContent = document.getElementById('dashboard-content');
        const statsContainer = document.getElementById('stats-container');
        const logSessionForm = document.getElementById('log-session-form');
        const limitOverlay = document.getElementById('limit-overlay');
        const skillsProgressContainer = document.getElementById('skills-progress-container');
        const recentSessionsList = document.getElementById('recent-sessions-list');
        
        let currentUserData = null; // To hold session data globally
        const MAX_FREE_SESSIONS = 10;

        // Tab switching logic
        const navTabs = document.querySelectorAll('#main-nav-tabs a');
        const dashboardView = document.getElementById('dashboard-content');
        const aiInsightsView = document.getElementById('ai-insights-view');
        const todosView = document.getElementById('todos-view');
        const logSessionView = document.getElementById('log-session-view');
        const profileView = document.getElementById('profile-view');

        navTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const target = e.target.getAttribute('data-target');
                if (!target) return;
                e.preventDefault();
                
                navTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                dashboardView.style.display = target === 'dashboard-content' ? 'flex' : 'none';
                aiInsightsView.style.display = target === 'ai-insights-view' ? 'block' : 'none';
                todosView.style.display = target === 'todos-view' ? 'block' : 'none';
                if(logSessionView) logSessionView.style.display = target === 'log-session-view' ? 'block' : 'none';
                if(profileView) profileView.style.display = target === 'profile-view' ? 'block' : 'none';
                
                if(target === 'ai-insights-view') {
                    initAIInsightsView();
                } else if(target === 'todos-view') {
                    if (typeof initTodosView === 'function') initTodosView();
                } else if(target === 'profile-view') {
                    if (typeof initProfileView === 'function') initProfileView();
                } else if(target === 'log-session-view') {
                    if (typeof refreshSessionTable === 'function') refreshSessionTable();
                }
                
                // Sync data when switching tabs
                syncAll();
            });
        });

        // Categories Color Map
        const catColors = {
            'Coding': 'var(--c-primary)',
            'Design': 'var(--c-pink)',
            'Math': 'var(--c-green)',
            'Project': 'var(--c-orange)',
            'Other': 'var(--c-text-muted)'
        };
        const catRGB = {
            'Coding': 'rgba(124, 107, 255, 0.2)',
            'Design': 'rgba(255, 107, 157, 0.2)',
            'Math': 'rgba(107, 255, 202, 0.2)',
            'Project': 'rgba(255, 179, 71, 0.2)',
            'Other': 'rgba(142, 139, 153, 0.2)'
        };

        // Storage Keys
        const STORAGE_KEY_USERS = 'fz_users';
        const STORAGE_KEY_SESSION = 'flowzen_session';

        /**
         * Initialize application state
         */
        function initApp() {
            // Trigger fade-in animation
            requestAnimationFrame(() => {
                body.classList.add('loaded');
            });

            const user = localStorage.getItem("fz_current_user");

            if (user && user.trim() !== "") {
                const isAdmin = localStorage.getItem("fz_is_admin") === "true";
                // If user is logged in, show the app immediately, autofilling data implicitly
                showAppScreen({ name: user, isAdmin: isAdmin });
            } else {
                window.location.replace("landing.html");
            }
        }

        /**
         * Simple mock hash function to obscure passwords in localstorage.
         * Real apps use bcrypt/argon2 down at the DB level, but we satisfy 
         * the "no backend" requirement with base64 for demonstration.
         */
        function mockHash(str) {
            return btoa(str);
        }

        /**
         * Logic to handle form submission (login or signup)
         */
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const rawName = usernameInput.value.trim();
            const rawPassword = passwordInput.value.trim();
            
            if (!rawName || !rawPassword) return;

            // Fetch stored users
            let users = {};
            try {
                users = JSON.parse(localStorage.getItem(STORAGE_KEY_USERS)) || {};
            } catch (err) {
                users = {};
            }

            let isAdmin = false;
            
            // Hardcoded Admin Check bypasses normal creation flow
            if (rawName === 'Admin' && rawPassword === 'admin123') {
                isAdmin = true;
            }

            const activeUserRecord = users[rawName];

            if (activeUserRecord) {
                // User exists: verify password
                const hashedInput = mockHash(rawPassword);
                if (activeUserRecord.passwordHash !== hashedInput && !isAdmin) {
                    alert('Incorrect password. Please try again.');
                    passwordInput.focus();
                    return;
                }
                
                // If admin logged in via regular path but it matched, ensure flag is updated
                if (isAdmin) activeUserRecord.isAdmin = true;

            } else {
                // New user: Register them
                users[rawName] = {
                    passwordHash: mockHash(rawPassword),
                    isAdmin: isAdmin,
                    createdAt: new Date().toISOString()
                };
                localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
            }

            // Create current session context
            const sessionUser = {
                name: rawName,
                isAdmin: users[rawName] ? users[rawName].isAdmin : isAdmin
            };

            // Save session
            localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(sessionUser));
            
            // Proceed to App
            showAppScreen(sessionUser);
        });

        /**
         * Logout handler
         */
        logoutBtn.addEventListener('click', handleLogout);

        function handleLogout() {
            localStorage.removeItem("fz_current_user");
            localStorage.removeItem("fz_is_admin");
            window.location.replace("landing.html");
        }

        /**
         * Helper: Shows Login Screen and hides App Shell
         */
        function showLoginScreen() {
            window.location.href = 'landing.html';
        }

        /**
         * Helper: Shows App Shell and hides Login Screen
         * Sets user context variables.
         */
        function showAppScreen(user) {
            loginView.style.display = 'none';
            appView.style.display = 'block';

            // Extract display variables
            const firstLetter = user.name.charAt(0).toUpperCase();

            // Populate the UI
            navAvatar.textContent = firstLetter;
            welcomeMessage.textContent = `Welcome back, ${user.name}! 👋`;
            
            if (user.isAdmin) {
                navName.innerHTML = `${user.name} <span class="admin-badge">ADMIN</span>`;
                perksContainer.innerHTML = `<div class="perks-banner">✨ <strong>Admin Perks Active:</strong> All features unlocked, no limits.</div>`;
                const prLink = document.getElementById('nav-pricing-link');
                if(prLink) {
                    prLink.innerHTML = '⚡ Admin &mdash; All Access';
                    prLink.style.color = 'var(--c-orange)';
                    prLink.removeAttribute('href');
                    prLink.style.cursor = 'default';
                }
            } else {
                navName.textContent = user.name;
                perksContainer.innerHTML = '';
                const prLink = document.getElementById('nav-pricing-link');
                if(prLink) {
                    prLink.innerHTML = '💎 Pricing';
                    prLink.style.color = 'var(--c-text-muted)';
                    prLink.setAttribute('href', 'pricing.html');
                    prLink.style.cursor = 'pointer';
                }
            }

            currentUserData = user;
            if(window.loadPreferences) loadPreferences();
            refreshDashboard();
            if(window.showOnboarding) showOnboarding();
        }

        // ----------------------------------------------------
        // Dashboard Logic (Section 2)
        // ----------------------------------------------------
        
        window.showUpgradeModal = function(featureName) {
            const overlay = document.getElementById('upgrade-modal-overlay');
            const title = document.getElementById('upgrade-modal-title');
            const feature = document.getElementById('upgrade-modal-feature');
            
            if(featureName) {
                title.textContent = `Unlock ${featureName} with Pro`;
                feature.textContent = featureName;
            } else {
                title.textContent = `Unlock Everything with Pro`;
                feature.textContent = 'Pro Feature';
            }
            
            overlay.classList.add('active');
        };

        window.closeUpgradeModal = function() {
            document.getElementById('upgrade-modal-overlay').classList.remove('active');
        };
        
        function showToast(message, type = 'success') {
            const container = document.getElementById('toast-container');
            const toast = document.createElement('div');
            toast.className = 'toast';
            
            const config = {
                'success': { icon: '✅', color: 'var(--c-green)' },
                'error': { icon: '❌', color: 'var(--c-pink)' },
                'info': { icon: 'ℹ️', color: 'var(--c-primary)' },
                'warn': { icon: '⚠️', color: 'var(--c-orange)' }
            };
            const c = config[type] || config.success;
            
            toast.style.setProperty('--toast-color', c.color);
            toast.innerHTML = `
                <div style="font-size: 1.2rem;">${c.icon}</div>
                <div style="flex:1; font-family:var(--f-body); font-size:0.95rem;">${message}</div>
                <div class="toast-progress"></div>
            `;
            
            // Click to dismiss
            toast.addEventListener('click', () => {
                toast.classList.replace('show', 'hide');
                setTimeout(() => toast.remove(), 300);
            });
            
            container.appendChild(toast);
            
            // Stack limit (max 3)
            while(container.children.length > 3) {
                const first = container.children[0];
                first.classList.replace('show', 'hide');
                setTimeout(() => first.remove(), 300);
            }
            
            requestAnimationFrame(() => toast.classList.add('show'));
            
            setTimeout(() => {
                if(toast.parentElement) {
                    toast.classList.replace('show', 'hide');
                    setTimeout(() => toast.remove(), 300);
                }
            }, 3000);
        }

        // Session delete function:
        window.deleteSession = async function(id) {
  try {
    const { data: { user } } = await _sb.auth.getUser();

    if (user) {
      await _sb.from('sessions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
    } else {
      throw new Error('No user');
    }
  } catch(e) {
    const uname = localStorage.getItem('fz_current_user') || 'guest';
    const key = 'fz_sessions_' + uname;
    let sessions = JSON.parse(localStorage.getItem(key) || '[]');
    sessions = sessions.filter(s => s.id !== id);
    localStorage.setItem(key, JSON.stringify(sessions));
  }

  if(typeof showToast !== 'undefined') showToast('Session deleted', 'info');
  syncAll();
};

        function refreshSessionTable() {
            const username = localStorage.getItem("fz_current_user") || "guest";
            const key = "fz_sessions_" + username;
            const sessions = JSON.parse(localStorage.getItem(key) || "[]");
            
            const tableBody = document.getElementById("sessionTableBody") || document.getElementById("session-table-body") || document.getElementById("recent-sessions-list");
            const emptyState = document.getElementById("sessionTableEmpty");
            const totalCount = document.getElementById("sessionTotalCount");
            
            if (totalCount) {
                totalCount.textContent = sessions.length + " sessions";
            }
            
            if (!tableBody) return;
            
            if (sessions.length === 0) {
                tableBody.innerHTML = "";
                if (emptyState) emptyState.style.display = "block";
                return;
            }
            
            if (emptyState) emptyState.style.display = "none";
            
            const searchEl = document.getElementById("sessionSearch") || document.getElementById("session-search");
            const searchTerm = searchEl ? searchEl.value.toLowerCase() : "";
            
            let filtered = sessions;
            if (searchTerm) {
                filtered = sessions.filter(s =>
                    s.skill.toLowerCase().includes(searchTerm) ||
                    (s.category || "").toLowerCase().includes(searchTerm) ||
                    (s.mood || "").toLowerCase().includes(searchTerm)
                );
            }
            
            const rowsPerPage = 10;
            const currentPage = window.sessionPage || 1;
            const totalPages = Math.ceil(filtered.length / rowsPerPage);
            const start = (currentPage - 1) * rowsPerPage;
            const pageItems = filtered.slice(start, start + rowsPerPage);
            
            const moodEmoji = {
                Tired: "😴", Okay: "😐", 
                Good: "🙂", Great: "😄", 
                "On Fire": "🔥",
                tired: "😴", okay: "😐",
                good: "🙂", great: "😄",
                onfire: "🔥"
            };
            
            const catColor = {
                Coding: "var(--c-primary)",
                Design: "var(--c-pink)",
                Math: "var(--c-accent)",
                Project: "var(--c-orange)",
                Other: "var(--c-text-muted)"
            };
            
            tableBody.innerHTML = pageItems.map((s, i) => `
                <tr class="session-row" style="animation: entryIn 0.3s ease ${i * 0.05}s both;">
                    <td><span class="skill-tag">${s.skill}</span></td>
                    <td style="font-family: monospace; color: var(--c-primary);">${s.hours}h</td>
                    <td>
                        <span class="cat-badge" style="background: ${catColor[s.category] || 'var(--c-text-muted)'}22; color: ${catColor[s.category] || 'var(--c-text-muted)'}; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-family: monospace;">
                            ${s.category || "—"}
                        </span>
                    </td>
                    <td style="font-size: 20px;">${moodEmoji[s.mood] || "—"}</td>
                    <td style="font-family: monospace; font-size: 12px; color: var(--c-text-muted);">${s.date || "—"}</td>
                    <td>
                        <button onclick="window.deleteSession(${s.id})" class="del-session-btn" type="button" title="Delete session">✕</button>
                    </td>
                </tr>
            `).join("");
            
            updatePagination(totalPages, currentPage);
        }

        function updatePagination(totalPages, currentPage) {
            const pag = document.getElementById("sessionPagination") || document.getElementById("session-pagination");
            if (!pag || totalPages <= 1) {
                if (pag) pag.style.display = "none";
                return;
            }
            
            pag.style.display = "flex";
            pag.innerHTML = `
                <button onclick="goToSessionPage(${currentPage - 1})" ${currentPage === 1 ? "disabled" : ""} class="pag-btn" type="button">← Prev</button>
                <span style="font-family: monospace; font-size: 13px; color: var(--c-text-muted); padding: 0 12px; display: flex; align-items: center;">
                    ${currentPage} / ${totalPages}
                </span>
                <button onclick="goToSessionPage(${currentPage + 1})" ${currentPage === totalPages ? "disabled" : ""} class="pag-btn" type="button">Next →</button>
            `;
        }

        window.goToSessionPage = function(page) {
            window.sessionPage = page;
            refreshSessionTable();
            const table = document.getElementById("sessionTableBody") || document.getElementById("session-table-body");
            if (table && table.closest(".card")) {
                table.closest(".card").scrollIntoView({ behavior: "smooth", block: "start" });
            }
        };

        window.searchSessions = function() {
            window.sessionPage = 1;
            refreshSessionTable();
        };

        function showDangerConfirm() {
            document.getElementById("dangerStep1").style.display = "none";
            document.getElementById("dangerStep2").style.display = "block";
            document.getElementById("deleteConfirmInput").value = "";
            document.getElementById("confirmDeleteBtn").disabled = true;
            document.getElementById("confirmDeleteBtn").style.opacity = "0.4";
            document.getElementById("confirmDeleteBtn").style.cursor = "not-allowed";
            setTimeout(() => {
                document.getElementById("deleteConfirmInput").focus();
            }, 100);
        }

        function hideDangerConfirm() {
            document.getElementById("dangerStep1").style.display = "block";
            document.getElementById("dangerStep2").style.display = "none";
            document.getElementById("deleteConfirmInput").value = "";
        }

        function checkDeleteInput() {
            const val = document.getElementById("deleteConfirmInput").value;
            const btn = document.getElementById("confirmDeleteBtn");
            if (val === "DELETE") {
                btn.disabled = false;
                btn.style.opacity = "1";
                btn.style.cursor = "pointer";
            } else {
                btn.disabled = true;
                btn.style.opacity = "0.4";
                btn.style.cursor = "not-allowed";
            }
        }

        async function executeDeleteAll() {
  const val = document.getElementById('deleteConfirmInput')?.value;
  if (val !== 'DELETE') return;

  const isAdmin = localStorage.getItem('fz_is_admin') === 'true';
  if (isAdmin) {
    toast('Admin data is protected', 'warn'); // Use the generic toast or existing showToast
    return;
  }

  try {
    const { data: { user } } = await _sb.auth.getUser();

    if (user) {
      await _sb.from('sessions').delete().eq('user_id', user.id);
      await _sb.from('todos').delete().eq('user_id', user.id);
      await _sb.from('ai_logs').delete().eq('user_id', user.id);
      await _sb.from('profiles').delete().eq('id', user.id);
      await _sb.auth.signOut();
    }

    localStorage.clear();
    if(typeof showToast !== "undefined") showToast('All data cleared ✓', 'success');

    setTimeout(() => {
      window.location.replace('landing.html');
    }, 1500);

  } catch(err) {
    if(typeof showToast !== "undefined") showToast('Error: ' + err.message, 'error');
  }
}

        


        

        document.addEventListener(
  'DOMContentLoaded', async function() {
  
  // Safety timeout — if auth check 
  // takes more than 5 seconds,
  // something is wrong, just load the page
  const safetyTimer = setTimeout(() => {
    console.warn(
      'Auth check timed out — loading anyway');
    if (typeof initApp === 'function') {
      initApp();
    }
  }, 5000);
  
  try {
    // Check Supabase session
    const { data: { session } } = 
      await window._sb.auth.getSession();
    
    clearTimeout(safetyTimer);
    
    if (session) {
      const { data: profile } = await window._sb
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (profile) {
        localStorage.setItem(
          'fz_current_user',
          profile.username);
        localStorage.setItem(
          'fz_is_admin',
          profile.is_admin ? 
            'true' : 'false');
      }
      
      if (typeof initApp === 'function') {
        initApp();
      }
      
    } else {
      const localUser = localStorage.getItem(
        'fz_current_user');
      
      if (!localUser) {
        // Only redirect if this is index.html
        // landing.html should never redirect
        if (window.location.pathname
            .includes('index') || window.location.pathname === '/') {
          window.location.replace(
            'landing.html');
        }
        return;
      }
      
      if (typeof initApp === 'function') {
        initApp();
      }
    }
    
  } catch(err) {
    clearTimeout(safetyTimer);
    console.error('Auth error:', err);
    
    // Even if Supabase fails,
    // still load the page
    const localUser = localStorage.getItem(
      'fz_current_user');
    
    if (!localUser && 
        (window.location.pathname
          .includes('index') || window.location.pathname === '/')) {
      window.location.replace('landing.html');
    } else {
      if (typeof initApp === 'function') {
        initApp();
      }
    }
  }
});


        // 6. Quotes
        const quotesList = [
            "The expert in anything was once a beginner. — Helen Hayes",
            "An investment in knowledge pays the best interest. — Benjamin Franklin",
            "Learning never exhausts the mind. — Leonardo da Vinci",
            "The more that you read, the more things you will know. — Dr. Seuss",
            "Education is not the filling of a pail, but the lighting of a fire. — W.B. Yeats",
            "Live as if you were to die tomorrow. Learn as if you were to live forever. — Gandhi",
            "The beautiful thing about learning is nobody can take it away from you. — B.B. King",
            "It does not matter how slowly you go as long as you do not stop. — Confucius"
        ];
        
        window.renderMotivationalQuote = function() {
            const qc = document.getElementById('quote-container-wrapper');
            const prefQuotes = document.getElementById('pref-quotes');
            if(!qc) return;
            if(prefQuotes && !prefQuotes.checked) {
                qc.innerHTML = '';
                return;
            }
            const q = quotesList[Math.floor(Math.random() * quotesList.length)].split(' — ');
            
            if(q.length === 2) {
                qc.innerHTML = '<div class="quote-card"><div class="quote-text">"' + q[0] + '"</div><div class="quote-author">— ' + q[1] + '</div></div>';
            } else {
                qc.innerHTML = '<div class="quote-card"><div class="quote-text">"' + q[0] + '"</div></div>';
            }
        }

        