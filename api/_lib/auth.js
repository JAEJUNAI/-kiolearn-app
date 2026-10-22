// 전화번호 OTP 인증과 세션 토큰. OTP 6자리는 해시로만 저장, 3분 유효, 5회 실패 시 10분 잠금. 토큰은 HMAC 서명 30일.
const crypto = require('crypto');
const { sb, one, digits, err } = require('./db');

const secret = () => (process.env.APP_SECRET || '').trim() || crypto.createHash('sha256').update('app:' + (process.env.SUPABASE_SERVICE_ROLE_KEY || '')).digest('hex');
const hash = (phone, code) => crypto.createHmac('sha256', secret()).update(`${phone}:${code}`).digest('hex');
const b64u = (s) => Buffer.from(s).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
const unb64u = (s) => Buffer.from(String(s).replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');

function sign(payload) { const p = b64u(JSON.stringify(payload)); return `${p}.${crypto.createHmac('sha256', secret()).update(p).digest('hex')}`; }
function verify(token) {
  const [p, sig] = String(token || '').split('.'); if (!p || !sig) return null;
  const exp = crypto.createHmac('sha256', secret()).update(p).digest('hex');
  if (sig.length !== exp.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(exp))) return null;
  try { const d = JSON.parse(unb64u(p)); return d && d.id && d.exp > Date.now() ? d : null; } catch { return null; }
}
function bearer(req) { return String((req.headers && (req.headers.authorization || req.headers.Authorization)) || '').replace(/^Bearer\s+/i, '').trim(); }

/** OTP 발급. 돌려주는 code 는 문자 발송용(호출자가 보낸다). 60초 안 재요청은 거절. */
async function issue(phoneRaw) {
  const phone = digits(phoneRaw); if (!/^01\d{8,9}$/.test(phone)) throw err(400, '휴대폰 번호를 확인해 주세요.');
  const last = await one(`app_otps?select=id,created_at,locked_until&phone=eq.${phone}&order=created_at.desc&limit=1`);
  if (last && last.locked_until && new Date(last.locked_until) > new Date()) throw err(423, '5회 틀려 10분간 잠겼습니다. 잠시 뒤 다시 해 주세요.');
  if (last && Date.now() - new Date(last.created_at).getTime() < 60000) throw err(429, '잠시 뒤 다시 보내 주세요. (60초)');
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  await sb('app_otps', { method: 'POST', prefer: 'return=minimal', body: { phone, code_hash: hash(phone, code), expires_at: new Date(Date.now() + 3 * 60000).toISOString() } });
  return { phone, code };
}

/** OTP 검증. 성공 시 해당 행을 쓴 것으로 표시. 개발 모드(문자 미설정)면 어떤 6자리든 통과. */
async function check(phoneRaw, code, dev) {
  const phone = digits(phoneRaw);
  if (dev && /^\d{6}$/.test(String(code))) return phone;
  const row = await one(`app_otps?select=*&phone=eq.${phone}&used_at=is.null&order=created_at.desc&limit=1`);
  if (!row) throw err(404, '인증번호를 먼저 받아 주세요.');
  if (row.locked_until && new Date(row.locked_until) > new Date()) throw err(423, '5회 틀려 10분간 잠겼습니다.');
  if (new Date(row.expires_at) < new Date()) throw err(410, '인증번호가 만료됐어요. 다시 받아 주세요.');
  if (row.code_hash !== hash(phone, String(code))) {
    const attempts = (row.attempts || 0) + 1; const patch = { attempts };
    if (attempts >= 5) patch.locked_until = new Date(Date.now() + 10 * 60000).toISOString();
    await sb(`app_otps?id=eq.${row.id}`, { method: 'PATCH', prefer: 'return=minimal', body: patch });
    throw err(401, `번호가 맞지 않아요. (${attempts}/5)`);
  }
  await sb(`app_otps?id=eq.${row.id}`, { method: 'PATCH', prefer: 'return=minimal', body: { used_at: new Date().toISOString() } });
  return phone;
}

/** 계정 찾기/만들기 + 역할. 자격번호가 오면 학습실(teach_trainees)에서 전화번호와 맞춰 강사 역할 부여. */
async function upsertAccount(phone, name, certNo) {
  let acc = await one(`app_accounts?select=*&phone=eq.${phone}`);
  const roles = new Set((acc && acc.roles) || ['family', 'seeker']);
  let instructor = null;
  if (certNo) {
    const t = await one(`teach_trainees?select=id,name,phone,cert_no,status&cert_no=eq.${encodeURIComponent(String(certNo).trim().toUpperCase())}`);
    if (!t) throw err(404, '자격번호를 찾을 수 없어요. 학습실에서 발급 여부를 확인해 주세요.');
    if (digits(t.phone) !== phone) throw err(403, '자격번호의 전화번호와 다릅니다. 학습실에 등록한 번호로 로그인해 주세요.');
    if (t.status === '보류' || t.status === '종료') throw err(403, '배정이 중지된 계정입니다. 운영자에게 문의해 주세요.');
    roles.add('instructor'); instructor = { traineeId: t.id, name: t.name, certNo: t.cert_no };
    if (!name) name = t.name;
  }
  const body = { phone, name: name || (acc && acc.name) || '', roles: [...roles], last_login_at: new Date().toISOString(), trainee_id: instructor ? instructor.traineeId : (acc && acc.trainee_id) || null };
  acc = acc ? await one(`app_accounts?id=eq.${acc.id}`, { method: 'PATCH', body }) : await one('app_accounts', { method: 'POST', body });
  return { account: acc, instructor };
}

async function requireAuth(req, body) {
  const sess = verify((body && body.token) || bearer(req)); if (!sess) throw err(401, '로그인이 필요합니다.');
  const acc = await one(`app_accounts?select=*&id=eq.${sess.id}`); if (!acc) throw err(401, '계정을 찾을 수 없습니다.');
  if (acc.status === 'deleted') throw err(403, '삭제된 계정입니다.');
  return acc;
}

module.exports = { issue, check, upsertAccount, sign, verify, requireAuth };
