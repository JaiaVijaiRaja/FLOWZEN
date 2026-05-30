const fs = require('fs');

const path = 'index.html';
let content = fs.readFileSync(path, 'utf8');

// 1. Auth Guard
const authMatch = "        function initApp() {\n            // Trigger fade-in animation\n            requestAnimationFrame(() => {\n                body.classList.add('loaded');\n            });\n\n            const user = localStorage.getItem(\"fz_current_user\");\n\n            if (user && user.trim() !== \"\") {\n                const isAdmin = localStorage.getItem(\"fz_is_admin\") === \"true\";\n                // If user is logged in, show the app immediately, autofilling data implicitly\n                showAppScreen({ name: user, isAdmin: isAdmin });\n            } else {\n                window.location.replace(\"landing.html\");\n            }\n        }";

const authReplace = `        async function initApp() {
            requestAnimationFrame(() => {
                body.classList.add('loaded');
            });

            const user = localStorage.getItem("fz_current_user");
            if (user && user.trim() !== "") {
                const isAdmin = localStorage.getItem("fz_is_admin") === "true";
                showAppScreen({ name: user, isAdmin: isAdmin });
            } else {
                window.location.replace("landing.html");
            }
        }`;
// Wait, the prompt requested: "Replace auth guard at top with: document.addEventListener('DOMContentLoaded', async function() { ..."
// The prompt meant replacing the event listener OR placing the boot sequence. Let's place it at the end of the script where the init app is called.

const bootMatch = "        // Run boot sequence\n        initApp();";
const bootReplace = `        // Run boot sequence
        document.addEventListener('DOMContentLoaded', async function() {
          try {
            const { data: { session } } = await _sb.auth.getSession();
            if (session) {
              const { data: profile } = await _sb.from('profiles').select('*').eq('id', session.user.id).single();
              if (profile) {
                localStorage.setItem('fz_current_user', profile.username);
                localStorage.setItem('fz_is_admin', profile.is_admin ? 'true' : 'false');
              }
              initApp();
            } else {
              const localUser = localStorage.getItem('fz_current_user');
              if (!localUser) {
                window.location.replace('landing.html');
                return;
              }
              initApp();
            }
            _sb.auth.onAuthStateChange((event, session) => {
              if (event === 'SIGNED_OUT') {
                localStorage.removeItem('fz_current_user');
                localStorage.removeItem('fz_is_admin');
                window.location.replace('landing.html');
              }
            });
          } catch(err) {
            console.error('Auth error:', err);
            const localUser = localStorage.getItem('fz_current_user');
            if (!localUser) {
              window.location.replace('landing.html');
            } else {
              initApp();
            }
          }
        });`;
content = content.replace(bootMatch, bootReplace);

// 2. getSessions
const getSessionsMatch = `        function getSessions() {
            const username = localStorage.getItem("fz_current_user") || "guest";
            return JSON.parse(localStorage.getItem("fz_sessions_" + username) || "[]");
        }`;
const getSessionsReplace = `        async function getSessions() {
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
}`;
content = content.replace(getSessionsMatch, getSessionsReplace);

// 3. getTodos
const getTodosMatch = `        function getTodos() {
            const username = localStorage.getItem("fz_current_user") || "guest";
            return JSON.parse(localStorage.getItem("fz_todos_" + username) || "[]");
        }`;
const getTodosReplace = `        async function getTodos() {
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
}`;
content = content.replace(getTodosMatch, getTodosReplace);

// 4. saveSession
// Not found exactly as "function saveSession", so we will just append the new saveSession function.
// Actually let's just append it to the script block right before the first closing tag.

// 5. saveTodo, toggleTodo, deleteTodo, deleteSession, executeDeleteAll
// Append them right before </script>

