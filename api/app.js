// POST /api/app  { op, ... }  로그인 필요. 앱의 업무 동작을 서버에 기록한다.
// 1차: 예약 요청(결제 전 상담 큐) → app_tickets + 슬랙. 결제·배정·수업·리포트 op 는 이 파일에 이어서 붙인다.
const auth = require('./_lib/auth');
const { sb, one, err, slack } = require('./_lib/db');

const PRODUCT_NAME = { p60: '60분 1회', p90: '90분 1회', p120: '120분 두 분', pass3: '3회권', pass5: '5회권', pass10: '10회권', pass20: '20회권', pass30: '30회권', monthly4: '매월 정기 4회', monthly8: '매월 정기 8회', member: '멤버십' };
const SLOT = { am: '오전', pm: '오후', eve: '저녁' };

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store'); res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); return res.status(204).end(); }
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' });
  let body = req.body; if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } } body = body || {};
  const op = String(body.op || '');
  try {
    const acc = await auth.requireAuth(req, body);

    // ── 예약 요청: 결제 전. 운영자가 전화로 상담하고 결제 링크를 보낸다 (07 매뉴얼 3장) ──
    if (op === 'booking-request') {
      const r = body.recipient || {}; const product = String(body.product || ''); if (!PRODUCT_NAME[product]) throw err(400, '상품을 골라 주세요.');
      const s1 = body.slot1 || {}; const s2 = body.slot2 || null;
      const summary = {
        who: `${r.honorific || ''} ${r.name || ''}`.trim(), where: `${r.sigungu || ''} ${r.dong || ''}`.trim(), detail: r.addressDetail || '', device: r.deviceBrand || '', pains: Array.isArray(r.pains) ? r.pains.join(', ') : '',
        product: PRODUCT_NAME[product], slot1: s1.date ? `${s1.date} ${SLOT[s1.slot] || ''}` : '', slot2: s2 && s2.date ? `${s2.date} ${SLOT[s2.slot] || ''}` : '', extras: Array.isArray(body.extras) ? body.extras.join(', ') : '',
        guardian: `${acc.name || ''} ${acc.phone}`.trim(), source: body.source || 'app',
      };
      const row = await one('app_tickets', { method: 'POST', body: { kind: 'booking', ref: product, body: JSON.stringify(summary), created_by: acc.id } });
      await slack(`📞 앱 예약 요청 — ${summary.guardian}\n대상: ${summary.who} · ${summary.where}${summary.detail ? ' ' + summary.detail : ''}\n기기: ${summary.device || '-'} · 불편: ${summary.pains || '-'}\n상품: ${summary.product} · 희망 ${summary.slot1}${summary.slot2 ? ' / ' + summary.slot2 : ''}${summary.extras ? ' · 추가 ' + summary.extras : ''}\n→ 상담 전화 뒤 결제 링크 발송 (운영매뉴얼 3장)`);
      return res.status(200).json({ ok: true, ticketId: row && row.id });
    }

    if (op === 'booking-cancel') {
      if (body.ticketId) await sb(`app_tickets?id=eq.${encodeURIComponent(body.ticketId)}&created_by=eq.${acc.id}`, { method: 'PATCH', prefer: 'return=minimal', body: { status: 'cancelled', resolved_at: new Date().toISOString() } });
      await slack(`↩️ 앱 예약 요청 취소 — ${acc.name || ''} ${acc.phone}`);
      return res.status(200).json({ ok: true });
    }

    // ── 기타 문의 티켓(강사 변경, 정산 문의, 도움 요청 등) ──
    if (op === 'ticket') {
      const kind = String(body.kind || 'other').slice(0, 30); const text = String(body.body || '').slice(0, 1000);
      const row = await one('app_tickets', { method: 'POST', body: { kind, ref: String(body.ref || '').slice(0, 60), body: text, created_by: acc.id } });
      await slack(`🎫 앱 티켓 [${kind}] — ${acc.name || ''} ${acc.phone}\n${text}`);
      return res.status(200).json({ ok: true, ticketId: row && row.id });
    }

    throw err(400, `알 수 없는 op: ${op}`);
  } catch (e) {
    return res.status(e.status || 500).json({ ok: false, error: e.message === 'SETUP_REQUIRED' ? '앱 데이터베이스가 아직 준비되지 않았습니다.' : e.message });
  }
};
