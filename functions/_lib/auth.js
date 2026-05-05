const COOKIE_NAME = 'session';
const MAX_AGE = 60 * 60 * 24 * 30;

const enc = new TextEncoder();

async function hmac(secret, msg) {
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(msg));
  return b64url(new Uint8Array(sig));
}

function b64url(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export async function signSession(env) {
  const ts = Math.floor(Date.now() / 1000);
  const payload = String(ts);
  const sig = await hmac(env.SESSION_SECRET, payload);
  return `${payload}.${sig}`;
}

export async function verifySession(token, env) {
  if (!token || typeof token !== 'string') return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;
  const ts = Number(payload);
  if (!Number.isFinite(ts)) return false;
  if (Math.floor(Date.now() / 1000) - ts > MAX_AGE) return false;
  const expected = await hmac(env.SESSION_SECRET, payload);
  return safeEqual(sig, expected);
}

export function getSessionCookie(request) {
  const raw = request.headers.get('Cookie') || '';
  for (const part of raw.split(/;\s*/)) {
    const [k, ...v] = part.split('=');
    if (k === COOKIE_NAME) return v.join('=');
  }
  return null;
}

export function sessionCookieHeader(token) {
  return `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${MAX_AGE}`;
}

export function clearCookieHeader() {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

export function checkCredentials(env, user, pass) {
  return safeEqual(user || '', env.AUTH_USER || '') && safeEqual(pass || '', env.AUTH_PASS || '');
}

export async function requireAuth(request, env) {
  const token = getSessionCookie(request);
  if (!(await verifySession(token, env))) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  return null;
}

export function json(body, init = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) }
  });
}
