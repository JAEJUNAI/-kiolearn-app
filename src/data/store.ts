// 앱 상태와 규칙. 06 명세 2장의 상태기계와 6장 정산 계산을 그대로 구현한다.
// 지금은 로컬(AsyncStorage)에서 돌고, LIVE가 되면 각 액션이 api()를 먼저 부르고 결과로 로컬을 갱신하는 식으로 바꾼다.
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as M from './mock';
import { Account, Assignment, Certificate, Course, Eligibility, GiftCode, Instructor, Mission, Mode, Org, Pass, PayMethod, Payout, Product, PRODUCTS, Recipient, Report, Session } from './types';
import { addH, hoursUntil, fmtTime } from '../lib/fmt';

export const RULES = {
  promiseHours: 72, assignHours: 24, changeFreeHours: 24, lateDeduction: 0.5, noShowDeductionFrom2nd: 0.5, noShowWaitMin: 15,
  earlyEndMin: 30, lessonMin: 90, payBase: 35000, payTransport: 5000, payTwo: 10000, payWeekendEve: 5000, payOutside: 5000, payEscort: 5000, payCall: 5000, bonusOver: 20, bonusAmount: 50000, taxRate: 0.033,
  depositDays: 3, reportSendCutoff: 21, reportSendMorning: 8, holdMin: 10, gradeLessons: [0, 10, 40],
};

const uid = (p: string) => `${p}${Math.random().toString(36).slice(2, 8)}`;
const now = () => new Date().toISOString();
const slotHour = (s: 'am' | 'pm' | 'eve') => ({ am: 10, pm: 14, eve: 18 }[s]);

export interface State {
  loggedIn: boolean; account: Account; mode: Mode; instructorId?: string;
  recipients: Recipient[]; passes: Pass[]; assignments: Assignment[]; sessions: Session[]; reports: Report[];
  instructors: Instructor[]; payouts: Payout[]; missions: Mission[]; orgs: Org[]; linkedOrgId?: string; gifts: GiftCode[];
  courses: Course[]; enrollments: { courseId: string; at: string; status: 'paid' | 'completed' }[]; certificates: Certificate[]; eligibility: Eligibility;
  helpLog: { kind: string; at: string }[]; tickets: { kind: string; body: string; at: string }[]; toastMsg?: string;
}
export interface Actions {
  login: (phone: string, certNo?: string) => { ok: boolean; error?: string };
  logout: () => void; setMode: (m: Mode) => void; toast: (t?: string) => void; reset: () => void;
  saveRecipient: (id: string, patch: Partial<Recipient>) => void;
  checkout: (recipientId: string, product: Product, slot1: Pass['slot1'], slot2: Pass['slot2'], method: PayMethod, extras?: string[]) => Pass;
  confirmDeposit: (passId: string) => void; refund: (passId: string, reason: string) => number; extendPromise: (passId: string) => void;
  redeemGift: (code: string, recipientId: string) => { ok: boolean; error?: string; pass?: Pass };
  acceptAssignment: (id: string, slot: 1 | 2) => { ok: boolean; error?: string };
  declineAssignment: (id: string, reason: string) => void;
  confirmCall: (sessionId: string) => void; callFailed: (sessionId: string) => void;
  depart: (sessionId: string) => void; arrive: (sessionId: string, distanceM?: number, reason?: string) => void; startLesson: (sessionId: string) => void;
  noShow: (sessionId: string) => void;
  submitReport: (sessionId: string, r: { checks: Report['checks']; photo?: Report['photo']; memo: string; nextTask: string; flag?: boolean; flagType?: string; flagNote?: string; nextSessionAt?: string; earlyEndMin?: number; earlyEndReason?: string }) => { ok: boolean; amount: number; error?: string };
  finishSession: (sessionId: string) => void; addNote: (reportId: string, body: string) => void;
  readReport: (id: string) => void; rateReport: (id: string, rating: 'good' | 'bad', note?: string) => void;
  reschedule: (sessionId: string, at: string, by: 'family' | 'instructor', healthReason?: boolean) => { deduction: number };
  cancelSession: (sessionId: string, by: 'family' | 'instructor', reason?: string) => { ok: boolean; deduction: number; error?: string };
  updateSettings: (patch: Partial<Instructor['settings']>) => void; updateIntro: (intro: string) => void;
  missionDone: (id: string) => void; help: (kind: '자녀에게 알리기' | '선생님 불러 주세요') => string;
  linkOrg: (code: string, consentIdentify: boolean) => { ok: boolean; org?: Org };
  enroll: (courseId: string) => void; completeCourse: (courseId: string) => void; verifyEligibility: () => void;
  ticket: (kind: string, body: string) => void; setGuardianPay: (recipientId: string, accountId: string, canPay: boolean) => void;
}

