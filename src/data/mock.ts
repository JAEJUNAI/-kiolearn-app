// 개발용 시드. 서버가 붙기 전까지 앱이 이 데이터로 돈다. 날짜는 실행 시각 기준 상대값.
import { Account, Assignment, Course, GiftCode, Instructor, Mission, Org, Pass, Payout, Recipient, Report, Session } from './types';

import { ymd } from '../lib/fmt';
const at = (dayOffset: number, h = 10, m = 0) => { const x = new Date(); x.setDate(x.getDate() + dayOffset); x.setHours(h, m, 0, 0); return x.toISOString(); };
const day = (off: number) => ymd(at(off));
const ago = (hours: number) => new Date(Date.now() - hours * 3600000).toISOString();
const ym = (iso: string) => iso.slice(0, 7);

export const account: Account = { id: 'a1', phone: '01043210000', name: '은희', roles: ['family', 'seeker'], lastMode: 'family', photo: 'teacher3' };

export const recipients: Recipient[] = [
  {
    id: 'r1', type: 'senior', name: '김옥순', honorific: '어머님', honorificTeacher: '선생님', sigungu: '서울 양천구', dong: '목1동', addressDetail: '목동로 00길 00, 101동 1001호',
    deviceBrand: '갤럭시 S21', deviceOs: '안드로이드', pains: ['은행 앱', '키오스크'], opsMemo: '왼쪽 귀가 조금 어두우십니다. 큰 소리보다 천천히, 오른쪽에서 말씀드리면 좋습니다.',
    consultDoneAt: ago(24 * 40), cohabit: false, photoConsent: true, orgId: 'o1',
    guardians: [
      { accountId: 'a1', name: '은희', isPrimary: true, canPay: true, canView: true, relation: '나' },
      { accountId: 'a2', name: '민수', isPrimary: false, canPay: false, canView: true, relation: '동생' },
      { accountId: '', name: '아버님', isPrimary: false, canPay: false, canView: true, smsOnly: true },
    ],
  },
  { id: 'r2', type: 'senior', name: '이정자', honorific: '어머님', honorificTeacher: '선생님', sigungu: '서울 양천구', dong: '신정동', deviceBrand: '갤럭시 A', deviceOs: '안드로이드', pains: ['은행 앱', '키오스크'], opsMemo: '이정자 어머님, 74세. 갤럭시 A 시리즈. 자녀가 지방에 있어 은행 이체를 혼자 하고 싶어 하심. 왼쪽 귀가 어두워 오른쪽에서 말씀드리기. 성격 밝고 질문 많으심. 집에 강아지 1마리(순함). 보호자 요청: 계좌 비밀번호는 절대 묻지 말 것.', consultDoneAt: ago(6), cohabit: true, guardians: [{ accountId: 'a9', name: '정미', isPrimary: true, canPay: true, canView: true }] },
  { id: 'r3', type: 'senior', name: '최영자', honorific: '어머님', honorificTeacher: '도와주러 오는 분', sigungu: '서울 강서구', dong: '염창동', deviceBrand: '아이폰 12', deviceOs: 'iOS', pains: ['사진 보내기'], opsMemo: '아이폰. 따님과 영상통화를 하고 싶어 하심.', consultDoneAt: ago(24 * 10), cohabit: true, guardians: [{ accountId: 'a8', name: '수진', isPrimary: true, canPay: true, canView: true }] },
];

