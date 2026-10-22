// POST /api/auth  { op: 'otp-send' | 'otp-verify' | 'me' | 'delete', ... }
// 전화번호 하나로 가족·강사·어르신이 같은 계정을 쓴다(06 명세 1-2). 문자 키가 없으면 개발 모드로 어떤 6자리든 통과.
const sms = require('./_lib/sms');
const auth = require('./_lib/auth');
const { sb, one, digits, err, slack } = require('./_lib/db');

const DEV = !sms.configured();

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Origin', '*'); res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); return res.status(204).end(); }
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' });
  let body = req.body; if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } } body = body || {};
  const op = String(body.op || '');
  try {
    if (op === 'otp-send') {
      const phone = digits(body.phone);
      if (process.env.REVIEW_PHONE && digits(process.env.REVIEW_PHONE) === phone) return res.status(200).json({ ok: true, review: true });
      if (DEV) return res.status(200).json({ ok: true, dev: true, message: '개발 모드: 아무 6자리로 들어갑니다.' });
      const { code } = await auth.issue(phone);
      const r = await sms.send(phone, `[키오런] 인증번호 ${code} (3분 안에 입력)`);
      if (!r.ok) { console.error('sms fail', r.error); const e = err(502, '문자를 보내지 못했어요. 잠시 뒤 다시 해 주세요.'); e.detail = String(r.error || '').slice(0, 80); throw e; }
      return res.status(200).json({ ok: true });
    }
    if (op === 'otp-verify') {
      const phone = await auth.check(body.phone, body.code, DEV);
      const { account, instructor } = await auth.upsertAccount(phone, String(body.name || '').trim().slice(0, 30), body.cert_no);
      const token = auth.sign({ id: account.id, exp: Date.now() + 30 * 86400e3 });
      if (instructor && !account.first_instructor_login_at) { await sb(`app_accounts?id=eq.${account.id}`, { method: 'PATCH', prefer: 'return=minimal', body: { first_instructor_login_at: new Date().toISOString() } }); await slack(`📱 강사 앱 첫 로그인 — ${instructor.name} (${instructor.certNo})`); }
      return res.status(200).json({ ok: true, token, account: pub(account), instructor });
    }
    const acc = await auth.requireAuth(req, body);
    if (op === 'me') {
      const settings = acc.roles.includes('instructor') ? await one(`app_instructor_settings?select=*&account_id=eq.${acc.id}`) : null;
      return res.status(200).json({ ok: true, account: pub(acc), settings, dev: DEV });
    }
    if (op === 'delete') {
      await sb(`app_accounts?id=eq.${acc.id}`, { method: 'PATCH', prefer: 'return=minimal', body: { status: 'deleted', delete_requested_at: new Date().toISOString() } });
      await slack(`🗑 계정 삭제 요청 — ${acc.name || ''} ${acc.phone.slice(-4)} (30일 뒤 삭제)`);
      return res.status(200).json({ ok: true });
    }
    throw err(400, `알 수 없는 op: ${op}`);
  } catch (e) {
    const st = e.status || 500;
    return res.status(st).json({ ok: false, detail: e.detail || undefined, error: e.message === 'SETUP_REQUIRED' ? '앱 데이터베이스가 아직 준비되지 않았습니다.' : e.message === 'STORE_NOT_CONFIGURED' ? '서버 설정이 비어 있습니다.' : e.message });
  }
};
function pub(a) { return { id: a.id, phone: a.phone, name: a.name, roles: a.roles, lastMode: a.last_mode || 'family', traineeId: a.trainee_id || null }; }
