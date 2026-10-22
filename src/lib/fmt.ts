const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
export const d = (s: string | Date) => (typeof s === 'string' ? new Date(s) : s);
export const pad = (n: number) => String(n).padStart(2, '0');

/** "10월 23일 (목) 14:00" */
export function fmtDT(s: string | Date, withTime = true) {
  const x = d(s);
  const base = `${x.getMonth() + 1}월 ${x.getDate()}일 (${DAYS[x.getDay()]})`;
  return withTime ? `${base} ${pad(x.getHours())}:${pad(x.getMinutes())}` : base;
}
/** 현지 날짜 키 yyyy-mm-dd (UTC로 자르면 하루 밀린다) */
export const ymd = (s: string | Date) => { const x = d(s); return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`; };
export const fmtTime = (s: string | Date) => { const x = d(s); return `${pad(x.getHours())}:${pad(x.getMinutes())}`; };
export const fmtMD = (s: string | Date) => { const x = d(s); return `${x.getMonth() + 1}/${x.getDate()}`; };
export const fmtYM = (s: string | Date) => { const x = d(s); return `${x.getFullYear()}.${pad(x.getMonth() + 1)}`; };
export const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;
export const num = (n: number) => n.toLocaleString('ko-KR');

/** 남은 시간 "51시간 20분" / "19:12:40" */
export function remain(until: string | Date, style: 'hm' | 'hms' = 'hm') {
  const ms = d(until).getTime() - Date.now();
  if (ms <= 0) return style === 'hm' ? '지남' : '00:00:00';
  const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), s = Math.floor((ms % 60000) / 1000);
  return style === 'hm' ? `${h}시간 ${m}분` : `${pad(h)}:${pad(m)}:${pad(s)}`;
}
export const hoursUntil = (until: string | Date) => (d(until).getTime() - Date.now()) / 3600000;
export const addH = (s: string | Date, h: number) => new Date(d(s).getTime() + h * 3600000).toISOString();
export const slotLabel = (slot: 'am' | 'pm' | 'eve') => ({ am: '오전', pm: '오후', eve: '저녁' }[slot]);
export const weekOf = (base: Date) => { const x = new Date(base); const day = (x.getDay() + 6) % 7; x.setDate(x.getDate() - day); x.setHours(0, 0, 0, 0); return x; };
