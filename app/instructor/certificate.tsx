// T9 활동 증명서
import React, { useState } from 'react';
import { View } from 'react-native';
import { Screen, Nav, T, Chips, Chip, Cert, Icon, KV, Btn } from '../../src/ui';
import { sendTicket } from '../../src/lib/profile';
import { useStore, sel } from '../../src/data/store';
import { fmtYM, ymd } from '../../src/lib/fmt';

export default function Certificate() {
  const s = useStore(); const me = sel.me(s); const [range, setRange] = useState<'month' | 'year' | 'custom'>('year');
  const now = new Date(); const from = range === 'month' ? fmtYM(now) : (me.issuedAt ? me.issuedAt.slice(0, 7).replace('-', '.') : fmtYM(now)); const to = fmtYM(now);
  const no = `CERT-${ymd(now).replace(/-/g, '')}-${me.certNo.slice(-4)}`;
  return (
    <Screen>
      <Nav title="활동 증명서" />
      <View><T v="lbl">기간</T><Chips><Chip big label="이번 달" kind="line" sel={range === 'month'} onPress={() => setRange('month')} /><Chip big label="올해 전체" kind="line" sel={range === 'year'} onPress={() => setRange('year')} /><Chip big label="직접 고르기" kind="line" sel={range === 'custom'} onPress={() => setRange('custom')} /></Chips></View>
      <Cert>
        <Icon src="icCert" size={54} />
        <T v="cap">디지털 돌봄강사 활동 증명서</T>
        <T v="h" style={{ fontSize: 17, marginTop: 4 }}>{me.name}</T>
        <T v="cap">자격번호 {me.certNo} · {me.issuedAt.slice(0, 7).replace('-', '년 ')}월 발급</T>
        <View style={{ alignSelf: 'stretch', marginTop: 12 }}>
          <KV first k="활동 기간" v={`${from} ~ ${to}`} />
          <KV k="방문 수업" v={`${me.stats.lessons}회 · 어르신 ${me.stats.seniors}명`} />
          <KV k="재예약" v={`${me.stats.rebooked}건`} />
          <KV k="발급" v={`(주)재준에이아이 · ${ymd(now).replace(/-/g, '.')}`} />
        </View>
        <T v="cap" style={{ marginTop: 10 }}>문서번호 {no} · 진위 확인 010-3871-5430</T>
      </Cert>
      <Btn label="도장 찍힌 증명서 요청하기" onPress={async () => { const out = await sendTicket('cert_request', `활동 증명서 요청 · ${me.name} ${me.certNo} · 기간 ${from}~${to}`); s.toast(out.ok ? '요청을 받았어요. 운영자가 1영업일 안에 문자로 보내 드릴게요.' : out.error!); }} />
    </Screen>
  );
}
