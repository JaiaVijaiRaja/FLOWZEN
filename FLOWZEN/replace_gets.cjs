const fs = require('fs');

const path = 'index.html';
let content = fs.readFileSync(path, 'utf8');

const s1Match = \`function getSessions() {
            const username = localStorage.getItem("fz_current_user") || "guest";
            return JSON.parse(localStorage.getItem("fz_sessions_" + username) || "[]");
        }\`;

const s1Replace = \`async function getSessions() {
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
}\`;

content = content.replace(s1Match, s1Replace);

const s2Match = \`function getTodos() {
            const username = localStorage.getItem("fz_current_user") || "guest";
            return JSON.parse(localStorage.getItem("fz_todos_" + username) || "[]");
        }\`;

const s2Replace = \`async function getTodos() {
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
}\`;

content = content.replace(s2Match, s2Replace);


// Now I need to see what the saveSession logic is like. Let's do saveSession next.
fs.writeFileSync(path, content);
