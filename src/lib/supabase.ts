// 서버(app.kiolearn.co.kr/api) 호출. 인증은 전화번호 OTP → 서버가 서명한 토큰.
// Supabase 클라이언트는 아직 앱에서 직접 쓰지 않는다(테이블은 RLS로 잠겨 있고 서버만 접근). 나중에 직접 읽기 정책을 열 때 쓴다.
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
export const API_BASE = (process.env.EXPO_PUBLIC_API_BASE || 'https://app.kiolearn.co.kr/api').replace(/\/$/, '');

export const supabase: SupabaseClient | null = url && key
  ? createClient(url, key, { auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false } })
  : null;

const TOKEN_KEY = 'kio_app_token';
export async function getToken() { try { return (await AsyncStorage.getItem(TOKEN_KEY)) || ''; } catch { return ''; } }
export async function setToken(t: string) { try { if (t) await AsyncStorage.setItem(TOKEN_KEY, t); else await AsyncStorage.removeItem(TOKEN_KEY); } catch {} }

export interface ApiResult<T = Record<string, unknown>> { ok: boolean; error?: string; dev?: boolean; data?: T; [k: string]: unknown }

/** 서버 API 호출. path 는 'auth' | 'app' 처럼 함수 이름, body.op 로 동작을 고른다. */
export async function api<T = Record<string, unknown>>(path: string, body: Record<string, unknown>): Promise<ApiResult<T>> {
  try {
    const token = await getToken();
    const res = await fetch(`${API_BASE}/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' }, body: JSON.stringify({ ...body, token }) });
    const j = (await res.json().catch(() => ({}))) as ApiResult<T>;
    if (!res.ok && !j.error) j.error = `서버 오류 (${res.status})`;
    return j;
  } catch (e) {
    return { ok: false, error: '서버에 연결하지 못했어요. 네트워크를 확인해 주세요.' };
  }
}

export const sendOtp = (phone: string) => api('auth', { op: 'otp-send', phone });
export interface VerifyOut { token: string; account: { id: string; phone: string; name: string; roles: string[]; lastMode: string; traineeId: string | null }; instructor: { traineeId: string; name: string; certNo: string } | null }
export async function verifyOtp(phone: string, code: string, certNo?: string, name?: string) {
  const r = await api<VerifyOut>('auth', { op: 'otp-verify', phone, code, cert_no: certNo || undefined, name: name || undefined });
  if (r.ok && typeof r.token === 'string') await setToken(r.token);
  return r as ApiResult<VerifyOut> & Partial<VerifyOut>;
}
export const toE164 = (p: string) => '+82' + p.replace(/\D/g, '').replace(/^0/, '');
