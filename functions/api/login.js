import { checkCredentials, signSession, sessionCookieHeader, json } from '../_lib/auth.js';

export async function onRequestPost({ request, env }) {
  if (!env.AUTH_USER || !env.AUTH_PASS || !env.SESSION_SECRET) {
    return json({ error: 'server-misconfigured' }, { status: 500 });
  }
  let body;
  try { body = await request.json(); } catch { return json({ error: 'bad-request' }, { status: 400 }); }

  if (!checkCredentials(env, body.user, body.pass)) {
    return json({ error: 'invalid-credentials' }, { status: 401 });
  }

  const token = await signSession(env);
  return json({ ok: true }, { headers: { 'Set-Cookie': sessionCookieHeader(token) } });
}
