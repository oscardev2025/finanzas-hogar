import { requireAuth, json } from '../_lib/auth.js';

const KV_KEY = 'state';

export async function onRequestGet({ request, env }) {
  const unauth = await requireAuth(request, env);
  if (unauth) return unauth;
  if (!env.FINANZAS_KV) return json({ error: 'kv-not-bound' }, { status: 500 });

  const raw = await env.FINANZAS_KV.get(KV_KEY);
  if (!raw) return json({ state: null });
  try {
    return json({ state: JSON.parse(raw) });
  } catch {
    return json({ state: null });
  }
}

export async function onRequestPut({ request, env }) {
  const unauth = await requireAuth(request, env);
  if (unauth) return unauth;
  if (!env.FINANZAS_KV) return json({ error: 'kv-not-bound' }, { status: 500 });

  let body;
  try { body = await request.json(); } catch { return json({ error: 'bad-request' }, { status: 400 }); }
  if (!body || typeof body !== 'object') return json({ error: 'bad-request' }, { status: 400 });

  await env.FINANZAS_KV.put(KV_KEY, JSON.stringify(body));
  return json({ ok: true, savedAt: Date.now() });
}
