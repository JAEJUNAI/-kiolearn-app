// 내 정보·부모님 정보를 서버와 맞춘다. 심사 계정(샘플 데이터)에서는 아무것도 보내지 않는다.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from '../data/store';
import { Recipient } from '../data/types';
import { api, ApiResult } from './supabase';

const UUID = /^[0-9a-f-]{36}$/i;
const INVITE_KEY = 'kiolearn-pending-invite';

/** 로그인 직후: 서버에 저장된 이름과 부모님 정보를 불러온다. 없으면 그대로(온보딩으로). */
export async function pullProfile() {
  const s = useStore.getState(); if (s.demo !== false) return;
  const out = (await api('app', { op: 'profile-get' })) as ApiResult & { account?: { name: string }; recipients?: Partial<Recipient>[] };
  if (!out.ok) return;
  s.applyServerProfile({ name: out.account?.name || undefined, recipients: (out.recipients || []).map((r) => ({ ...r, serverId: r.id })) });
}

/** 저장: 내 이름과 첫 번째 부모님. 서버 id를 받아 두면 다음 저장은 같은 줄을 고친다. */
export async function pushProfile(opts: { myName?: string } = {}) {
  const s = useStore.getState(); if (s.demo !== false) return { ok: true };
  const rec = s.recipients[0];
  const out = (await api('app', { op: 'profile-save', myName: opts.myName, recipient: rec ? { ...rec, id: rec.serverId ?? (UUID.test(rec.id) ? rec.id : undefined) } : undefined })) as ApiResult & { recipientId?: string | null };
  if (out.ok && out.recipientId && rec && rec.serverId !== out.recipientId) s.saveRecipient(rec.id, { serverId: out.recipientId });
  return out;
}

/** 가족 초대 링크 만들기. 부모님 정보가 서버에 없으면 먼저 저장한다. */
export async function createInvite(): Promise<{ ok: boolean; url?: string; error?: string }> {
  const s = useStore.getState();
  if (s.demo !== false) return { ok: true, url: 'https://app.kiolearn.co.kr/i/sample' };
  let rec = s.recipients[0];
  if (!rec?.serverId) { await pushProfile(); rec = useStore.getState().recipients[0]; }
  if (!rec?.serverId) return { ok: false, error: '부모님 정보를 저장하지 못했어요. 네트워크를 확인해 주세요.' };
  const out = (await api('app', { op: 'invite-create', recipientId: rec.serverId })) as ApiResult & { url?: string };
  return out.ok ? { ok: true, url: out.url } : { ok: false, error: out.error };
}

/** /i/<토큰> 으로 들어왔을 때 로그인 전까지 기억해 둔다. */
export const savePendingInvite = (token: string) => AsyncStorage.setItem(INVITE_KEY, token).catch(() => {});
/** 로그인 뒤 기억해 둔 초대를 수락한다. 결과 문구를 돌려준다(없으면 undefined). */
export async function acceptPendingInvite(): Promise<string | undefined> {
  const token = await AsyncStorage.getItem(INVITE_KEY).catch(() => null); if (!token) return;
  await AsyncStorage.removeItem(INVITE_KEY).catch(() => {});
  const s = useStore.getState(); if (s.demo !== false) return;
  const out = (await api('app', { op: 'invite-accept', inviteToken: token })) as ApiResult & { from?: string; recipient?: Partial<Recipient> | null };
  if (!out.ok || !out.recipient) return out.error || '초대 링크를 확인하지 못했어요.';
  const r = out.recipient; const st = useStore.getState();
  const first = st.recipients[0]; const empty = first && !first.name && !first.serverId;
  const guardian = { accountId: st.account.id, name: st.account.name || '나', isPrimary: false, canPay: false, canView: true, relation: '가족' };
  const linked: Recipient = { id: r.id!, serverId: r.id, type: 'senior', name: r.name || '', honorific: r.honorific || '부모님', honorificTeacher: '선생님', sigungu: r.sigungu || '', dong: r.dong || '', deviceBrand: r.deviceBrand, pains: r.pains || [], guardians: [guardian] };
  useStore.setState({ recipients: empty ? [linked, ...st.recipients.slice(1)] : [...st.recipients.filter((x) => x.serverId !== r.id), linked], onboarded: true });
  return `${out.from ? out.from + ' 님이 보낸 ' : ''}초대로 ${linked.honorific}${linked.name ? `(${linked.name})` : ''} 소식을 같이 받습니다.`;
}
