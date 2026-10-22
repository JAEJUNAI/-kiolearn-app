// Supabase REST(service role) 헬퍼. 앱 테이블은 RLS를 켜 두고 정책을 두지 않아, 이 서버 키로만 읽고 씁니다.
const url = (process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '').trim().replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

async function sb(path, opts = {}) {
  if (!url || !key) throw Object.assign(new Error('STORE_NOT_CONFIGURED'), { status: 503 });
  const r = await fetch(`${url}/rest/v1/${path}`, {
    method: opts.method || 'GET',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: opts.prefer || 'return=representation' },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const text = await r.text();
  if (!r.ok) {
    if (r.status === 404 || /PGRST205|Could not find the table|does not exist/.test(text)) throw Object.assign(new Error('SETUP_REQUIRED'), { status: 503 });
    throw Object.assign(new Error(`SB_${r.status}: ${text.slice(0, 200)}`), { status: 500 });
  }
  return text ? JSON.parse(text) : null;
}
const one = async (path, opts) => { const rows = await sb(path, opts); return Array.isArray(rows) ? rows[0] || null : rows; };
const digits = (s) => String(s || '').replace(/\D/g, '');
const err = (status, message) => Object.assign(new Error(message), { status });
async function slack(text) { if (!process.env.SLACK_WEBHOOK_URL) return; try { await fetch(process.env.SLACK_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) }); } catch {} }

module.exports = { sb, one, digits, err, slack };
