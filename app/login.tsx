// G1 시작·인증 + T1 강사 로그인.
// 1단계: 누구신지 고르기(가족 / 본인 / 강사) → 2단계: 전화번호 → 문자 인증번호 (강사는 처음 한 번 자격번호).
import React, { useEffect, useState } from 'react';
import { View, Pressable, Linking } from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Screen, T, Btn, Input, Box, Chip, Row, Grow } from '../src/ui';
import { useStore } from '../src/data/store';
import { sendOtp, verifyOtp } from '../src/lib/supabase';
import { pullProfile, acceptPendingInvite } from '../src/lib/profile';
import { C, F, IMG, R } from '../src/theme';

type Role = 'family' | 'self' | 'instructor';
const ROLES: { k: Role; img: keyof typeof IMG; title: string; sub: string }[] = [
  { k: 'family', img: 'loginFamily', title: '부모님 수업을 맡기려는 가족', sub: '예약하고, 수업이 끝나면 사진과 결과를 받아요' },
  { k: 'self', img: 'loginSelf', title: '제가 직접 배우고 싶어요', sub: '내 휴대폰을 집에서 1:1로 배워요' },
  { k: 'instructor', img: 'loginTeacher', title: '강사로 일해요', sub: '자격번호로 들어가 배정과 수업을 관리해요' },
];
const COPY: Record<Role, { img: keyof typeof IMG; ttl: string; sub: string }> = {
  family: { img: 'loginFamily', ttl: '가족으로 시작합니다', sub: '부모님 정보와 예약, 수업 결과를 이 번호로 받습니다' },
  self: { img: 'loginSelf', ttl: '반갑습니다.\n전화번호만 넣어 주세요', sub: '비밀번호는 없습니다. 문자로 온 숫자 6자리만 넣으면 됩니다' },
  instructor: { img: 'loginTeacher', ttl: '강사로 들어갑니다', sub: '처음 한 번만 학습실에서 받은 자격번호를 넣어 주세요' },
};
const fmtPhone = (v: string) => { const d = v.replace(/\D/g, '').slice(0, 11); return d.length > 7 ? `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}` : d.length > 3 ? `${d.slice(0, 3)}-${d.slice(3)}` : d; };