const appendedFunctions = `

window.saveSession = async function(sessionData) {
  try {
    const { data: { user } } = await _sb.auth.getUser();
    if (user) {
      const { error } = await _sb.from('sessions').insert({
          user_id: user.id, skill: sessionData.skill, hours: sessionData.hours, duration_minutes: sessionData.durationMinutes, category: sessionData.category, mood: sessionData.mood, notes: sessionData.notes || '', date: sessionData.date, date_raw: sessionData.dateRaw, weekday: sessionData.weekday
        });
      if (error) throw error;
      return true;
    }
  } catch(e) { console.error('Save error:', e); }
  const uname = localStorage.getItem('fz_current_user') || 'guest';
  const key = 'fz_sessions_' + uname;
  const existing = JSON.parse(localStorage.getItem(key) || '[]');
  existing.unshift(sessionData);
  localStorage.setItem(key, JSON.stringify(existing));
  return true;
};

window.saveTodo = async function(todoData) {
  try {
    const { data: { user } } = await _sb.auth.getUser();
    if (user) {
      const { error } = await _sb.from('todos').insert({
          user_id: user.id, text: todoData.text, tag: todoData.tag, priority: todoData.priority, due: todoData.due, done: false
        });
      if (error) throw error;
      syncAll();
      return true;
    }
  } catch(e) { console.error('Todo save error:', e); }
  const uname = localStorage.getItem('fz_current_user') || 'guest';
  const key = 'fz_todos_' + uname;
  const existing = JSON.parse(localStorage.getItem(key) || '[]');
  existing.unshift({
    ...todoData, id: Date.now(), createdAt: new Date().toISOString(), done: false
  });
  localStorage.setItem(key, JSON.stringify(existing));
  syncAll();
  return true;
};

window.toggleTodo = async function(id) {
  const todos = await getTodos();
  const todo = todos.find(t => t.id === id);
  if (!todo) return;
  const newDone = !todo.done;
  try {
    const { data: { user } } = await _sb.auth.getUser();
    if (user) {
      await _sb.from('todos').update({ done: newDone, completed_at: newDone ? new Date().toISOString() : null }).eq('id', id).eq('user_id', user.id);
    } else throw new Error('No user');
  } catch(e) {
    const uname = localStorage.getItem('fz_current_user') || 'guest';
    const key = 'fz_todos_' + uname;
    const all = JSON.parse(localStorage.getItem(key) || '[]');
    const idx = all.findIndex(t => t.id === id);
    if (idx > -1) {
      all[idx].done = newDone;
      localStorage.setItem(key, JSON.stringify(all));
    }
  }
  syncAll();
};

window.deleteTodo = async function(id) {
  try {
    const { data: { user } } = await _sb.auth.getUser();
    if (user) {
      await _sb.from('todos').delete().eq('id', id).eq('user_id', user.id);
    } else throw new Error('No user');
  } catch(e) {
    const uname = localStorage.getItem('fz_current_user') || 'guest';
    const key = 'fz_todos_' + uname;
    let todos = JSON.parse(localStorage.getItem(key) || '[]');
    todos = todos.filter(t => t.id !== id);
    localStorage.setItem(key, JSON.stringify(todos));
  }
  syncAll();
};

window.executeDeleteAll = async function() {
  const val = document.getElementById('deleteConfirmInput')?.value;
  if (val !== 'DELETE') return;
  const isAdmin = localStorage.getItem('fz_is_admin') === 'true';
  if (isAdmin) {
    if(typeof showToast !== 'undefined') showToast('Admin data is protected', 'warn');
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
    if(typeof showToast !== 'undefined') showToast('All data cleared ✓', 'success');
    setTimeout(() => { window.location.replace('landing.html'); }, 1500);
  } catch(err) {
    if(typeof showToast !== 'undefined') showToast('Error: ' + err.message, 'error');
  }
};
`;

content = content.replace("    </script>\n    <!-- Inject redesign logic override -->", appendedFunctions + "\n    </script>\n    <!-- Inject redesign logic override -->");

fs.writeFileSync(path, content);
