// 솔라피(SOLAPI) 문자 발송. IP 등록 없이 API 키 + 시크릿으로 HMAC 서명. 키가 없으면 보내지 않고 false 를 돌려준다(개발 모드).
const crypto = require('crypto');

const E = (k) => String(process.env[k] || '').trim();
function configured() { return !!(E('SOLAPI_KEY') && E('SOLAPI_SECRET') && E('SOLAPI_SENDER')); }

async function send(to, text) {
  if (!configured()) return { ok: false, dev: true };
  const date = new Date().toISOString(); const salt = crypto.randomBytes(16).toString('hex');
  const signature = crypto.createHmac('sha256', E('SOLAPI_SECRET')).update(date + salt).digest('hex');
  const r = await fetch('https://api.solapi.com/messages/v4/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `HMAC-SHA256 apiKey=${E('SOLAPI_KEY')}, date=${date}, salt=${salt}, signature=${signature}` },
    body: JSON.stringify({ message: { to: String(to).replace(/\D/g, ''), from: E('SOLAPI_SENDER').replace(/\D/g, ''), text } }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) return { ok: false, error: j.errorMessage || j.message || `HTTP ${r.status}` };
  // 오류 메시지에 키가 섞이지 않게 여기서만 돌려준다
  return { ok: true, id: j.groupId || j.messageId || '' };
}

module.exports = { send, configured };