export const instructors: Instructor[] = [
  { id: 'i1', accountId: 'a1', name: '박미선', certNo: 'KL-DC-2026-0417', issuedAt: '2026-03-02', grade: 2, photo: 'teacher', intro: '은행 앱과 키오스크를 천천히, 어르신이 직접 누르실 때까지 기다립니다. 질문은 많을수록 좋아요.', sigungu: '양천구', sinceLabel: '2026년 3월부터',
    stats: { assigned: 24, rebooked: 7, lessons: 38, seniors: 9 }, settings: { enabled: true, dongs: ['목1동', '신정동', '염창동'], weekdays: [2, 4, 5], timeslots: ['am', 'pm'], maxPerWeek: 6 } },
  { id: 'i2', accountId: 'a7', name: '정대호', certNo: 'KL-DC-2026-0102', issuedAt: '2026-03-02', grade: 3, photo: 'teacher2', intro: '아이폰과 갤럭시 둘 다 다룹니다.', sigungu: '강서구', sinceLabel: '2026년 3월부터', stats: { assigned: 41, rebooked: 12, lessons: 60, seniors: 14 }, settings: { enabled: true, dongs: ['염창동', '등촌동'], weekdays: [1, 3, 5], timeslots: ['am'], maxPerWeek: 8 } },
  { id: 'i3', accountId: 'a6', name: '이수경', certNo: 'KL-DC-2026-0588', issuedAt: '2026-10-20', grade: 1, photo: 'teacher3', intro: '', sigungu: '양천구', sinceLabel: '2026년 10월부터', stats: { assigned: 0, rebooked: 0, lessons: 0, seniors: 0 }, settings: { enabled: false, dongs: [], weekdays: [], timeslots: [], maxPerWeek: 6 } },
];

const TOPICS = ['첫 수업 · 폰 정리와 사기 문자 카드', '글자 키우기와 돋보기', '가족 단축번호', '카카오톡 사진 보내기', '영상통화', '사진 정리와 앨범', '지도 앱으로 길 찾기', '키오스크 연습(아카데미)', '병원 예약 전화와 문자', '은행 앱 잔액 보기(모의)', '카카오톡으로 손주 사진 보내기', '키오스크로 음료 주문', '은행 앱 이체 연습(모의)'];
const CHECKS: Record<number, { label: string; first?: boolean }[]> = {
  12: [{ label: '키오스크로 음료 주문', first: true }, { label: '포인트 적립 번호 입력' }, { label: '영수증 사진 찍어 따님께 보내기' }],
  11: [{ label: '손주 사진 고르기' }, { label: '카카오톡으로 보내기', first: true }, { label: '답장 읽고 이모티콘 보내기' }],
};
const PHOTOS: Array<Report['photo']> = ['kiosk', 'lesson', 'fourcut', 'seniorMan', 'cls', 'lesson', 'kiosk', 'fourcut', 'lesson', 'cls', 'kiosk', 'lesson'];

export const passes: Pass[] = [
  { id: 'p1', recipientId: 'r1', product: 'pass10', total: 10, remaining: 0, price: 639000, status: 'exhausted', method: 'card', paidAt: ago(24 * 95), validUntil: at(270), source: 'pg', noShowCount: 0 },
  { id: 'p2', recipientId: 'r1', product: 'pass10', total: 10, remaining: 8, price: 639000, status: 'active', method: 'card', paidAt: ago(24 * 12), validUntil: at(353), source: 'pg', noShowCount: 0, slot1: { date: day(-10), slot: 'pm' } },
  { id: 'p3', recipientId: 'r2', product: 'pass10', total: 10, remaining: 10, price: 639000, status: 'paid', method: 'card', paidAt: ago(5), promiseDueAt: new Date(Date.now() + 67 * 3600000).toISOString(), validUntil: at(365), source: 'pg', noShowCount: 0, slot1: { date: day(6), slot: 'am' }, slot2: { date: day(7), slot: 'am' } },
  { id: 'p4', recipientId: 'r3', product: 'pass3', total: 3, remaining: 2, price: 199000, status: 'active', method: 'transfer', paidAt: ago(24 * 9), validUntil: at(170), source: 'pg', noShowCount: 0 },
];

