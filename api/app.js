// POST /api/app  { op, ... }  로그인 필요. 앱의 업무 동작을 서버에 기록한다.
// 1차: 예약 요청(결제 전 상담 큐) → app_tickets + 슬랙. 결제·배정·수업·리포트 op 는 이 파일에 이어서 붙인다.
const auth = require('./_lib/auth');
const { sb, one, err, slack } = require('./_lib/db');

const PRODUCT_NAME = { trial: '첫 체험 1회', p90: '1회', pass3: '3회권', pass5: '5회권', pass10: '10회권', monthly4: '매월 정기 4회' };
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

    // ── 기관 연결 (K1): 기관 코드 조회 → 멤버 등록. 코드는 app_orgs 에 운영자가 발급한다 (예: IC-BPS-2026) ──
    // ── 내 정보·부모님 정보: 온보딩과 "어르신 정보" 화면이 저장, 로그인 직후 불러온다 ──
    if (op === 'profile-get') {
      const links = (await sb(`app_recipient_guardians?select=recipient_id,is_primary,relation&account_id=eq.${acc.id}`)) || [];
      let recipients = [];
      if (links.length) recipients = (await sb(`app_recipients?select=*&id=in.(${links.map((l) => l.recipient_id).join(',')})&order=created_at.asc`)) || [];
      return res.status(200).json({ ok: true, account: { name: acc.name || '' }, recipients: recipients.map((r) => ({ id: r.id, name: r.name || '', honorific: r.honorific || '', sigungu: r.sigungu || '', dong: r.dong || '', addressDetail: r.address_detail || '', deviceBrand: r.device_brand || '', deviceOs: r.device_os || '', pains: r.pains || [], photoConsent: !!r.photo_consent, cohabit: r.cohabit })) });
    }
    if (op === 'profile-save') {
      const clip = (v, n) => String(v == null ? '' : v).trim().slice(0, n);
      if (body.myName !== undefined) await sb(`app_accounts?id=eq.${acc.id}`, { method: 'PATCH', prefer: 'return=minimal', body: { name: clip(body.myName, 30), updated_at: new Date().toISOString() } });
      let rid = null;
      const r = body.recipient;
      if (r && typeof r === 'object') {
        const row = { name: clip(r.name, 30), honorific: clip(r.honorific, 12) || '부모님', sigungu: clip(r.sigungu, 40), dong: clip(r.dong, 30), address_detail: clip(r.addressDetail, 120), device_brand: clip(r.deviceBrand, 30), device_os: clip(r.deviceOs, 20), pains: Array.isArray(r.pains) ? r.pains.slice(0, 10).map((x) => clip(x, 20)) : [], photo_consent: !!r.photoConsent, updated_at: new Date().toISOString() };
        const sid = /^[0-9a-f-]{36}$/i.test(String(r.id || '')) ? r.id : null;
        const mine = sid ? (await sb(`app_recipient_guardians?select=recipient_id&account_id=eq.${acc.id}&recipient_id=eq.${sid}`))[0] : null;
        if (mine) { await sb(`app_recipients?id=eq.${sid}`, { method: 'PATCH', prefer: 'return=minimal', body: row }); rid = sid; }
        else {
          const ins = await one('app_recipients', { method: 'POST', body: { ...row, created_by: acc.id } }); rid = ins.id;
          await sb('app_recipient_guardians', { method: 'POST', prefer: 'return=minimal', body: { recipient_id: rid, account_id: acc.id, is_primary: true, can_pay: true, can_view: true, relation: '나' } });
        }
      }
      return res.status(200).json({ ok: true, recipientId: rid });
    }

    if (op === 'recipient-remove') {
      const rid = String(body.recipientId || ''); if (!/^[0-9a-f-]{36}$/i.test(rid)) throw err(400, 'recipientId');
      await sb(`app_recipient_guardians?account_id=eq.${acc.id}&recipient_id=eq.${rid}`, { method: 'DELETE', prefer: 'return=minimal' });
      const left = (await sb(`app_recipient_guardians?select=account_id&recipient_id=eq.${rid}`)) || [];
      if (!left.length) await sb(`app_recipients?id=eq.${rid}`, { method: 'DELETE', prefer: 'return=minimal' });
      return res.status(200).json({ ok: true });
    }

    // ── 가족 초대: 대표 보호자가 링크를 만들고(14일), 받은 가족이 로그인하면 같은 부모님에 연결 ──
    if (op === 'invite-create') {
      const rid = String(body.recipientId || '');
      if (!/^[0-9a-f-]{36}$/i.test(rid)) throw err(400, '부모님 정보를 먼저 저장해 주세요.');
      const mine = (await sb(`app_recipient_guardians?select=recipient_id&account_id=eq.${acc.id}&recipient_id=eq.${rid}`))[0];
      if (!mine) throw err(403, '이 부모님의 보호자만 초대할 수 있어요.');
      const abc = 'abcdefghjkmnpqrstuvwxyz23456789'; let token = '';
      for (let i = 0; i < 10; i++) token += abc[Math.floor(Math.random() * abc.length)];
      await sb('app_invites', { method: 'POST', prefer: 'return=minimal', body: { token, recipient_id: rid, created_by: acc.id, perms: { can_view: true }, expires_at: new Date(Date.now() + 14 * 864e5).toISOString() } });
      return res.status(200).json({ ok: true, token, url: `https://app.kiolearn.co.kr/i/${token}` });
    }
    if (op === 'invite-accept') {
      const token = String(body.inviteToken || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20);
      const inv = token && (await sb(`app_invites?select=*&token=eq.${token}`))[0];
      if (!inv) throw err(404, '초대 링크를 찾을 수 없어요. 보낸 가족에게 새 링크를 받아 주세요.');
      if (inv.expires_at && new Date(inv.expires_at) < new Date()) throw err(410, '초대 링크 기한(14일)이 지났어요. 보낸 가족에게 새 링크를 받아 주세요.');
      const have = (await sb(`app_recipient_guardians?select=recipient_id&account_id=eq.${acc.id}&recipient_id=eq.${inv.recipient_id}`))[0];
      if (!have) await sb('app_recipient_guardians', { method: 'POST', prefer: 'return=minimal', body: { recipient_id: inv.recipient_id, account_id: acc.id, is_primary: false, can_pay: false, can_view: true, relation: '가족' } });
      if (!inv.used_at) await sb(`app_invites?token=eq.${token}`, { method: 'PATCH', prefer: 'return=minimal', body: { used_at: new Date().toISOString(), used_by: acc.id } });
      const r = (await sb(`app_recipients?select=*&id=eq.${inv.recipient_id}`))[0];
      const from = (await sb(`app_accounts?select=name&id=eq.${inv.created_by}`))[0];
      await slack(`👪 가족 초대 수락 — ${acc.phone} → ${r ? (r.honorific || '') + ' ' + (r.name || '') : inv.recipient_id} (초대: ${from ? from.name || '' : ''})`);
      return res.status(200).json({ ok: true, from: from ? from.name || '' : '', recipient: r ? { id: r.id, name: r.name || '', honorific: r.honorific || '', sigungu: r.sigungu || '', dong: r.dong || '', deviceBrand: r.device_brand || '', pains: r.pains || [] } : null });
    }

    if (op === 'org-lookup' || op === 'org-link') {
      const code = String(body.code || '').toUpperCase().replace(/\s/g, ''); if (code.length < 6) throw err(400, '기관 코드를 입력해 주세요.');
      const org = (await sb(`app_orgs?select=id,name,type,code,programs&code=eq.${encodeURIComponent(code)}`))[0];
      if (!org) throw err(404, '코드를 찾을 수 없어요. 기관에서 받은 코드를 다시 확인해 주세요.');
      const posts = (await sb(`app_org_posts?select=id,title,body,event_at,place,apply_phone&org_id=eq.${org.id}&order=created_at.asc`)) || [];
      const programs = Array.isArray(org.programs) ? org.programs : [];
      const out = {
        id: org.id, name: org.name, type: org.type || '', code: org.code,
        program: programs.map((p) => [p.title, p.period].filter(Boolean).join(' · ')).join(' / ') || undefined,
        posts: posts.map((p) => ({ id: p.id, title: p.title, when: p.body || (p.event_at ? String(p.event_at).slice(0, 10) : ''), place: p.place || undefined, apply: !!p.apply_phone, phone: p.apply_phone || undefined })),
      };
      if (op === 'org-link') {
        const consent = !!body.consent;
        const ex = await sb(`app_org_members?select=id&org_id=eq.${org.id}&account_id=eq.${acc.id}`);
        if (ex && ex[0]) await sb(`app_org_members?id=eq.${ex[0].id}`, { method: 'PATCH', prefer: 'return=minimal', body: { consent_identify: consent, linked_at: new Date().toISOString() } });
        else await one('app_org_members', { method: 'POST', body: { org_id: org.id, account_id: acc.id, consent_identify: consent } });
        await slack(`🏢 기관 연결 — ${org.name} (${org.code}) ← ${acc.name || ''} ${acc.phone}${consent ? ' · 이름·연락처 전달 동의' : ' · 숫자만'}`);
      }
      return res.status(200).json({ ok: true, org: out });
    }

    throw err(400, `알 수 없는 op: ${op}`);
  } catch (e) {
    return res.status(e.status || 500).json({ ok: false, error: e.message === 'SETUP_REQUIRED' ? '앱 데이터베이스가 아직 준비되지 않았습니다.' : e.message });
  }
};