export default function Login() {
  const r = useRouter(); const { invite, as } = useLocalSearchParams<{ invite?: string; as?: string }>();
  const loginServer = useStore((s) => s.loginServer);
  const [role, setRole] = useState<Role | null>(as === 'instructor' ? 'instructor' : invite ? 'family' : null);
  const [dev, setDev] = useState(false);
  const [phone, setPhone] = useState(''); const [otp, setOtp] = useState(''); const [cert, setCert] = useState(''); const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [err, setErr] = useState<string | undefined>(); const [busy, setBusy] = useState(false); const [needCert, setNeedCert] = useState(false);
  const [sentAt, setSentAt] = useState<number | null>(null); const [now, setNow] = useState(Date.now());
  useEffect(() => { if (!sentAt) return; const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, [sentAt]);
  const elapsed = sentAt ? Math.floor((now - sentAt) / 1000) : 0; const left = Math.max(0, 180 - elapsed); const canResend = !sentAt || elapsed >= 60;
  const mmss = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  const digits = phone.replace(/\D/g, '');

  const send = async () => {
    setErr(undefined); setBusy(true); const res = await sendOtp(digits); setBusy(false);
    if (!res.ok) { if (/60초/.test(res.error ?? '')) { setSentAt(Date.now() - 1000); } return setErr(res.error ?? '문자를 보내지 못했어요.'); }
    setDev(!!res.dev); setOtp(''); setSentAt(Date.now()); setStep('otp');
  };
  const verify = async () => {
    const asIns = role === 'instructor';
    setErr(undefined); setBusy(true); const res = await verifyOtp(digits, otp, asIns && cert.length >= 10 ? cert : undefined); setBusy(false);
    if (!res.ok || !res.account) { if (/만료|먼저 받아/.test(res.error ?? '')) setSentAt(Date.now() - 61000); return setErr(res.error ?? '번호가 맞지 않아요. 다시 확인해 주세요.'); }
    if (asIns && !res.instructor) { setNeedCert(true); return setErr(cert ? '자격번호를 확인해 주세요.' : '처음 강사로 들어오실 때는 자격번호가 필요해요. 한 번 확인되면 다음부터는 묻지 않습니다.'); }
    loginServer({ phone: digits, name: res.account.name, roles: res.account.roles, instructor: res.instructor ?? null });
    // 서버에 저장된 내 정보 → 기억해 둔 가족 초대 → 처음이면 온보딩
    await pullProfile().catch(() => {});
    const msg = await acceptPendingInvite().catch(() => undefined);
    const st = useStore.getState(); if (msg) st.toast(msg);
    if (!st.onboarded && st.mode === 'family') return r.replace({ pathname: '/onboarding', params: role === 'self' ? { self: '1' } : {} });
    r.replace('/');
  };

  // ── 1단계: 누구신가요 ──
  if (!role) return (
    <Screen>
      <Row><T style={{ fontFamily: F.extra, fontSize: 20, color: C.orange }}>키오런</T><Grow /><Chip label="둘러보기" kind="line" big onPress={() => r.push('/tour')} /></Row>
      <View style={{ borderRadius: R.card, overflow: 'hidden' }}>
        <Image source={IMG.loginHero} style={{ width: '100%', aspectRatio: 3 / 2 }} contentFit="cover" />
      </View>
      <T v="ttl">휴대폰, 혼자 하기 어려울 때{'\n'}선생님이 댁으로 갑니다</T>
      <T v="sub" style={{ marginTop: -6 }}>90분 1:1 방문 수업. 어떤 분이신지 골라 주세요.</T>
      <View style={{ gap: 10 }}>
        {ROLES.map((x) => (
          <Pressable key={x.k} onPress={() => setRole(x.k)} accessibilityRole="button" accessibilityLabel={x.title}
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12, borderRadius: R.tile, borderWidth: 1.5, borderColor: pressed ? C.orange : C.line, backgroundColor: pressed ? '#fff6f2' : C.white, minHeight: 84 })}>
            <Image source={IMG[x.img]} style={{ width: 64, height: 64, borderRadius: 14 }} contentFit="cover" />
            <Grow><T style={{ fontFamily: F.bold, fontSize: 16.5, color: C.fg }}>{x.title}</T><T style={{ fontSize: 14, color: C.fg2, marginTop: 3 }}>{x.sub}</T></Grow>
            <T style={{ fontSize: 22, color: C.muted }}>›</T>
          </Pressable>
        ))}
      </View>
      {invite && <Box kind="peach" tight><T style={{ fontSize: 14 }}>가족 초대 링크로 들어오셨네요. 위에서 "가족"을 고르면 바로 연결됩니다.</T></Box>}
      <T v="fine" style={{ textAlign: 'center' }}>계속하면 이용약관과 개인정보 처리방침에 동의하는 것입니다.</T>
    </Screen>
  );

  // ── 2단계: 전화번호 → 인증번호 ──
  const cp = COPY[role];
  return (
    <Screen>
      <Row><Pressable onPress={() => { setRole(null); setStep('phone'); setErr(undefined); }} hitSlop={12} style={{ paddingVertical: 8, paddingRight: 12 }}><T style={{ fontSize: 16, fontFamily: F.semibold }}>‹ 다시 고르기</T></Pressable><Grow /></Row>
      <View style={{ borderRadius: R.card, overflow: 'hidden' }}>
        <Image source={IMG[cp.img]} style={{ width: '100%', aspectRatio: 2 / 1 }} contentFit="cover" />
      </View>
      <T v="ttl">{cp.ttl}</T>
      <T v="sub" style={{ marginTop: -6 }}>{cp.sub}</T>

      <View><T v="lbl">휴대폰 번호</T>
        <Input value={fmtPhone(phone)} onChangeText={setPhone} placeholder="010-0000-0000" keyboardType="phone-pad" maxLength={13} style={{ minHeight: 56 }}
          right={step === 'phone' ? undefined : <Pressable onPress={() => { setStep('phone'); setOtp(''); }} hitSlop={10}><T v="cap" style={{ fontSize: 14 }}>번호 바꾸기</T></Pressable>} /></View>

      {step === 'otp' && (
        <>
          <View><T v="lbl">문자로 온 숫자 6자리</T>
            <Input value={otp} onChangeText={(v) => setOtp(v.replace(/\D/g, '').slice(0, 6))} placeholder="000000" keyboardType="number-pad" maxLength={6} autoComplete="sms-otp" textContentType="oneTimeCode" style={{ minHeight: 56 }}
              right={dev ? <T v="cap">개발 모드: 아무 6자리</T> : <Row style={{ gap: 10 }}><T style={{ fontSize: 14, color: left > 0 ? C.fg2 : C.danger, fontVariant: ['tabular-nums'] }}>{left > 0 ? mmss : '만료'}</T><Pressable onPress={send} disabled={!canResend || busy} hitSlop={10}><T style={{ fontSize: 14, fontFamily: F.semibold, color: canResend ? C.fg : C.muted }}>{canResend ? '다시 받기' : `${60 - elapsed}초 뒤`}</T></Pressable></Row>} /></View>
          {left === 0 && !dev && <T style={{ fontSize: 14, color: C.danger }}>인증번호가 만료됐어요. "다시 받기"를 눌러 새 번호를 받아 주세요.</T>}
          {role === 'instructor' && (
            <View><T v="lbl">자격번호 <T v="cap">처음 한 번만. 이미 등록했으면 비워 두세요</T></T><Input value={cert} onChangeText={(v) => setCert(v.toUpperCase())} placeholder="KL-DC-2026-0000" autoCapitalize="characters" right={cert.length > 10 ? <Chip label="확인" kind="ok" /> : needCert ? <Chip label="필요" /> : undefined} /></View>
          )}
        </>
      )}

      {!!err && <T style={{ fontSize: 14, color: C.danger }}>{err}</T>}
      {step === 'phone'
        ? <Btn label={busy ? '보내는 중…' : '인증번호 받기'} size="xl" onPress={send} disabled={digits.length !== 11 || busy} />
        : <Btn label={busy ? '확인 중…' : role === 'instructor' ? '들어가기' : '확인하고 시작하기'} size="xl" onPress={verify} disabled={otp.length !== 6 || busy} />}
      <T v="cap" style={{ textAlign: 'center' }}>한 번 들어오면 30일 동안 다시 묻지 않습니다.</T>

      {role === 'instructor' && (
        <Box>
          <T v="h">아직 자격번호가 없으신가요</T>
          <T v="sub" style={{ marginTop: 4 }}>학습실에서 온라인 6모듈을 읽고 서류 3종을 내면 발급됩니다. 실습이나 시범 수업은 없습니다.</T>
          <Row style={{ gap: 8, marginTop: 10 }}>
            <Btn label="학습실 열기" kind="ghost" size="sm" onPress={() => Linking.openURL('https://kiolearn.co.kr/teach-course').catch(() => {})} />
            <Btn label="강사 지원하기" kind="ghost" size="sm" onPress={() => r.push('/connect/jobs')} />
          </Row>
        </Box>
      )}
      {invite && <Box kind="peach" tight><T style={{ fontSize: 14 }}>가족 초대 링크로 들어오셨네요. 인증이 끝나면 초대한 가족의 부모님 소식이 바로 연결됩니다.</T></Box>}
    </Screen>
  );
}
