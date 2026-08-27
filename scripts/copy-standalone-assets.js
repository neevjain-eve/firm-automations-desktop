// Next.js `output: 'standalone'` intentionally does NOT copy `public/` or
// `.next/static/` into `.next/standalone/` -- the docs say to do it
// yourself (they're meant to be served by a CDN in a normal deployment).
// For the desktop build there's no CDN, so this script copies both in
// after every build, cross-platform (no shell `cp -r`, since this also
// needs to work on the Windows CI runner).
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

copyDir(path.join(root, 'public'), path.join(root, '.next', 'standalone', 'public'));
copyDir(path.join(root, '.next', 'static'), path.join(root, '.next', 'standalone', '.next', 'static'));

console.log('Copied public/ and .next/static/ into .next/standalone/');