const seed = (): State => ({
  loggedIn: false, account: M.account, mode: 'family', instructorId: undefined,
  recipients: M.recipients, passes: M.passes, assignments: M.assignments, sessions: M.sessions, reports: M.reports,
  instructors: M.instructors, payouts: M.payouts, missions: M.missions, orgs: M.orgs, linkedOrgId: 'o1', gifts: M.gifts,
  courses: M.courses, enrollments: [], certificates: [], eligibility: {}, helpLog: [], tickets: [], toastMsg: undefined,
});

/** 06-6 정산 계산 */
export function calcPayout(s: Session, opts: { normal: boolean; earlyEnd?: boolean; noShow?: boolean }): { kind: Payout['kind']; amount: number; note: string; sub?: string }[] {
  const rows: { kind: Payout['kind']; amount: number; note: string; sub?: string }[] = [];
  const name = `${s.seq}회`;
  if (opts.normal) rows.push({ kind: 'session', amount: RULES.payBase, note: name, sub: '리포트 제출' });
  const transport = opts.normal || opts.earlyEnd || (opts.noShow && !!s.confirmedAt);
  if (transport) rows.push({ kind: 'transport', amount: RULES.payTransport, note: '교통비', sub: opts.earlyEnd ? '조기 종료 · 재방문' : opts.noShow ? '만나지 못함 · 전날 통화 기록' : undefined });
  if (opts.normal) {
    if (s.flags?.two) rows.push({ kind: 'extra', amount: RULES.payTwo, note: '두 분 수업' });
    if (s.flags?.weekendEve) rows.push({ kind: 'extra', amount: RULES.payWeekendEve, note: '주말·저녁' });
    if (s.flags?.outside) rows.push({ kind: 'extra', amount: RULES.payOutside, note: '기본 지역 밖' });
    if (s.flags?.escort) rows.push({ kind: 'extra', amount: RULES.payEscort, note: '매장 동행' });
  }
  return rows;
}

/** 05-8 환불 계산 */
export function calcRefund(p: Pass): number {
  const used = p.total - p.remaining;
  if (used <= 0) return p.price;
  const unit = p.product === 'p60' ? 59000 : p.product === 'p120' ? 119000 : 79000;
  return Math.max(0, p.price - Math.round(used * unit));
}

