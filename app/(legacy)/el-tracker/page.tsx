'use client';

// Literal copy of the original Agreement-Tracker-PDKA GitHub app: this
// iframe loads its unmodified UI/business logic (public/legacy/el-tracker/
// index.html), including its own IndexedDB-based offline merge/conflict
// handling. The one deliberate change from the original: OneDrive/Graph sync
// (which relied on a client-side GitHub write token to refresh a shared
// "master token" cached in a public repo file) has been replaced with a
// plain Postgres-backed API (/api/legacy-el-tracker/*), session-gated by
// this app's own login. That original token had leaked publicly, so this
// port does not reproduce that pattern. Everything else -- agreements,
// bills, client tasks, the in-app staff login screen, rendering -- is
// untouched. First-time setup uses a default admin login (admin / admin123)
// -- change it after first sign-in.
export default function ElTrackerPage() {
  return (
    <iframe
      src="/legacy/el-tracker/index.html"
      title="EL Tracker"
      style={{ width: '100%', height: '100vh', border: 'none', background: '#fff' }}
    />
  );
}
