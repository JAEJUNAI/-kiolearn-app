// T4 배정 요청 상세 (24시간 카운트, 먼저 수락한 사람)
import React, { useEffect, useState } from 'react';
import { View, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen, Nav, T, Box, Row, Grow, Icon, KV, Btn, Chips, Chip } from '../../../src/ui';
import { useStore } from '../../../src/data/store';
import { fmtDT, remain, won, slotLabel } from '../../../src/lib/fmt';
import { PRODUCTS } from '../../../src/data/types';
import { C } from '../../../src/theme';

export default function Assignment() {
  const { id } = useLocalSearchParams<{ id: string }>(); const r = useRouter(); const s = useStore();
  const a = s.assignments.find((x) => x.id === id); const [slot, setSlot] = useState<1 | 2>(1);
  const [, tick] = useState(0); useEffect(() => { const t = setInterval(() => tick((x) => x + 1), 1000); return () => clearInterval(t); }, []);
  if (!a) return <Screen><Nav title="배정 요청" /><T v="sub">요청을 찾을 수 없어요.</T></Screen>;
  const rec = s.recipients.find((x) => x.id === a.recipientId)!; const p = s.passes.find((x) => x.id === a.passId)!;
  const gone = a.status !== 'requested' || new Date(a.expiresAt) < new Date();
  const accept = () => { const o = s.acceptAssignment(a.id, slot); if (!o.ok) Alert.alert('맡을 수 없어요', o.error); else r.replace('/(instructor)/today'); };
  const decline = () => Alert.alert('거절 사유', '사유는 집계에만 쓰이고 불이익은 없습니다.', ['거리', '시간', '주제', '개인 사정', '기타'].map((why) => ({ text: why, onPress: () => { s.declineAssignment(a.id, why); r.back(); } })).concat([{ text: '닫기', onPress: () => {} }]));
  return (
    <Screen>
      <Nav title="배정 요청" right={<T v="cap" style={{ color: C.orangeDeep, fontFamily: 'Pretendard-Bold' }}>{gone ? '마감' : `남은 시간 ${remain(a.expiresAt, 'hms')}`}</T>} />
      <Box kind="white">
        <Row><Icon src="icPin" size={44} /><Grow><T v="h" style={{ fontSize: 16 }}>{rec.sigungu.split(' ').pop()} {rec.dong}</T><T v="cap">집에서 왕복 {a.distanceKm}km · 버스 {Math.round(a.distanceKm * 3)}분</T></Grow></Row>
        <KV k="일시" style={{ marginTop: 8 }} v={<View style={{ alignItems: 'flex-end' }}><T b style={{ fontSize: 13.5 }}>{p.slot1 ? `${fmtDT(p.slot1.date + 'T00:00:00', false)} ${slotLabel(p.slot1.slot)}` : '-'}</T>{p.slot2 && <T v="cap">2순위 {fmtDT(p.slot2.date + 'T00:00:00', false)} {slotLabel(p.slot2.slot)}</T>}</View>} />
        <KV k="상품" v={`${PRODUCTS[p.product].name} · ${p.remaining === p.total ? '첫 수업' : `${p.total - p.remaining + 1}회차`}`} />
        <KV k="주제" v={a.topic} />
        <KV k="수당" v={`회당 ${won(a.payout)} + 교통비`} />
      </Box>
      <View><T v="lbl">어르신 메모 <T v="cap">운영자 상담 기록 전체</T></T><Box tight><T style={{ fontSize: 13, lineHeight: 20 }}>{rec.opsMemo}</T></Box></View>
      {p.slot2 && <View><T v="lbl">맡을 일정</T><Chips><Chip big label="1순위" kind="line" sel={slot === 1} onPress={() => setSlot(1)} /><Chip big label="2순위" kind="line" sel={slot === 2} onPress={() => setSlot(2)} /></Chips></View>}
      <Btn label={gone ? '다른 선생님이 맡았습니다' : '수락하기'} disabled={gone} onPress={accept} />
      {!gone && <Btn label="거절 (사유 선택)" kind="ghost" onPress={decline} />}
      <T v="fine">수락하면 보호자에게 바로 알림이 가고, 수업 전날 전화 할 일이 생깁니다. 상세 주소는 수락 뒤에 보입니다.</T>
    </Screen>
  );
}
