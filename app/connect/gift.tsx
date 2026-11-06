// E1 효도권 코드 등록 → 회차 충전 → 희망 일시
import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Nav, T, Tile, Input, Chip, Box, KV, Btn, Chips } from '../../src/ui';
import { useStore, sel } from '../../src/data/store';
import { PRODUCTS } from '../../src/data/types';
import { fmtDT } from '../../src/lib/fmt';
import { api } from '../../src/lib/supabase';
import { C } from '../../src/theme';

const fmtCode = (v: string) => v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11).replace(/(.{3})(.{0,4})(.{0,4})/, (_, a, b, c) => [a, b, c].filter(Boolean).join('-'));

export default function Gift() {
  const r = useRouter(); const s = useStore(); const rec = sel.myRecipient(s);
  const [code, setCode] = useState(''); const [err, setErr] = useState('');
  const g = s.gifts.find((x) => x.code === code && !x.redeemedAt);
  const who = `${rec.honorific}${rec.name ? ` (${rec.name})` : ''}`;
  // 실제 사용자: 효도권 서버 검증이 붙기 전까지는 코드를 운영자에게 보내고 확인 뒤 충전한다.
  const real = s.demo === false; const codeOk = /^[A-Z0-9]{3}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code);
  const sendCode = async () => { const out = await api('app', { op: 'ticket', kind: 'gift_code', ref: code, body: `효도권 코드 ${code} · 충전 대상 ${who}` }); if (!out.ok) return setErr(out.error || '보내지 못했어요. 잠시 뒤 다시 시도해 주세요.'); s.toast('코드를 받았어요. 운영자가 확인하고 충전해 드릴게요.'); r.back(); };
  const redeem = () => { const o = s.redeemGift(code, rec.id); if (!o.ok) return setErr(o.error!); s.toast(`${PRODUCTS[o.pass!.product].total}회가 충전됐어요. 희망 일정을 골라 주세요.`); r.replace({ pathname: '/(family)/book', params: { passId: o.pass!.id } }); };
  return (
    <Screen>
      <Nav title="효도권 등록" />
      <Tile title={'회사에서 받은\n부모님 디지털 효도권'} text={`코드를 넣으면 회차가 ${rec.honorific}께 충전돼요.`} obj="icGift" />
      <View><T v="lbl">효도권 코드</T><Input value={code} onChangeText={(v) => { setCode(fmtCode(v)); setErr(''); }} placeholder="KIO-XXXX-XXXX" autoCapitalize="characters" style={{ letterSpacing: 1 }} right={g ? <Chip label="확인됨" kind="ok" /> : undefined} /></View>
      {!!err && <T v="cap" style={{ color: C.danger }}>{err}</T>}
      {g && (
        <Box kind="white">
          <KV first k="발급" v={g.corp} />
          <KV k="내용" v={`방문 수업 ${PRODUCTS[g.product].total}회 · ${PRODUCTS[g.product].months}개월`} />
          <KV k="유효기간" v={fmtDT(g.expiresAt, false)} />
          <KV k="충전 대상" v={who} />
        </Box>
      )}
      <View><T v="lbl">충전 대상</T><Chips><Chip big label={who} sel /><Chip big label="+ 다른 어르신" kind="line" onPress={() => r.push('/family/profile')} /></Chips></View>
      <Box tight><T v="sub">충전되면 바로 희망 일정을 고를 수 있어요. 운영자가 강사와 맞춰 첫 일정을 알려 드려요.</T></Box>
      {real
        ? <Btn label={codeOk ? '코드 보내기' : '코드를 입력해 주세요'} disabled={!codeOk} onPress={sendCode} />
        : <Btn label={g ? `${PRODUCTS[g.product].total}회 충전하기` : '코드를 입력해 주세요'} disabled={!g} onPress={redeem} />}
      {!real && <T v="fine">개발용 코드: KIO-7F3K-28QD</T>}
    </Screen>
  );
}
