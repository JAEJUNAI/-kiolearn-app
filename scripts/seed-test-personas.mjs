// 테스트용 강사 페르소나 5명 적재/삭제. 이름 뒤에 "(테스트용 삭제필요)"가 붙는다.
//   node scripts/seed-test-personas.mjs            → 적재 (부평새일센터 IC-BPS-2026 경유)
//   node scripts/seed-test-personas.mjs --delete   → 이 스크립트가 넣은 행 전부 삭제
// 지원서(instructors) → 학습실(teach_trainees/progress/quiz/events) → 자격번호(rpc) → 앱 계정(app_accounts) → 기관 연결(app_org_members)
import fs from 'node:fs';
fs.readFileSync(new URL('../.env', import.meta.url), 'utf8').split(/\r?\n/).forEach((l) => { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim(); });
const url = process.env.EXPO_PUBLIC_SUPABASE_URL.replace(/\/rest\/v1\/?$/, ''), key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', Prefer: 'return=representation' };
async function sb(path, opts = {}) {
  const r = await fetch(`${url}/rest/v1/${path}`, { method: opts.method || 'GET', headers: { ...H, Prefer: opts.prefer || H.Prefer }, body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined });
  const t = await r.text(); if (!r.ok) throw new Error(`${opts.method || 'GET'} ${path} → ${r.status} ${t.slice(0, 300)}`); return t ? JSON.parse(t) : null;
}
const TAG = '(테스트용 삭제필요)', ORG_CODE = 'IC-BPS-2026', ORG_NAME = '부평새일센터';
const daysAgo = (d, h = 10) => new Date(Date.now() - d * 86400e3 + h * 3600e3 - 10 * 3600e3).toISOString();

const P = [
  { name: '박미정', phone: '01099000001', age: 48, quals: '요양보호사', sido: '인천', region: '부평구 부평동·십정동', times: '오전, 오후', exp: '요양원 5년, 어르신 스마트폰 도와드린 경험 많음', stage: 'cert', modules: 6, quiz: [14, 18], docs: { cert: true, idcard: true, crime: true, bank: true }, days: 12 },
  { name: '이수연', phone: '01099000002', age: 42, quals: '사회복지사 2급', sido: '인천', region: '계양구 계산동·작전동', times: '오후, 저녁', exp: '복지관 프로그램 보조 2년', stage: 'cert', modules: 6, quiz: [17], docs: { cert: true, idcard: true, crime: true, bank: false }, days: 9 },
  { name: '김현주', phone: '01099000003', age: 51, quals: '요양보호사, 컴퓨터활용능력 2급', sido: '인천', region: '부평구 삼산동·갈산동', times: '오전', exp: '없음. 가족 어르신 폰 설정은 자주 해 드림', stage: 'course', modules: 4, quiz: [], docs: { cert: true, idcard: false, crime: false, bank: false }, days: 6 },
  { name: '정은혜', phone: '01099000004', age: 37, quals: '보육교사 2급', sido: '인천', region: '부평구 부개동·일신동', times: '오후', exp: '어린이집 7년, 시니어는 처음', stage: 'course', modules: 2, quiz: [], docs: { cert: false, idcard: false, crime: false, bank: false }, days: 3 },
  { name: '최영란', phone: '01099000005', age: 55, quals: '간호조무사', sido: '인천', region: '서구 가정동·석남동', times: '오전, 오후', exp: '병원 10년', stage: 'applied', modules: 0, quiz: [], docs: {}, days: 1 },
];
const fullName = (p) => `${p.name}${TAG}`;
const msg = (p) => [`[보유 자격] ${p.quals}`, `[활동 지역] ${p.sido} · ${p.region}`, `[가능 시간대] ${p.times}`, `[희망 대상] 시니어`, `[강의 경험] ${p.exp}`, `[추천 기관] ${ORG_CODE}`, `[테스트] 페르소나 ${p.age}세 · ${ORG_NAME} 양성과정 수료 예정`].join('\n');

async function del() {
  const tr = await sb(`teach_trainees?select=id&name=like.${encodeURIComponent('%' + TAG)}`);
  for (const t of tr) { await sb(`teach_events?trainee_id=eq.${t.id}`, { method: 'DELETE', prefer: 'return=minimal' }); }
  const n1 = (await sb(`teach_trainees?name=like.${encodeURIComponent('%' + TAG)}`, { method: 'DELETE' })).length; // progress/quiz는 cascade
  const n2 = (await sb(`instructors?name=like.${encodeURIComponent('%' + TAG)}`, { method: 'DELETE' })).length;
  const accs = await sb(`app_accounts?select=id&name=like.${encodeURIComponent('%' + TAG)}`);
  for (const a of accs) await sb(`app_org_members?account_id=eq.${a.id}`, { method: 'DELETE', prefer: 'return=minimal' });
  const n3 = (await sb(`app_accounts?name=like.${encodeURIComponent('%' + TAG)}`, { method: 'DELETE' })).length;
  console.log(`삭제: 학습실 ${n1}, 지원서 ${n2}, 앱 계정 ${n3} (+이벤트·진도·기관연결)`);
}

