'use client';

// Literal copy of the original PDKASIGN GitHub app -- byte-for-byte, zero
// modifications. Unlike Status Tracker and EL Tracker, this one needed no
// rework: it doesn't use a shared/master token or an embedded write secret.
// Each employee signs in with their own Microsoft account (a real MSAL
// popup, per user, scoped to their own identity) and the signed PDF uploads
// straight to OneDrive via that employee's own Graph token. No admin
// "master token" relay, so no leaked-secret pattern to fix. The admin panel
// for publishing new employee links still asks for a GitHub token manually,
// entered into the browser each session and never stored in the page's
// source -- exactly as in the original.
export default function ESignaturePage() {
  return (
    <iframe
      src="/legacy/e-signature/index.html"
      title="e-Signature"
      style={{ width: '100%', height: '100vh', border: 'none', background: '#fff' }}
    />
  );
}
