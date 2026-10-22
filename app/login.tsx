// G1 시작·인증 + T1 강사 로그인. 전화번호 → OTP → (강사면) 자격번호.
import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Screen, T, Btn, Input, Box, Chip, Row, Grow, Icon } from '../src/ui';
import { useStore } from '../src/data/store';
import { sendOtp, verifyOtp } from '../src/lib/supabase';
import { C, F } from '../src/theme';

const fmtPhone = (v: string) => { const d = v.replace(/\D/g, '').slice(0, 11); return d.length > 7 ? `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}` : d.length > 3 ? `${d.slice(0, 3)}-${d.slice(3)}` : d; };

export default function Login() {
  const r = useRouter(); const { invite, as } = useLocalSearchParams<{ invite?: string; as?: string }>();
  const loginServer = useStore((s) => s.loginServer); const rec = useStore((s) => s.recipients[0]);
  const [dev, setDev] = useState(false);
  const [role, setRole] = useState<'family' | 'instructor'>(as === 'instructor' ? 'instructor' : 'family');
  const [phone, setPhone] = useState(''); const [otp, setOtp] = useState(''); const [cert, setCert] = useState(''); const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [err, setErr] = useState<string | undefined>(); const [busy, setBusy] = useState(false);
  const digits = phone.replace(/\D/g, '');

  const send = async () => { setErr(undefined); setBusy(true); const res = await sendOtp(digits); setBusy(false); if (!res.ok) return setErr(res.error ?? '문자를 보내지 못했어요.'); setDev(!!res.dev); setStep('otp'); };
  const verify = async () => {
    setErr(undefined); setBusy(true); const res = await verifyOtp(digits, otp, role === 'instructor' ? cert : undefined); setBusy(false);
    if (!res.ok || !res.account) return setErr(res.error ?? '번호가 맞지 않아요. 다시 확인해 주세요.');
    loginServer({ phone: digits, name: res.account.name, roles: res.account.roles, instructor: res.instructor ?? null });
    r.replace('/');
  };

  return (
    <Screen>
      <Row style={{ justifyContent: 'flex-end' }}><Chip label="둘러보기" kind="line" big onPress={() => r.push('/tour')} /></Row>
      <View style={{ alignItems: 'center', paddingTop: 6 }}><Icon src={role === 'instructor' ? 'icCert' : 'icPhone'} size={110} /></View>
      <T v="ttl" style={{ textAlign: 'center' }}>{role === 'instructor' ? '강사로\n들어갑니다' : '전화번호로\n시작합니다'}</T>
      <T v="cap" style={{ textAlign: 'center', marginTop: -6 }}>비밀번호 없이 문자로 받은 번호만 넣으면 됩니다</T>

      <Row style={{ gap: 6, justifyContent: 'center' }}>
        <Chip label="가족·본인" big sel={role === 'family'} kind="line" onPress={() => setRole('family')} />
        <Chip label="강사" big sel={role === 'instructor'} kind="line" onPress={() => setRole('instructor')} />
      </Row>

      <Input value={fmtPhone(phone)} onChangeText={setPhone} placeholder="010-0000-0000" keyboardType="phone-pad" maxLength={13}
        right={step === 'phone' ? <Pressable onPress={send} disabled={digits.length !== 11 || busy}><T v="cap" style={{ color: digits.length === 11 ? C.fg : C.muted, fontFamily: F.semibold }}>인증번호 받기</T></Pressable> : <Pressable onPress={() => { setStep('phone'); setOtp(''); }}><T v="cap">번호 바꾸기</T></Pressable>} />

      {step === 'otp' && (
        <>
          <Input value={otp} onChangeText={(v) => setOtp(v.replace(/\D/g, '').slice(0, 6))} placeholder="인증번호 6자리" keyboardType="number-pad" maxLength={6} right={dev ? <T v="cap">개발 모드: 아무 6자리</T> : undefined} />
          {role === 'instructor' && (
            <View><T v="lbl">자격번호</T><Input value={cert} onChangeText={(v) => setCert(v.toUpperCase())} placeholder="KL-DC-2026-0000" autoCapitalize="characters" right={cert.length > 10 ? <Chip label="확인" kind="ok" /> : undefined} /></View>
          )}
        </>
      )}

      {invite && <Box kind="peach" tight><T style={{ fontSize: 13 }}>초대 링크로 들어오셨네요. 인증이 끝나면 <T b>{rec.honorific}({rec.name})</T>이 바로 연결됩니다.</T></Box>}
      {!!err && <T v="cap" style={{ color: C.danger }}>{err}</T>}

      {step === 'phone'
        ? <Btn label="인증번호 받기" onPress={send} disabled={digits.length !== 11 || busy} />
        : <Btn label={role === 'instructor' ? '들어가기' : '인증하고 시작하기'} onPress={verify} disabled={otp.length !== 6 || busy || (role === 'instructor' && cert.length < 10)} />}

      {role === 'instructor' && (
        <Box>
          <T v="h">아직 자격번호가 없으신가요</T>
          <T v="sub" style={{ marginTop: 4 }}>학습실에서 6모듈을 읽고 서류 3종을 올리면 발급됩니다. 실습이나 시범은 없습니다.</T>
          <Btn label="학습실 열기" kind="ghost" size="sm" style={{ alignSelf: 'flex-start', marginTop: 10 }} onPress={() => r.push('/connect/jobs')} />
        </Box>
      )}
      <T v="fine" style={{ textAlign: 'center' }}>계속하면 이용약관과 개인정보 처리방침에 동의하는 것입니다.</T>
      <Grow />
    </Screen>
  );
}
