// Password hashing (scrypt, built into Node -- no extra dependency) and
// signed session tokens (HMAC-SHA256, also built-in). A real SESSION_SECRET
// (at least 32 characters) MUST be set in the Vercel project settings. There
// is deliberately no built-in fallback: a secret that lives in a public repo
// would let anyone forge an admin token.
const crypto = require('crypto');

const TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // sessions expire after 7 days

function getSecret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error('SESSION_SECRET is not set (or shorter than 32 characters). Set it in the environment.');
  }
  return s;
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [salt, hash] = stored.split(':');
  const check = crypto.scryptSync(password, salt, 64).toString('hex');
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(check, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function base64url(input) {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function base64urlDecode(input) {
  input = input.replace(/-/g, '+').replace(/_/g, '/');
  while (input.length % 4) input += '=';
  return Buffer.from(input, 'base64').toString('utf8');
}

function signToken(payload) {
  const body = base64url(JSON.stringify({ ...payload, iat: Date.now() }));
  const sig = crypto.createHmac('sha256', getSecret()).update(body).digest('hex');
  return `${body}.${sig}`;
}

function verifyToken(token) {
  if (!token) return null;
  const [body, sig] = String(token).split('.');
  if (!body || !sig) return null;
  let expected;
  try {
    expected = crypto.createHmac('sha256', getSecret()).update(body).digest('hex');
  } catch (e) {
    return null; // no usable secret configured: nothing can be verified
  }
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(base64urlDecode(body));
    if (!payload || typeof payload.iat !== 'number' || Date.now() - payload.iat > TOKEN_MAX_AGE_MS) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

/** Pulls and verifies the bearer token from a Vercel API request. */
function currentUser(req) {
  const header = req.headers.authorization || req.headers.Authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  return verifyToken(token);
}

module.exports = { hashPassword, verifyPassword, signToken, verifyToken, currentUser };
