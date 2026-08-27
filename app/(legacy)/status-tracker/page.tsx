'use client';

// Literal copy of the original Status-Tracker GitHub app: this iframe loads
// its unmodified UI/business logic (public/legacy/status-tracker/index.html),
// with one deliberate change from the original -- the OneDrive/Microsoft
// Graph sync (which relied on a client-side GitHub write token to refresh a
// shared "master token" cached in a public repo file) has been replaced with
// a plain Postgres-backed API (/api/legacy-status-tracker/*), session-gated
// by this app's own login. That original token leaked publicly, so this port
// does not reproduce that pattern. Everything else -- task fields, filters,
// the in-app staff login screen, rendering -- is untouched.
export default function StatusTrackerPage() {
  return (
    <iframe
      src="/legacy/status-tracker/index.html"
      title="Status Tracker"
      style={{ width: '100%', height: '100vh', border: 'none', background: '#fff' }}
    />
  );
}