// 12회 완료(r1), 13회 오늘 14:00 확정, r3 2회차 이번 주 금요일
const todayDow = new Date().getDay();
const fri = ((5 - todayDow) + 7) % 7 || 7;
export const sessions: Session[] = [
  ...Array.from({ length: 12 }, (_, k) => {
    const seq = k + 1; const dayOff = -(12 - seq) * 4 - 2;
    return { id: `s${seq}`, recipientId: 'r1', instructorId: 'i1', passId: seq <= 10 ? 'p1' : 'p2', seq, scheduledAt: at(dayOff, 14), topic: TOPICS[seq - 1], status: 'done' as const, confirmedAt: at(dayOff - 1, 19), departedAt: at(dayOff, 13, 20), arrivedAt: at(dayOff, 14, 2), startedAt: at(dayOff, 14, 3), endedAt: at(dayOff, 15, 31) };
  }),
  { id: 's13', recipientId: 'r1', instructorId: 'i1', passId: 'p2', seq: 13, scheduledAt: at(0, 14), topic: TOPICS[12], status: 'confirmed', confirmedAt: at(-1, 19, 10) },
  { id: 's21', recipientId: 'r3', instructorId: 'i1', passId: 'p4', seq: 2, scheduledAt: at(fri, 10), topic: '영상통화', status: 'scheduled' },
  { id: 's20', recipientId: 'r3', instructorId: 'i1', passId: 'p4', seq: 1, scheduledAt: at(-6, 10), topic: '첫 수업', status: 'early_end', earlyEndMin: 20, earlyEndReason: '어르신 컨디션', arrivedAt: at(-6, 10, 1), endedAt: at(-6, 10, 21), confirmedAt: at(-7, 18) },
];

export const reports: Report[] = sessions.filter((s) => s.recipientId === 'r1' && s.status === 'done').map((s) => ({
  id: `rp${s.seq}`, sessionId: s.id, recipientId: 'r1', instructorId: 'i1', seq: s.seq, date: s.scheduledAt, arrivedAt: s.arrivedAt!, endedAt: s.endedAt!,
  checks: CHECKS[s.seq] ?? [{ label: `${s.topic} 따라 하기` }, { label: '혼자 한 번 더 해 보기', first: s.seq % 3 === 0 }, { label: '다음에 할 것 함께 정하기' }],
  photo: PHOTOS[s.seq - 1],
  memo: s.seq === 12 ? '두 번째는 혼자 끝까지 누르셨어요. 다음엔 동네 카페에 혼자 가 보기로 약속했습니다.' : s.seq === 11 ? '손주 사진을 고르는 데 시간이 걸렸지만 보내기는 혼자 하셨어요.' : '오늘 내용을 어머님이 소리 내어 다시 말씀해 보셨어요.',
  nextTask: s.seq === 12 ? '어머님: 동네 카페에서 혼자 주문 1번 · 가족: 성공하면 전화로 칭찬 한마디' : '오늘 배운 것 한 번 더 해 보기',
  nextSessionAt: s.seq === 12 ? at(0, 14) : undefined, submittedAt: s.endedAt!, status: 'read', sentAt: s.endedAt!, readAt: s.endedAt!, rating: s.seq % 4 === 0 ? undefined : 'good', notes: [],
}));

export const assignments: Assignment[] = [
  { id: 'as1', recipientId: 'r2', passId: 'p3', instructorId: 'i1', status: 'requested', requestedAt: ago(5), expiresAt: new Date(Date.now() + 19 * 3600000).toISOString(), distanceKm: 4.8, topic: '은행 앱 이체 · 키오스크', payout: 40000 },
  { id: 'as2', recipientId: 'r2', passId: 'p3', instructorId: 'i2', status: 'requested', requestedAt: ago(5), expiresAt: new Date(Date.now() + 19 * 3600000).toISOString(), distanceKm: 7.1, topic: '은행 앱 이체 · 키오스크', payout: 40000 },
];

