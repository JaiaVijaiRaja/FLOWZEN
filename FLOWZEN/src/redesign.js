import Chart from 'chart.js/auto';
import confetti from 'canvas-confetti';

// Redesign Logic injected to override original behavior
window.Chart = Chart;
window.confetti = confetti;

// Initialize Redesign Logic
document.addEventListener('DOMContentLoaded', () => {
    // We can also let the normal execution flow to start, then intercept
});

setTimeout(() => {
    overrideLogSession();
    window.refreshDashboard();
    overrideNav();
    
    // Safety check: Fix avatar setting bug in profile
    const profAvatar = document.getElementById('profile-avatar-large');
    if (profAvatar && window.currentUserData) {
        profAvatar.textContent = window.currentUserData.name.charAt(0).toUpperCase();
    }
}, 100); // Let the original initApp() finish

function getSessionsKey() {
    const userData = window.currentUserData || (typeof currentUserData !== 'undefined' ? currentUserData : null);
    return `lf_sessions_${userData?.name || ''}`;
}

function getSessions() {
    try {
        return JSON.parse(localStorage.getItem(getSessionsKey())) || [];
    } catch (e) {
        return [];
    }
}

function saveSessions(sessions) {
    const userData = window.currentUserData || (typeof currentUserData !== 'undefined' ? currentUserData : null);
    if(!userData) return;
    localStorage.setItem(getSessionsKey(), JSON.stringify(sessions));
}

// Map local categories to colors for rendering
const catColors = {
    'Coding': 'var(--c-primary)',
    'Design': 'var(--c-pink)',
    'Math': 'var(--c-green)',
    'Project': 'var(--c-orange)',
    'Other': 'var(--c-text-muted)'
};

function overrideNav() {
    const navTabs = document.querySelectorAll('#main-nav-tabs a');
    const dashboardView = document.getElementById('dashboard-content');
    const logSessionView = document.getElementById('log-session-view');
    const aiInsightsView = document.getElementById('ai-insights-view');
    const todosView = document.getElementById('todos-view');
    const profileView = document.getElementById('profile-view');

    // Replace click listeners by cloning
    const navTabsContainer = document.getElementById('main-nav-tabs');
    const newNavTabsContainer = navTabsContainer.cloneNode(true);
    navTabsContainer.replaceWith(newNavTabsContainer);

    const newTabs = newNavTabsContainer.querySelectorAll('a');
    newTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            const target = e.target.getAttribute('data-target');
            if (!target) return;
            e.preventDefault();
            
            newTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            dashboardView.style.display = target === 'dashboard-content' ? 'flex' : 'none';
            if (logSessionView) logSessionView.style.display = target === 'log-session-view' ? 'block' : 'none';
            aiInsightsView.style.display = target === 'ai-insights-view' ? 'block' : 'none';
            todosView.style.display = target === 'todos-view' ? 'block' : 'none';
            if(profileView) profileView.style.display = target === 'profile-view' ? 'block' : 'none';
            
            if(target === 'dashboard-content') {
                window.refreshDashboard();
            } else if (target === 'log-session-view') {
                initLogSessionView();
            } else if(target === 'ai-insights-view') {
                if (window.initAIInsightsView) window.initAIInsightsView();
            } else if(target === 'todos-view') {
                if (window.initTodosView) window.initTodosView();
            } else if(target === 'profile-view') {
                if (window.initProfileView) window.initProfileView();
            }
        });
    });
}

