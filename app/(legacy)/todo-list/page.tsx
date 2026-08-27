'use client';

// Literal copy of the original TO-DO-LIST GitHub app: this iframe loads its
// unmodified HTML/CSS/JS (public/legacy/todo-list/index.html + app.js),
// which talks to its own unmodified API handlers (pages/api/legacy-todo/*,
// copied verbatim from the original repo) via the /api/tasks, /api/login
// etc. paths it already expects, rewritten to those handlers in
// next.config.mjs. The only thing that changed from the original is the
// storage module underneath those handlers -- it now persists to this
// firm's own Postgres database instead of Vercel KV, so data survives
// deploys and cold starts. The app has its own independent login (admin /
// manager / employee), separate from Firm Automations accounts, exactly as
// it did in the original repo.
export default function ToDoListPage() {
  return (
    <iframe
      src="/legacy/todo-list/index.html"
      title="To-Do List"
      style={{ width: '100%', height: '100vh', border: 'none', background: '#fff' }}
    />
  );
}
