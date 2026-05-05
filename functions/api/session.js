import { getSessionCookie, verifySession, json } from '../_lib/auth.js';

export async function onRequestGet({ request, env }) {
  const token = getSessionCookie(request);
  const valid = await verifySession(token, env);
  return json({ authenticated: valid });
}
