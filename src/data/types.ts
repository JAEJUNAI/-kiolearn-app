// 06 기능 명세 7장 데이터 모델의 앱 쪽 타입. 서버 테이블과 열 이름을 맞춘다.
export type Role = 'family' | 'senior' | 'instructor' | 'seeker' | 'org_staff' | 'corp_staff';
export type Mode = 'family' | 'senior' | 'instructor';
export type ImgKey = 'teacher' | 'teacher2' | 'teacher3' | 'lesson' | 'kiosk' | 'cls' | 'seniorMan' | 'kids' | 'fourcut';

export interface Account { id: string; phone: string; name: string; roles: Role[]; lastMode: Mode; photo?: ImgKey }

export interface Recipient {
  id: string; type: 'senior' | 'child'; name: string; honorific: string; honorificTeacher: '선생님' | '도와주러 오는 분';
  sigungu: string; dong: string; addressDetail?: string; deviceBrand?: string; deviceOs?: string; pains: string[];
  opsMemo?: string; consultDoneAt?: string; cohabit?: boolean; photoConsent?: boolean; linkedAccountId?: string; orgId?: string;
  guardians: { accountId: string; name: string; isPrimary: boolean; canPay: boolean; canView: boolean; smsOnly?: boolean; relation?: string }[];
}

export type Product = 'p60' | 'p90' | 'p120' | 'pass3' | 'pass5' | 'pass10' | 'pass20' | 'pass30' | 'monthly4' | 'monthly8' | 'member';
export const PRODUCTS: Record<Product, { name: string; price: number; total: number; sub: string; months: number; per?: number }> = {
  p60: { name: '60분 1회', price: 59000, total: 1, sub: '60분 × 1회', months: 3 },
  p90: { name: '90분 1회', price: 79000, total: 1, sub: '90분 × 1회', months: 3 },
  p120: { name: '120분 두 분', price: 119000, total: 1, sub: '두 분 함께 × 1회', months: 3 },
  pass3: { name: '3회권', price: 199000, total: 3, sub: '90분 × 3회 · 같은 강사가 끝까지', months: 6, per: 66333 },
  pass5: { name: '5회권', price: 329000, total: 5, sub: '90분 × 5회', months: 6, per: 65800 },
  pass10: { name: '10회권', price: 639000, total: 10, sub: '12개월 · 수료증과 액자 포함', months: 12, per: 63900 },
  pass20: { name: '20회권', price: 1230000, total: 20, sub: '18개월 · 10회권 혜택 동일', months: 18, per: 61500 },
  pass30: { name: '30회권', price: 1770000, total: 30, sub: '24개월 · 10회권 혜택 동일', months: 24, per: 59000 },
  monthly4: { name: '매월 정기 4회', price: 259000, total: 4, sub: '매월 선결제 · 두 달째부터 수료증', months: 1, per: 64750 },
  monthly8: { name: '매월 정기 8회', price: 499000, total: 8, sub: '매월 선결제', months: 1, per: 62375 },
  member: { name: '멤버십', price: 29000, total: 0, sub: '첫 방문 90분 + 월 2회 전화 점검', months: 1 },
};
export type PayMethod = 'card' | 'transfer' | 'vaccount' | 'manual';
export type PassStatus = 'draft' | 'requested' | 'pending_deposit' | 'paid' | 'active' | 'exhausted' | 'expired' | 'refunded' | 'cancelled';
export interface Pass {
  id: string; recipientId: string; product: Product; total: number; remaining: number; price: number; status: PassStatus;
  method?: PayMethod; paidAt?: string; promiseDueAt?: string; promiseExtended?: boolean; validUntil?: string;
  slot1?: { date: string; slot: 'am' | 'pm' | 'eve' }; slot2?: { date: string; slot: 'am' | 'pm' | 'eve' }; source: 'pg' | 'gift' | 'org'; extras?: string[]; ticketId?: string;
  noShowCount: number;
}

export type AssignStatus = 'requested' | 'accepted' | 'declined' | 'expired' | 'cancelled' | 'manual';
export interface Assignment {
  id: string; recipientId: string; passId: string; instructorId: string; status: AssignStatus; requestedAt: string; expiresAt: string;
  respondedAt?: string; declineReason?: string; distanceKm: number; topic: string; payout: number;
}

export type SessionStatus = 'scheduled' | 'confirmed' | 'departed' | 'arrived' | 'in_progress' | 'submitted' | 'done' | 'no_show' | 'early_end' | 'cancelled';
export interface Session {
  id: string; recipientId: string; instructorId: string; passId: string; seq: number; scheduledAt: string; topic: string; status: SessionStatus;
  confirmedAt?: string; callFailedAt?: string; departedAt?: string; arrivedAt?: string; arriveDistanceM?: number; arriveReason?: string;
  startedAt?: string; endedAt?: string; earlyEndMin?: number; earlyEndReason?: string; noShowAt?: string; cancelledBy?: 'family' | 'instructor' | 'ops'; deduction?: number;
  flags?: { two?: boolean; weekendEve?: boolean; outside?: boolean; escort?: boolean };
}

export interface Report {
  id: string; sessionId: string; recipientId: string; instructorId: string; seq: number; date: string; arrivedAt: string; endedAt: string;
  checks: { label: string; first?: boolean }[]; photo?: ImgKey; memo: string; nextTask: string; flag?: boolean; flagType?: string; flagNote?: string;
  nextSessionAt?: string; submittedAt: string; status: 'submitted' | 'held' | 'sent' | 'read'; sentAt?: string; readAt?: string; rating?: 'good' | 'bad'; ratingNote?: string; notes: { body: string; at: string }[];
}

export interface Instructor {
  id: string; accountId: string; name: string; certNo: string; issuedAt: string; grade: 1 | 2 | 3; photo: ImgKey; intro: string; sigungu: string; sinceLabel: string;
  stats: { assigned: number; rebooked: number; lessons: number; seniors: number };
  settings: { enabled: boolean; dongs: string[]; weekdays: number[]; timeslots: ('am' | 'pm' | 'eve')[]; maxPerWeek: number };
}
export type PayoutKind = 'session' | 'transport' | 'extra' | 'call' | 'bonus' | 'adjustment';
export interface Payout { id: string; instructorId: string; sessionId?: string; month: string; kind: PayoutKind; amount: number; note: string; sub?: string; status: 'confirmed' | 'closed' | 'paid'; date: string }

export interface Mission { id: string; recipientId: string; body: string; source: 'report' | 'ops'; reportId?: string; photo?: ImgKey; teacher?: string; doneAt?: string }
export interface Org { id: string; name: string; type: string; code: string; program?: string; posts: { id: string; title: string; when: string; place?: string; apply: boolean; phone?: string }[] }
export interface GiftCode { code: string; corp: string; product: Product; expiresAt: string; redeemedAt?: string; recipientId?: string }
export interface Course { id: string; title: string; provider: string; direct: boolean; category: 'senior' | 'child' | 'teacher'; format: string; sessions: number; price: number; img: ImgKey; curriculum: { k: string; v: string }[]; place?: string; note?: string }
export interface Certificate { id: string; accountId: string; courseId: string; name: string; course: string; issuer: string; issuedAt: string; certNo: string }
export interface Eligibility { docsOkAt?: string; quizOkAt?: string; eligibleAt?: string; certNo?: string }