export const useStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      ...seed(),
      login: (phone, certNo) => {
        const st = get();
        const roles = new Set(st.account.roles);
        let instructorId = st.instructorId;
        if (certNo) {
          const ins = st.instructors.find((i) => i.certNo.toUpperCase() === certNo.toUpperCase().trim());
          if (!ins) return { ok: false, error: '자격번호를 찾을 수 없어요. 학습실에서 발급 여부를 확인해 주세요.' };
          roles.add('instructor'); instructorId = ins.id;
        }
        set({ loggedIn: true, instructorId, account: { ...st.account, phone: phone.replace(/\D/g, ''), roles: [...roles] }, mode: certNo ? 'instructor' : st.mode });
        return { ok: true };
      },
      logout: () => set({ loggedIn: false }),
      setMode: (mode) => set({ mode }),
      toast: (toastMsg) => set({ toastMsg }),
      reset: () => set(seed()),
      saveRecipient: (id, patch) => set((s) => ({ recipients: s.recipients.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),

      checkout: (recipientId, product, slot1, slot2, method, extras) => {
        const P = PRODUCTS[product]; const rec = get().recipients.find((r) => r.id === recipientId)!;
        const immediate = method === 'card' || method === 'transfer';
        const paidAt = immediate ? now() : undefined;
        const promiseStart = rec.consultDoneAt && paidAt ? (rec.consultDoneAt > paidAt ? rec.consultDoneAt : paidAt) : paidAt;
        const pass: Pass = {
          id: uid('p'), recipientId, product, total: P.total, remaining: P.total, price: P.price, status: immediate ? 'paid' : 'pending_deposit', method, paidAt,
          promiseDueAt: promiseStart ? addH(promiseStart, RULES.promiseHours) : undefined, validUntil: new Date(Date.now() + P.months * 30 * 86400000).toISOString(),
          slot1, slot2, source: 'pg', extras, noShowCount: 0,
        };
        set((s) => ({ passes: [...s.passes, pass] }));
        if (immediate) get().toast('결제가 완료됐어요. 72시간 안에 첫 일정을 정해 드립니다.');
        return pass;
      },
      confirmDeposit: (passId) => set((s) => ({ passes: s.passes.map((p) => (p.id === passId ? { ...p, status: 'paid', paidAt: now(), promiseDueAt: addH(now(), RULES.promiseHours) } : p)) })),
      extendPromise: (passId) => set((s) => ({ passes: s.passes.map((p) => (p.id === passId ? { ...p, promiseDueAt: addH(p.promiseDueAt ?? now(), RULES.promiseHours), promiseExtended: true } : p)) })),
      refund: (passId, reason) => {
        const p = get().passes.find((x) => x.id === passId)!; const amt = calcRefund(p);
        set((s) => ({
          passes: s.passes.map((x) => (x.id === passId ? { ...x, status: 'refunded' } : x)),
          sessions: s.sessions.map((x) => (x.passId === passId && ['scheduled', 'confirmed'].includes(x.status) ? { ...x, status: 'cancelled', cancelledBy: 'ops' } : x)),
          assignments: s.assignments.map((a) => (a.passId === passId && a.status === 'requested' ? { ...a, status: 'cancelled' } : a)),
          tickets: [...s.tickets, { kind: 'refund', body: `${reason} · ${amt}`, at: now() }],
        }));
        get().toast(`${amt.toLocaleString()}원 환불이 접수됐어요. 5영업일 안에 돌려드립니다.`);
        return amt;
      },
      redeemGift: (code, recipientId) => {
        const g = get().gifts.find((x) => x.code === code.toUpperCase().trim());
        if (!g) return { ok: false, error: '코드를 찾을 수 없어요. 다시 확인해 주세요.' };
        if (g.redeemedAt) return { ok: false, error: '이미 사용된 코드예요.' };
        if (new Date(g.expiresAt) < new Date()) return { ok: false, error: '유효기간이 지난 코드예요.' };
        const P = PRODUCTS[g.product];
        const pass: Pass = { id: uid('p'), recipientId, product: g.product, total: P.total, remaining: P.total, price: P.price, status: 'paid', paidAt: now(), promiseDueAt: addH(now(), RULES.promiseHours), validUntil: new Date(Date.now() + P.months * 30 * 86400000).toISOString(), source: 'gift', noShowCount: 0 };
        set((s) => ({ passes: [...s.passes, pass], gifts: s.gifts.map((x) => (x.code === g.code ? { ...x, redeemedAt: now(), recipientId } : x)) }));
        return { ok: true, pass };
      },

      acceptAssignment: (id, slot) => {
        const st = get(); const a = st.assignments.find((x) => x.id === id);
        if (!a || a.status !== 'requested') return { ok: false, error: '다른 선생님이 맡았습니다.' };
        if (new Date(a.expiresAt) < new Date()) return { ok: false, error: '요청 시간이 지났어요.' };
        const p = st.passes.find((x) => x.id === a.passId)!; const sl = (slot === 1 ? p.slot1 : p.slot2) ?? p.slot1!;
        const when = new Date(sl.date + 'T00:00:00'); when.setHours(slotHour(sl.slot), 0, 0, 0);
        const seq = st.sessions.filter((x) => x.recipientId === a.recipientId && ['done', 'submitted'].includes(x.status)).length + 1;
        const ses: Session = { id: uid('s'), recipientId: a.recipientId, instructorId: a.instructorId, passId: a.passId, seq, scheduledAt: when.toISOString(), topic: a.topic, status: 'scheduled' };
        set((s) => ({
          assignments: s.assignments.map((x) => (x.id === id ? { ...x, status: 'accepted', respondedAt: now() } : x.passId === a.passId && x.status === 'requested' ? { ...x, status: 'cancelled' } : x)),
          sessions: [...s.sessions, ses], passes: s.passes.map((x) => (x.id === a.passId ? { ...x, status: 'active' } : x)),
        }));
        get().toast('수락 완료. 수업 전날 어르신께 전화해 주세요.');
        return { ok: true };
      },
      declineAssignment: (id, reason) => set((s) => ({ assignments: s.assignments.map((x) => (x.id === id ? { ...x, status: 'declined', declineReason: reason, respondedAt: now() } : x)) })),
      confirmCall: (sid) => set((s) => ({ sessions: s.sessions.map((x) => (x.id === sid ? { ...x, status: 'confirmed', confirmedAt: now() } : x)) })),
      callFailed: (sid) => { set((s) => ({ sessions: s.sessions.map((x) => (x.id === sid ? { ...x, callFailedAt: now() } : x)) })); get().toast('보호자에게 "통화가 안 됩니다"를 보냈어요.'); },
      depart: (sid) => { set((s) => ({ sessions: s.sessions.map((x) => (x.id === sid ? { ...x, status: 'departed', departedAt: now() } : x)) })); get().toast('보호자와 어르신께 출발 안내를 보냈어요.'); },
      arrive: (sid, distanceM, reason) => set((s) => ({ sessions: s.sessions.map((x) => (x.id === sid ? { ...x, status: 'arrived', arrivedAt: now(), arriveDistanceM: distanceM, arriveReason: reason } : x)) })),
      startLesson: (sid) => set((s) => ({ sessions: s.sessions.map((x) => (x.id === sid && x.status === 'arrived' ? { ...x, status: 'in_progress', startedAt: now() } : x)) })),
      noShow: (sid) => {
        const st = get(); const ses = st.sessions.find((x) => x.id === sid)!; const p = st.passes.find((x) => x.id === ses.passId)!;
        const ded = p.noShowCount >= 1 ? RULES.noShowDeductionFrom2nd : 0;
        const rows = calcPayout(ses, { normal: false, noShow: true }).map((r) => ({ ...r, id: uid('po'), instructorId: ses.instructorId, sessionId: sid, month: now().slice(0, 7), status: 'confirmed' as const, date: now(), note: `${st.recipients.find((r) => r.id === ses.recipientId)?.name} ${r.note}` }));
        set((s) => ({
          sessions: s.sessions.map((x) => (x.id === sid ? { ...x, status: 'no_show', noShowAt: now(), deduction: ded } : x)),
          passes: s.passes.map((x) => (x.id === p.id ? { ...x, noShowCount: x.noShowCount + 1, remaining: Math.max(0, x.remaining - ded) } : x)),
          payouts: [...s.payouts, ...rows],
        }));
        get().toast(ded ? '회차 절반이 차감됐어요. 보호자에게 알렸습니다.' : '첫 번째라 회차는 차감되지 않아요. 보호자에게 알렸습니다.');
      },
      submitReport: (sid, r) => {
        const st = get(); const ses = st.sessions.find((x) => x.id === sid); if (!ses) return { ok: false, amount: 0, error: 'no session' };
        if (st.reports.some((x) => x.sessionId === sid)) return { ok: false, amount: 0, error: '이미 제출된 리포트예요.' };
        const early = !!r.earlyEndMin && r.earlyEndMin < RULES.earlyEndMin; const normal = !early;
        const rec = st.recipients.find((x) => x.id === ses.recipientId)!;
        const t = new Date(); const late = t.getHours() >= RULES.reportSendCutoff || t.getHours() < RULES.reportSendMorning;
        const sendAt = late ? (() => { const x = new Date(t); if (t.getHours() >= RULES.reportSendCutoff) x.setDate(x.getDate() + 1); x.setHours(RULES.reportSendMorning, 0, 0, 0); return x.toISOString(); })() : now();
        const rep: Report = { id: uid('rp'), sessionId: sid, recipientId: ses.recipientId, instructorId: ses.instructorId, seq: ses.seq, date: ses.scheduledAt, arrivedAt: ses.arrivedAt ?? now(), endedAt: now(), checks: r.checks, photo: r.photo, memo: r.memo, nextTask: r.nextTask, flag: r.flag, flagType: r.flagType, flagNote: r.flagNote, nextSessionAt: r.nextSessionAt, submittedAt: now(), status: r.flag ? 'held' : late ? 'submitted' : 'sent', sentAt: r.flag || late ? undefined : now(), notes: [] };
        const rows = calcPayout({ ...ses, endedAt: now() }, { normal, earlyEnd: early }).map((x) => ({ ...x, id: uid('po'), instructorId: ses.instructorId, sessionId: sid, month: now().slice(0, 7), status: 'confirmed' as const, date: now(), note: `${rec.name} ${rec.honorific} ${x.note}` }));
        const amount = rows.reduce((a, b) => a + b.amount, 0);
        const p = st.passes.find((x) => x.id === ses.passId)!; const remaining = normal ? Math.max(0, p.remaining - 1) : p.remaining;
        const next: Session[] = r.nextSessionAt && remaining > 0 ? [{ id: uid('s'), recipientId: ses.recipientId, instructorId: ses.instructorId, passId: ses.passId, seq: ses.seq + 1, scheduledAt: r.nextSessionAt, topic: '다음 수업', status: 'scheduled' }] : [];
        const mission: Mission[] = r.nextTask ? [{ id: uid('m'), recipientId: ses.recipientId, body: r.nextTask, source: 'report', reportId: rep.id, photo: r.photo, teacher: st.instructors.find((i) => i.id === ses.instructorId)?.name }] : [];
        set((s) => ({
          reports: [...s.reports, rep], payouts: [...s.payouts, ...rows],
          sessions: [...s.sessions.map((x) => (x.id === sid ? { ...x, status: (early ? 'early_end' : 'submitted') as Session['status'], endedAt: now(), earlyEndMin: r.earlyEndMin, earlyEndReason: r.earlyEndReason } : x)), ...next],
          passes: s.passes.map((x) => (x.id === p.id ? { ...x, remaining, status: remaining === 0 ? 'exhausted' : x.status } : x)),
          missions: [...mission, ...s.missions.filter((m) => m.recipientId !== ses.recipientId || m.doneAt)],
        }));
        get().toast(rep.status === 'held' ? '특이사항이 있어 운영자가 10분 먼저 봅니다.' : late ? `리포트는 ${fmtTime(sendAt)}에 보호자에게 갑니다.` : '리포트가 보호자에게 갔어요.');
        return { ok: true, amount };
      },
      finishSession: (sid) => set((s) => ({ sessions: s.sessions.map((x) => (x.id === sid && x.status === 'submitted' ? { ...x, status: 'done' } : x)) })),
      addNote: (rid, body) => set((s) => ({ reports: s.reports.map((r) => (r.id === rid ? { ...r, notes: [...r.notes, { body, at: now() }] } : r)) })),
      readReport: (id) => set((s) => ({ reports: s.reports.map((r) => (r.id === id && !r.readAt ? { ...r, readAt: now(), status: 'read' } : r)) })),
      rateReport: (id, rating, note) => set((s) => ({ reports: s.reports.map((r) => (r.id === id ? { ...r, rating, ratingNote: note } : r)) })),
      reschedule: (sid, at, by, health) => {
        const ses = get().sessions.find((x) => x.id === sid)!;
        const within = hoursUntil(ses.scheduledAt) < RULES.changeFreeHours;
        const ded = by === 'family' && within && !health ? RULES.lateDeduction : 0;
        set((s) => ({
          sessions: s.sessions.map((x) => (x.id === sid ? { ...x, scheduledAt: at, status: 'scheduled', confirmedAt: undefined, deduction: (x.deduction ?? 0) + ded } : x)),
          passes: ded ? s.passes.map((p) => (p.id === ses.passId ? { ...p, remaining: Math.max(0, p.remaining - ded) } : p)) : s.passes,
        }));
        return { deduction: ded };
      },
      cancelSession: (sid, by, reason) => {
        const ses = get().sessions.find((x) => x.id === sid)!;
        const within = hoursUntil(ses.scheduledAt) < RULES.changeFreeHours;
        if (by === 'instructor' && within) return { ok: false, deduction: 0, error: '24시간 안 취소는 운영자에게 전화로만 가능해요.' };
        const ded = by === 'family' && within ? RULES.lateDeduction : 0;
        set((s) => ({
          sessions: s.sessions.map((x) => (x.id === sid ? { ...x, status: 'cancelled', cancelledBy: by, deduction: ded } : x)),
          passes: ded ? s.passes.map((p) => (p.id === ses.passId ? { ...p, remaining: Math.max(0, p.remaining - ded) } : p)) : s.passes,
          tickets: reason ? [...s.tickets, { kind: 'cancel', body: reason, at: now() }] : s.tickets,
        }));
        return { ok: true, deduction: ded };
      },
      updateSettings: (patch) => set((s) => ({ instructors: s.instructors.map((i) => (i.id === s.instructorId ? { ...i, settings: { ...i.settings, ...patch } } : i)) })),
      updateIntro: (intro) => set((s) => ({ instructors: s.instructors.map((i) => (i.id === s.instructorId ? { ...i, intro } : i)) })),
      missionDone: (id) => { set((s) => ({ missions: s.missions.map((m) => (m.id === id ? { ...m, doneAt: now() } : m)) })); get().toast('가족에게 "혼자 해내셨어요"가 갔어요.'); },
      help: (kind) => {
        const st = get(); const rec = st.recipients[0]; const p = st.passes.find((x) => x.recipientId === rec.id && x.status === 'active');
        set((s) => ({ helpLog: [...s.helpLog, { kind, at: now() }] }));
        if (kind === '자녀에게 알리기') return `${rec.guardians[0].name} 님에게 문자가 갔어요.`;
        return p && p.remaining > 0 ? `남은 ${p.remaining}회 중 1회로 운영자가 일정을 잡아 연락드려요.` : `${rec.guardians[0].name} 님에게 결제 요청이 갔어요. 결제되면 일정을 잡아 드립니다.`;
      },
      linkOrg: (code, consent) => {
        const org = get().orgs.find((o) => o.code === code.toUpperCase().trim());
        if (!org) return { ok: false };
        set((s) => ({ linkedOrgId: org.id, recipients: s.recipients.map((r, i) => (i === 0 ? { ...r, orgId: org.id } : r)), tickets: consent ? [...s.tickets, { kind: 'org_consent', body: org.id, at: now() }] : s.tickets }));
        return { ok: true, org };
      },
      enroll: (courseId) => set((s) => ({ enrollments: [...s.enrollments.filter((e) => e.courseId !== courseId), { courseId, at: now(), status: 'paid' }] })),
      completeCourse: (courseId) => {
        const st = get(); const c = st.courses.find((x) => x.id === courseId)!;
        const cert: Certificate = { id: uid('ct'), accountId: st.account.id, courseId, name: st.account.name, course: c.title, issuer: c.provider, issuedAt: now(), certNo: `제2026-${String(Math.floor(Math.random() * 900) + 100)}호` };
        set((s) => ({ enrollments: s.enrollments.map((e) => (e.courseId === courseId ? { ...e, status: 'completed' } : e)), certificates: [...s.certificates, cert] }));
      },
      verifyEligibility: () => set((s) => ({ eligibility: { ...s.eligibility, docsOkAt: s.eligibility.docsOkAt ?? now(), quizOkAt: s.eligibility.quizOkAt ?? now(), eligibleAt: now(), certNo: s.eligibility.certNo ?? 'KL-DC-2026-0588' } })),
      ticket: (kind, body) => set((s) => ({ tickets: [...s.tickets, { kind, body, at: now() }] })),
      setGuardianPay: (rid, aid, canPay) => set((s) => ({ recipients: s.recipients.map((r) => (r.id === rid ? { ...r, guardians: r.guardians.map((g) => (g.accountId === aid ? { ...g, canPay } : g)) } : r)) })),
    }),
    { name: 'kiolearn-app-v3', storage: createJSONStorage(() => AsyncStorage), version: 3, migrate: () => seed() as unknown as State & Actions },
  ),
);