function overrideLogSession() {
    const oldForm = document.getElementById('log-session-form');
    if (!oldForm) return;
    
    // Strip original listeners
    const form = oldForm.cloneNode(true);
    oldForm.replaceWith(form);

    // Form logic
    const durationControl = document.getElementById('duration-control');
    const durDesc = document.getElementById('duration-desc');
    const catBtns = document.querySelectorAll('.cat-btn');
    const moodBtns = document.querySelectorAll('.mood-btn');
    const skillInput = document.getElementById('log-skill');
    const notesInput = document.getElementById('log-notes');

    let currentDurationMins = 60;
    let selectedCat = 'Coding';
    let selectedMood = 'Neutral';

    function formatDuration(mins) {
        if (mins < 60) return `${mins}m`;
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return m > 0 ? `${h}h ${m}m` : `${h}h`;
    }

    if (durationControl) {
        durationControl.addEventListener('click', (e) => {
            if(e.target.tagName === 'BUTTON') {
                e.preventDefault();
                const sign = e.target.textContent === '+' ? 1 : -1;
                currentDurationMins += sign * 15;
                if (currentDurationMins < 15) currentDurationMins = 15;
                if (currentDurationMins > 720) currentDurationMins = 720;
                durationControl.querySelector('span').textContent = formatDuration(currentDurationMins);
            }
        });
    }

    catBtns.forEach(btn => btn.addEventListener('click', (e) => {
        e.preventDefault();
        catBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedCat = btn.getAttribute('data-cat') || 'Other';
    }));

    moodBtns.forEach(btn => btn.addEventListener('click', (e) => {
        e.preventDefault();
        moodBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedMood = btn.textContent;
    }));

    // Success Card Dismiss
    const successCard = document.getElementById('log-success-card');
    const limitOverlay = document.getElementById('limit-overlay');
    
    document.getElementById('btn-dismiss-success')?.addEventListener('click', () => {
        successCard.classList.add('hidden');
        successCard.classList.remove('visible');
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const sessions = getSessions();
        if (!window.currentUserData?.isAdmin && sessions.length >= 10) {
            if (limitOverlay) limitOverlay.classList.remove('hidden');
            return;
        }

        const skill = skillInput.value.trim() || 'General Study';
        const notes = notesInput.value.trim();

        const newSession = {
            id: Date.now().toString(),
            skill,
            hours: currentDurationMins / 60,
            category: selectedCat,
            mood: selectedMood,
            notes,
            date: new Date().toISOString()
        };

        sessions.unshift(newSession);
        saveSessions(sessions);
        
        // Reset form visually
        skillInput.value = '';
        notesInput.value = '';
        currentDurationMins = 60;
        if(durationControl) durationControl.querySelector('span').textContent = formatDuration(currentDurationMins);
        catBtns.forEach(b => b.classList.remove('selected'));
        if(catBtns[0]) {
            catBtns[0].classList.add('selected');
            selectedCat = catBtns[0].getAttribute('data-cat');
        }
        moodBtns.forEach(b => b.classList.remove('selected'));
        for(let mb of moodBtns){ if(mb.textContent==='😐'){ mb.classList.add('selected'); selectedMood='😐'; break; }}

        // Confetti
        if (window.confetti) {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#7C6BFF', '#FF6B9D', '#6BFFCA']
            });
        }
        
        // Show success
        successCard.style.display = 'flex';
        successCard.classList.remove('hidden');
        successCard.classList.add('visible');
        setTimeout(() => {
            successCard.classList.add('hidden');
            successCard.classList.remove('visible');
            setTimeout(() => {
                successCard.style.display = 'none';
            }, 300);
        }, 3000);

        window.refreshDashboard();
        initLogSessionView();
    });

    // Make window delete global
    window.deleteSession = function(id) {
        let sessions = getSessions();
        sessions = sessions.filter(s => s.id !== id);
        saveSessions(sessions);
        window.refreshDashboard();
        initLogSessionView(); // refresh table
    }
}

// View Init Hooks
function initLogSessionView() {
    // 1. Update clock
    const clockEl = document.getElementById('live-clock');
    if (clockEl) {
        clockEl.textContent = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }

    // 2. Usage bar logic
    const usageBar = document.getElementById('monthly-usage-bar');
    const sessions = getSessions();
    const userData = window.currentUserData || (typeof currentUserData !== 'undefined' ? currentUserData : null);
    if (usageBar) {
        if (userData?.isAdmin) {
            usageBar.innerHTML = '✨ Admin: Unlimited Sessions Logging Enabled';
            usageBar.style.color = 'var(--c-primary)';
            usageBar.style.backgroundColor = 'rgba(124, 107, 255, 0.1)';
        } else {
            const pct = Math.min(100, (sessions.length / 10) * 100);
            usageBar.innerHTML = `
                <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem; font-size:0.85rem">
                    <span>Monthly Free Tier Usage</span>
                    <span>${sessions.length} / 10 Sessions</span>
                </div>
                <div style="height:4px; background:rgba(255,255,255,0.1); border-radius:2px; overflow:hidden;">
                    <div style="height:100%; width:${pct}%; background:var(--c-pink); transition: width 0.5s;"></div>
                </div>
            `;
        }
    }
    
    const logBanner = document.getElementById('log-upgrade-banner');
    if (logBanner) {
        if (!userData?.isAdmin && sessions.length >= 8) {
            logBanner.style.setProperty('display', 'flex', 'important');
            const warnCount = document.getElementById('log-usage-warn-count');
            if (warnCount) warnCount.textContent = sessions.length;
        } else {
            logBanner.style.setProperty('display', 'none', 'important');
        }
    }

    // 3. Render Session Table
    const tbody = document.getElementById('session-table-body');
    if (tbody) {
        tbody.innerHTML = '';
        if (sessions.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 2rem; color:var(--c-text-muted);">No sessions yet. Log one above!</td></tr>`;
        } else {
            sessions.slice(0, 10).forEach(s => {
                const tr = document.createElement('tr');
                const d = new Date(s.date).toLocaleDateString();
                const color = catColors[s.category] || 'var(--c-primary)';
                tr.innerHTML = `
                    <td style="font-weight: 500">${s.skill}</td>
                    <td style="font-family: var(--f-mono)">${s.hours.toFixed(2).replace('.00','')}h</td>
                    <td><span class="cat-pill" style="border-color:${color}; color:${color}">${s.category}</span></td>
                    <td>${s.mood || '😐'}</td>
                    <td style="color:var(--c-text-faint)">${d}</td>
                    <td><button class="btn-delete" onclick="deleteSession('${s.id}')" title="Delete">❌</button></td>
                `;
                tbody.appendChild(tr);
            });
        }
    }
}