async function seed() {
  const org = (await sb(`app_orgs?select=id,name,code&code=eq.${ORG_CODE}`))[0]; if (!org) throw new Error('기관 코드 없음: ' + ORG_CODE);
  const dup = await sb(`instructors?select=id&name=like.${encodeURIComponent('%' + TAG)}&limit=1`); if (dup.length) { console.log('이미 적재되어 있음. --delete 뒤 다시 실행.'); return; }
  const out = [];
  for (const p of P) {
    const name = fullName(p);
    const ins = (await sb('instructors', { method: 'POST', body: { type: '디지털 돌봄강사 지원', org: ORG_CODE, name, phone: p.phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3'), email: '', message: msg(p), page: '디지털 돌봄강사 모집', status: p.stage === 'applied' ? '신청' : '학습중', created_at: daysAgo(p.days) } }))[0];
    let line = `${name} ${p.phone} 지원서 ✓`;
    if (p.stage !== 'applied') {
      const t = (await sb('teach_trainees', { method: 'POST', body: { instructor_id: ins.id, phone: p.phone, name, ref_org: `${ORG_NAME} (${ORG_CODE})`, quals: p.quals, region: `${p.sido} · ${p.region}`, status: '과정중', progress_pct: Math.round(p.modules / 6 * 100), quiz_best: Math.max(0, ...p.quiz), quiz_passed: p.quiz.some((s) => s >= 16), docs: { cert: false, idcard: false, bank: false, crime: false, ...p.docs }, memo: '테스트 페르소나 (seed-test-personas.mjs)', last_login_at: daysAgo(0, 9), created_at: daysAgo(p.days - 1) } }))[0];
      await sb('teach_events', { method: 'POST', prefer: 'return=minimal', body: { trainee_id: t.id, event: 'activate', data: { ref_org: t.ref_org, test: true }, created_at: daysAgo(p.days - 1) } });
      const prog = Array.from({ length: p.modules }, (_, i) => ({ trainee_id: t.id, module_code: `M${i + 1}`, started_at: daysAgo(p.days - 1 - i * 0.5), completed_at: daysAgo(p.days - 1.2 - i * 0.5), seconds: 700 + i * 60 }));
      if (prog.length) await sb('teach_progress', { method: 'POST', prefer: 'return=minimal', body: prog });
      if (p.quiz.length) await sb('teach_quiz_attempts', { method: 'POST', prefer: 'return=minimal', body: p.quiz.map((s, i) => ({ trainee_id: t.id, score: s, total: 20, passed: s >= 16, created_at: daysAgo(p.days - 4 - i) })) });
      line += ` · 학습실 ${p.modules}/6`;
      if (p.stage === 'cert') {
        const no = await sb('rpc/teach_next_cert_no', { method: 'POST', body: {} });
        await sb(`teach_trainees?id=eq.${t.id}`, { method: 'PATCH', prefer: 'return=minimal', body: { cert_no: no, cert_issued_at: daysAgo(p.days - 6), status: '자격' } });
        await sb(`instructors?id=eq.${ins.id}`, { method: 'PATCH', prefer: 'return=minimal', body: { status: '자격취득', memo: '디지털 돌봄강사 자격 ' + no + ' (테스트)' } });
        await sb('teach_events', { method: 'POST', prefer: 'return=minimal', body: { trainee_id: t.id, event: 'cert_issued', data: { cert_no: no, test: true } } });
        const acc = (await sb('app_accounts', { method: 'POST', body: { phone: p.phone, name, roles: ['family', 'seeker', 'instructor'], last_mode: 'instructor', trainee_id: t.id, last_login_at: daysAgo(0, 9) } }))[0];
        await sb('app_org_members', { method: 'POST', prefer: 'return=minimal', body: { org_id: org.id, account_id: acc.id, consent_identify: true, linked_at: daysAgo(p.days - 6) } });
        line += ` · 자격 ${no} · 앱 계정 + ${ORG_NAME} 연결`;
      }
    }
    out.push(line); console.log(line);
  }
  if (process.env.SLACK_WEBHOOK_URL) await fetch(process.env.SLACK_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: `🧪 테스트 페르소나 5명 적재 — ${ORG_NAME} (${ORG_CODE})\n` + out.join('\n') + '\n→ 삭제: node scripts/seed-test-personas.mjs --delete' }) }).catch(() => {});
}
(process.argv.includes('--delete') ? del() : seed()).catch((e) => { console.error(e.message); process.exit(1); });
