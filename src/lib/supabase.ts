// Supabase 클라이언트. EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY 가 있을 때만 켜지고,
// 없으면 앱은 로컬 저장소(mock)로 돈다. 출시 전 .env 에 넣는다.
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
export const API_BASE = process.env.EXPO_PUBLIC_API_BASE || 'https://app.kiolearn.co.kr/api';

export const supabase: SupabaseClient | null = url && key
  ? createClient(url, key, { auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false } })
  : null;

export const LIVE = !!supabase;

/** 전화번호 OTP. LIVE가 아니면 어떤 6자리든 통과(개발용). */
export async function sendOtp(phone: string) {
  if (!supabase) return { ok: true, dev: true };
  const { error } = await supabase.auth.signInWithOtp({ phone: toE164(phone) });
  return { ok: !error, error: error?.message };
}
export async function verifyOtp(phone: string, token: string) {
  if (!supabase) return { ok: /^\d{6}$/.test(token) };
  const { error } = await supabase.auth.verifyOtp({ phone: toE164(phone), token, type: 'sms' });
  return { ok: !error, error: error?.message };
}
export const toE164 = (p: string) => '+82' + p.replace(/\D/g, '').replace(/^0/, '');

/** 규칙이 있는 쓰기는 서버 API로. LIVE가 아니면 호출하지 않는다. */
export async function api<T = unknown>(path: string, body?: unknown): Promise<{ ok: boolean; data?: T; code?: string; message?: string }> {
  if (!supabase) return { ok: false, code: 'offline_dev' };
  const { data: s } = await supabase.auth.getSession();
  const res = await fetch(`${API_BASE}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s.session?.access_token ?? ''}` }, body: JSON.stringify(body ?? {}) });
  return res.json();
}