// Override Refresh Dashboard
window.refreshDashboard = function() {
    const sessions = getSessions();
    const userData = window.currentUserData || (typeof currentUserData !== 'undefined' ? currentUserData : null);
    
    // 1. Hero variables
    const greetingEl = document.getElementById('hero-greeting');
    const dateEl = document.getElementById('hero-date');
    if (greetingEl) {
        const hour = new Date().getHours();
        let tod = "evening 🌙";
        if (hour < 12) tod = "morning ☀️";
        else if (hour < 18) tod = "afternoon ☕";
        greetingEl.textContent = `Good ${tod}, ${userData?.name || 'User'}`;
    }
    if (dateEl) {
        dateEl.textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    }

    // 2. Goal Ring
    const goalHourText = document.getElementById('goal-hours-text');
    const goalCircle = document.getElementById('goal-circle-progress');
    let todayHours = 0;
    const todayStr = new Date().toDateString();
    sessions.forEach(s => {
        if (new Date(s.date).toDateString() === todayStr) {
            todayHours += s.hours;
        }
    });
    if (goalHourText) goalHourText.textContent = `${todayHours.toFixed(1).replace('.0','')}h / 2h`;
    if (goalCircle) {
        const pct = Math.min(100, Math.max(0, (todayHours / 2) * 100));
        goalCircle.style.strokeDashoffset = 126 - (126 * pct) / 100;
    }

    // 3. Stats
    const elHours = document.getElementById('dash-stat-hours');
    const elDays = document.getElementById('dash-stat-days');
    const elSkills = document.getElementById('dash-stat-skills');
    
    let totalHours = 0;
    const activeDays = new Set();
    const skillsMap = {};
    
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    let recentHours = 0;

    sessions.forEach(s => {
        totalHours += s.hours;
        const d = new Date(s.date);
        activeDays.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
        if(d > weekAgo) recentHours += s.hours;
        if (!skillsMap[s.skill]) skillsMap[s.skill] = { hours: 0, cat: s.category };
        skillsMap[s.skill].hours += s.hours;
    });

    if (elHours) elHours.textContent = totalHours.toFixed(1).replace('.0','');
    if (elDays) elDays.textContent = activeDays.size;
    if (elSkills) elSkills.textContent = Object.keys(skillsMap).length;

    // Small positive indicator check
    const hTrend = document.getElementById('dash-trend-hours');
    if(hTrend) hTrend.textContent = `+${recentHours.toFixed(1)}h this week`;

    // 4. Podium
    const sortedSkills = Object.entries(skillsMap).map(([k,v])=>({name:k, hours:v.hours, cat:v.cat})).sort((a,b)=>b.hours-a.hours);
    const place1 = document.getElementById('podium-1-name');
    const place2 = document.getElementById('podium-2-name');
    const place3 = document.getElementById('podium-3-name');
    if (place1) place1.textContent = sortedSkills[0]?.name || '---';
    if (place2) place2.textContent = sortedSkills[1]?.name || '---';
    if (place3) place3.textContent = sortedSkills[2]?.name || '---';

    // Top Skills Pills
    const skillsList = document.getElementById('top-skills-list');
    if (skillsList) {
        skillsList.innerHTML = '';
        sortedSkills.slice(0, 5).forEach(s => {
            const color = catColors[s.cat] || 'var(--c-primary)';
            skillsList.innerHTML += `<div class="skill-pill" style="border-color:${color};"><span class="skill-dot" style="background:${color}"></span>${s.name} <span style="opacity:0.6;font-size:0.8rem">${s.hours.toFixed(1)}h</span></div>`;
        });
    }

    // 5. Timeline
    const timeline = document.getElementById('activity-timeline');
    if (timeline) {
        timeline.innerHTML = '';
        if (sessions.length === 0) {
            timeline.innerHTML = `<div style="text-align:center; padding: 2rem; color:var(--c-text-muted);">No activity to show. Navigate to Log Session!</div>`;
        } else {
            sessions.slice(0, 5).forEach(s => {
                const color = catColors[s.category] || 'var(--c-primary)';
                const d = new Date(s.date);
                const timeStr = d.toLocaleDateString(undefined, {month:'short', day:'numeric'}) + ' ' + d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
                timeline.innerHTML += `
                    <div class="timeline-item">
                        <div class="timeline-dot" style="background:${color}; box-shadow:0 0 10px ${color}"></div>
                        <div class="timeline-content">
                            <div class="timeline-title">${s.skill} <span style="color:${color}; font-size:0.85rem; margin-left:0.5rem">${s.hours.toFixed(1)}h</span></div>
                            <div class="timeline-time">${timeStr} · ${s.category}</div>
                        </div>
                    </div>
                `;
            });
        }
    }

        // 6. Heatmap
    renderHeatmap(sessions);
    
    // Sparklines (7 days data mock for visual)
    const mockData1 = [2, 4, 1, 5, 3, 6, 2];
    const mockData2 = [1, 2, 2, 3, 5, 4, 6];
    const mockData3 = [5, 4, 6, 2, 1, 3, 4];
    
    drawSparkline('dash-sparkline-1', '#7C6BFF', mockData1); // Primary (hours)
    drawSparkline('dash-sparkline-2', '#FF6B9D', mockData2); // Pink (active days)
    drawSparkline('dash-sparkline-3', '#6BFFCA', mockData3); // Green (skills)
    
    if (window.renderMotivationalQuote) {
        window.renderMotivationalQuote();
    }
};