const thisMonth = ym(new Date().toISOString());
export const payouts: Payout[] = [
  ...sessions.filter((s) => s.status === 'done' && ym(s.scheduledAt) === thisMonth).flatMap((s) => [
    { id: `po${s.seq}a`, instructorId: 'i1', sessionId: s.id, month: thisMonth, kind: 'session' as const, amount: 35000, note: `김옥순 어머님 ${s.seq}회`, sub: '리포트 제출', status: 'confirmed' as const, date: s.scheduledAt },
    { id: `po${s.seq}b`, instructorId: 'i1', sessionId: s.id, month: thisMonth, kind: 'transport' as const, amount: 5000, note: '교통비', status: 'confirmed' as const, date: s.scheduledAt },
  ]),
  { id: 'po20', instructorId: 'i1', sessionId: 's20', month: thisMonth, kind: 'transport', amount: 5000, note: '최영자 어머님 1회', sub: '조기 종료 20분 · 재방문', status: 'confirmed', date: at(-6, 10) },
  { id: 'po_call', instructorId: 'i1', month: thisMonth, kind: 'call', amount: 5000, note: '멤버십 점검 통화', sub: '10분', status: 'confirmed', date: at(-9, 11) },
];

export const missions: Mission[] = [{ id: 'm1', recipientId: 'r1', body: '동네 카페에서 혼자 주문 1번', source: 'report', reportId: 'rp12', photo: 'kiosk', teacher: '박미선' }];

export const orgs: Org[] = [
  { id: 'o1', name: '목동종합사회복지관', type: '복지관', code: 'YC-MOK-2026', program: '스마트폰 기초반 · 2026년 하반기', posts: [
    { id: 'op0', title: '11월 스마트폰 기초반', when: '화·목 10:00 · 8회 · 무료', apply: true, phone: '02-0000-0000' },
    { id: 'op1', title: '디지털 돌봄강사 설명회', when: '11월 3일 (월) 14:00', place: '3층 강당', apply: true, phone: '02-0000-0000' },
    { id: 'op2', title: '인생네컷 촬영의 날', when: '11월 12일 (수)', place: '수료생 대상', apply: true, phone: '02-0000-0000' },
    { id: 'op3', title: '키오스크 체험 부스', when: '11월 20일 (목)', place: '1층 로비', apply: false },
  ] },
];

export const gifts: GiftCode[] = [{ code: 'KIO-7F3K-28QD', corp: '○○전자 임직원 복지몰', product: 'pass10', expiresAt: at(300) }];

export const courses: Course[] = [
  { id: 'c1', title: '디지털 돌봄강사 기본 과정', provider: '키오런', direct: true, category: 'teacher', format: '온라인 6모듈', sessions: 6, price: 0, img: 'lesson', curriculum: [{ k: '1모듈', v: '어르신과 말하기' }, { k: '2모듈', v: '스마트폰·키오스크' }, { k: '3모듈', v: '은행 앱 모의·사기 문자' }, { k: '4모듈', v: '리포트 쓰기·앱 사용' }], note: '서류 3종을 올리면 자격번호가 발급됩니다. 실습이나 시범은 없습니다.' },
  { id: 'c2', title: '시니어 스마트폰 지도사', provider: '한빛평생교육원', direct: false, category: 'senior', format: '오프라인 8회', sessions: 8, price: 290000, img: 'cls', place: '강서구 · 토요일 10:00', curriculum: [{ k: '1~2회', v: '어르신 학습 특성 · 말하기' }, { k: '3~5회', v: '스마트폰 · 키오스크 · 은행 앱' }, { k: '6~7회', v: '사기 문자 · 사진 · 영상통화' }, { k: '8회', v: '수업 시연 · 수료' }] },
  { id: 'c3', title: '아동 방문 코딩 교사 입문', provider: '다움에듀', direct: false, category: 'child', format: '온라인 6회', sessions: 6, price: 190000, img: 'kids', curriculum: [{ k: '1~2회', v: '아동 발달과 수업 설계' }, { k: '3~5회', v: '블록 코딩 실습' }, { k: '6회', v: '시연 · 수료' }] },
  { id: 'c4', title: '강사풀 심화 과정 (2027)', provider: '키오런', direct: true, category: 'teacher', format: '교구 + 일감 연결', sessions: 2, price: 390000, img: 'lesson', curriculum: [{ k: '1일', v: '표준 수업 세트 · onn\'ai' }, { k: '2일', v: '기관 수업 진행 · 리포트' }], note: '2027년 1월 1기' },
];
