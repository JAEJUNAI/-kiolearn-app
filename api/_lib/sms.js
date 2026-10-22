// 솔라피(SOLAPI) 문자 발송. IP 등록 없이 API 키 + 시크릿으로 HMAC 서명. 키가 없으면 보내지 않고 false 를 돌려준다(개발 모드).
const crypto = require('crypto');

function configured() { return !!(process.env.SOLAPI_KEY && process.env.SOLAPI_SECRET && process.env.SOLAPI_SENDER); }

async function send(to, text) {
  if (!configured()) return { ok: false, dev: true };
  const date = new Date().toISOString(); const salt = crypto.randomBytes(16).toString('hex');
  const signature = crypto.createHmac('sha256', process.env.SOLAPI_SECRET).update(date + salt).digest('hex');
  const r = await fetch('https://api.solapi.com/messages/v4/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `HMAC-SHA256 apiKey=${process.env.SOLAPI_KEY}, date=${date}, salt=${salt}, signature=${signature}` },
    body: JSON.stringify({ message: { to: String(to).replace(/\D/g, ''), from: String(process.env.SOLAPI_SENDER).replace(/\D/g, ''), text } }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) return { ok: false, error: j.errorMessage || j.message || `HTTP ${r.status}` };
  return { ok: true, id: j.groupId || j.messageId || '' };
}

module.exports = { send, configured };
