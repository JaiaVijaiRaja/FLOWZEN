const fs = require('fs');

const idxPath = 'index.html';
let content = fs.readFileSync(idxPath, 'utf8');

// Replace document.addEventListener('DOMContentLoaded', () => { ... check config ... initApp ... }) with the new auth guard.
content = content.replace(/document\.addEventListener\('DOMContentLoaded',\s*\(\)\s*=>\s*\{[\s\S]*?initApp\(\);[\s\S]*?\}\);?(\r?\n)?/im, `document.addEventListener('DOMContentLoaded', async function() {
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
});
`);

// Replace handleLogout()
content = content.replace(/function handleLogout\(\)\s*\{[\s\S]*?window\.location\.replace\('landing\.html'\);\s*\}/im, `async function handleLogout() {
  try {
    await _sb.auth.signOut();
  } catch(e) {
    console.log('Signout:', e);
  }
  localStorage.removeItem('fz_current_user');
  localStorage.removeItem('fz_is_admin');
  window.location.replace('landing.html');
}`);

// Replace executeDeleteAll()
content = content.replace(/function executeDeleteAll\(\)\s*\{[\s\S]*?window\.location\.href\s*=\s*'landing\.html';[\s\S]*?\}/im, `async function executeDeleteAll() {
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
}`);

// Replace getSessions()
content = content.replace(/function getSessions\([^)]*\)\s*\{[\s\S]*?return\s+JSON\.parse\(localStorage\.getItem[^)]+\)\s*\|\|\s*'\[\]'\);?\s*\}/im, `async function getSessions() {
  try {
    const { data: { user } } = await _sb.auth.getUser();

    if (user) {
      const { data, error } = await _sb
        .from('sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('date_raw', { ascending: false });

      if (!error && data) {
        return data.map(s => ({
          id: s.id,
          skill: s.skill,
          hours: parseFloat(s.hours),
          durationMinutes: s.duration_minutes,
          category: s.category || 'other',
          mood: s.mood || '',
          notes: s.notes || '',
          date: s.date,
          dateRaw: s.date_raw,
          weekday: s.weekday
        }));
      }
    }
  } catch(e) {
    console.log('Using localStorage:', e);
  }

  const uname = localStorage.getItem('fz_current_user') || 'guest';
  return JSON.parse(localStorage.getItem('fz_sessions_' + uname) || '[]');
}`);


// Replace getTodos()
content = content.replace(/function getTodos\([^)]*\)\s*\{[\s\S]*?return\s+JSON\.parse\(localStorage\.getItem[^)]+\)\s*\|\|\s*'\[\]'\);?\s*\}/im, `async function getTodos() {
  try {
    const { data: { user } } = await _sb.auth.getUser();

    if (user) {
      const { data, error } = await _sb
        .from('todos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data.map(t => ({
          id: t.id,
          text: t.text,
          tag: t.tag,
          priority: t.priority,
          due: t.due,
          done: t.done,
          createdAt: t.created_at,
          completedAt: t.completed_at
        }));
      }
    }
  } catch(e) {
    console.log('Using localStorage:', e);
  }

  const uname = localStorage.getItem('fz_current_user') || 'guest';
  return JSON.parse(localStorage.getItem('fz_todos_' + uname) || '[]');
}`);


// Replace saveSession(sessionData)
content = content.replace(/function saveSession\(sessionData\)\s*\{[\s\S]*?return\s+true;?\s*\}/im, `async function saveSession(sessionData) {
  try {
    const { data: { user } } = await _sb.auth.getUser();

    if (user) {
      const { error } = await _sb
        .from('sessions')
        .insert({
          user_id: user.id,
          skill: sessionData.skill,
          hours: sessionData.hours,
          duration_minutes: sessionData.durationMinutes,
          category: sessionData.category,
          mood: sessionData.mood,
          notes: sessionData.notes || '',
          date: sessionData.date,
          date_raw: sessionData.dateRaw,
          weekday: sessionData.weekday
        });

      if (error) throw error;
      return true;
    }
  } catch(e) {
    console.error('Save error:', e);
  }

  const uname = localStorage.getItem('fz_current_user') || 'guest';
  const key = 'fz_sessions_' + uname;
  const existing = JSON.parse(localStorage.getItem(key) || '[]');
  existing.unshift(sessionData);
  localStorage.setItem(key, JSON.stringify(existing));
  return true;
}`);

// Replace saveTodo(todoData)
content = content.replace(/function saveTodo\(todoData\)\s*\{[\s\S]*?return\s+true;?\s*\}/im, `async function saveTodo(todoData) {
  try {
    const { data: { user } } = await _sb.auth.getUser();

    if (user) {
      const { error } = await _sb
        .from('todos')
        .insert({
          user_id: user.id,
          text: todoData.text,
          tag: todoData.tag,
          priority: todoData.priority,
          due: todoData.due,
          done: false
        });

      if (error) throw error;
      syncAll();
      return true;
    }
  } catch(e) {
    console.error('Todo save error:', e);
  }

  const uname = localStorage.getItem('fz_current_user') || 'guest';
  const key = 'fz_todos_' + uname;
  const existing = JSON.parse(localStorage.getItem(key) || '[]');
  existing.unshift({
    ...todoData,
    id: Date.now(),
    createdAt: new Date().toISOString(),
    done: false
  });
  localStorage.setItem(key, JSON.stringify(existing));
  syncAll();
  return true;
}`);

// Replace window.deleteSession = function(id) OR function deleteSession(id) 
// The grep showed: window.deleteSession = function(id) {
content = content.replace(/window\.deleteSession\s*=\s*function\s*\(\w*\)\s*\{[\s\S]*?syncAll\(\);\s*\}/im, `window.deleteSession = async function(id) {
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
}`);

// Replace toggleTodo
content = content.replace(/window\.toggleTodo\s*=\s*function\s*\(\w*\)\s*\{[\s\S]*?syncAll\(\);\s*\}/im, `window.toggleTodo = async function(id) {
  const todos = await getTodos();
  const todo = todos.find(t => t.id === id);
  if (!todo) return;

  const newDone = !todo.done;

  try {
    const { data: { user } } = await _sb.auth.getUser();

    if (user) {
      await _sb.from('todos')
        .update({
          done: newDone,
          completed_at: newDone ? new Date().toISOString() : null
        })
        .eq('id', id)
        .eq('user_id', user.id);
    } else {
      throw new Error('No user');
    }
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
}`);

// Replace deleteTodo
content = content.replace(/window\.deleteTodo\s*=\s*function\s*\(\w*\)\s*\{[\s\S]*?syncAll\(\);\s*\}/im, `window.deleteTodo = async function(id) {
  if (!confirm("Delete this task?")) return;
  try {
    const { data: { user } } = await _sb.auth.getUser();

    if (user) {
      await _sb.from('todos')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
    } else {
      throw new Error('No user');
    }
  } catch(e) {
    const uname = localStorage.getItem('fz_current_user') || 'guest';
    const key = 'fz_todos_' + uname;
    let todos = JSON.parse(localStorage.getItem(key) || '[]');
    todos = todos.filter(t => t.id !== id);
    localStorage.setItem(key, JSON.stringify(todos));
  }

  syncAll();
}`);

fs.writeFileSync(idxPath, content);