function drawSparkline(canvasId, color, dataPoints) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    if(!dataPoints || dataPoints.length === 0) return;
    
    const max = Math.max(...dataPoints, 1);
    const min = 0;
    const range = max - min;
    const step = w / (dataPoints.length - 1 || 1);
    
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    dataPoints.forEach((val, i) => {
        const x = i * step;
        const y = h - ((val - min) / (range || 1)) * (h - 4) - 2; // pad top/bottom
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();
    
    // fill
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = color;
    ctx.fill();
    ctx.globalAlpha = 1.0;
}

window.renderMotivationalQuote = function() {
    const qc = document.getElementById('quote-container-wrapper');
    const prefQuotes = document.getElementById('pref-quotes');
    if(!qc) return;
    if(prefQuotes && !prefQuotes.checked) {
        qc.innerHTML = '';
        return;
    }
    const quotesList = [
        "The expert in anything was once a beginner. — Helen Hayes",
        "An investment in knowledge pays the best interest. — Benjamin Franklin",
        "Learning never exhausts the mind. — Leonardo da Vinci",
        "The more that you read, the more things you will know. — Dr. Seuss",
        "Education is not the filling of a pail, but the lighting of a fire. — W.B. Yeats",
        "There is no end to education. — Jiddu Krishnamurti",
        "The beautiful thing about learning is nobody can take it away from you. — B.B. King",
        "It does not matter how slowly you go as long as you do not stop. — Confucius"
    ];
    const q = quotesList[Math.floor(Math.random() * quotesList.length)].split(' — ');
    qc.innerHTML = `
        <div class="quote-card-redesigned" style="animation: slideInUp 0.5s ease-out;">
            <blockquote>"${q[0]}"</blockquote>
            <cite>— ${q[1]}</cite>
            <button class="btn-outline-white" onclick="window.renderMotivationalQuote()" style="color:var(--c-text-muted); border-color:var(--c-border); padding: 0.5rem 1rem;">
                Next Quote &rarr;
            </button>
        </div>
    `;
};

function renderHeatmap(sessions) {
    const heatmapGrid = document.getElementById('heatmap-grid');
    if (!heatmapGrid) return;
    heatmapGrid.innerHTML = '';
    
    // Create 28 days mock data leading up to today
    const mapData = {};
    for(let i=0; i<28; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        mapData[d.toDateString()] = 0;
    }

    sessions.forEach(s => {
        const dStr = new Date(s.date).toDateString();
        if (mapData[dStr] !== undefined) {
            mapData[dStr] += s.hours;
        }
    });

    const dates = Object.keys(mapData).reverse(); // Oldest first
    dates.forEach(dStr => {
        const val = mapData[dStr];
        let lvl = 0;
        if (val > 0) lvl = 1;
        if (val > 1) lvl = 2;
        if (val >= 3) lvl = 3;
        
        const block = document.createElement('div');
        block.className = `heatmap-block level-${lvl}`;
        block.title = `${dStr}: ${val.toFixed(1)}h`;
        heatmapGrid.appendChild(block);
    });
}