// ---------- 파생값 ----------
export const sel = {
  myRecipient: (s: State) => s.recipients[0],
  activePass: (s: State, rid: string) => s.passes.find((p) => p.recipientId === rid && ['paid', 'active', 'pending_deposit'].includes(p.status)),
  usedCount: (s: State, rid: string) => s.sessions.filter((x) => x.recipientId === rid && ['done', 'submitted'].includes(x.status)).length,
  totalBought: (s: State, rid: string) => s.passes.filter((p) => p.recipientId === rid && !['draft', 'cancelled', 'refunded', 'pending_deposit'].includes(p.status)).reduce((a, p) => a + p.total, 0),
  nextSession: (s: State, rid: string) => s.sessions.filter((x) => x.recipientId === rid && ['scheduled', 'confirmed', 'departed', 'arrived', 'in_progress', 'submitted'].includes(x.status)).sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))[0],
  reportsOf: (s: State, rid: string) => s.reports.filter((r) => r.recipientId === rid).sort((a, b) => b.seq - a.seq),
  me: (s: State) => s.instructors.find((i) => i.id === s.instructorId) ?? s.instructors[0],
  myAssignments: (s: State) => s.assignments.filter((a) => a.instructorId === (s.instructorId ?? 'i1') && a.status === 'requested' && new Date(a.expiresAt) > new Date()),
  mySessions: (s: State) => s.sessions.filter((x) => x.instructorId === (s.instructorId ?? 'i1')),
  grade: (lessons: number) => (lessons >= RULES.gradeLessons[2] ? 3 : lessons >= RULES.gradeLessons[1] ? 2 : 1) as 1 | 2 | 3,
};
