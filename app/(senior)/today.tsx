// A2 오늘: 미션 하나, 버튼 하나
import React from 'react';
import { Linking } from 'react-native';
import { Screen, T, Hero, Btn, Row, Box, Icon } from '../../src/ui';
import { useStore, sel } from '../../src/data/store';
import { fmtDT } from '../../src/lib/fmt';
import { Pressable } from 'react-native';

export default function SeniorToday() {
  const s = useStore(); const rec = sel.myRecipient(s);
  const m = s.missions.find((x) => x.recipientId === rec.id && !x.doneAt) ?? s.missions.find((x) => x.recipientId === rec.id);
  const done = !!m?.doneAt; const fam = rec.guardians[0]?.name ?? '가족';
  const open = (url: string) => Linking.openURL(url).catch(() => s.toast('브라우저에서 열어 주세요.'));
  return (
    <Screen>
      <T v="cap" style={{ fontSize: 15 }}>{fmtDT(new Date(), false)}</T>
      <T v="ttl" style={{ fontSize: 26, marginTop: -6 }}>오늘 해 볼 것</T>
      {m ? <Hero src={m.photo ?? 'lesson'} title={m.body} /> : <Box style={{ alignItems: 'center', paddingVertical: 30 }}><Icon src="icCalendar" size={72} /><T v="sub" style={{ fontSize: 15 }}>오늘은 미션이 없어요. 수업이 끝나면 선생님이 과제를 남겨요.</T></Box>}
      {m && <T v="sub" style={{ fontSize: 15 }}>{m.source === 'report' ? `${m.teacher ?? '선생님'} ${rec.honorificTeacher}이 지난 수업 끝에 적어 둔 과제예요. 천천히, 되는 데까지만.` : '운영자가 올린 이번 주 과제예요.'}</T>}
      {m && <Btn label={done ? '오늘은 해냈어요' : '해냈어요'} size="xl" disabled={done} onPress={() => s.missionDone(m.id)} />}
      <T v="fine" style={{ textAlign: 'center', fontSize: 13 }}>{done ? `${fam} 님에게 알림이 갔어요.` : `누르면 ${fam} 님에게 "혼자 해내셨어요"가 갑니다.`}</T>
      <Row style={{ marginTop: 4 }}>
        <Pressable onPress={() => open('https://kiolearn.co.kr/academy')} style={{ flex: 1 }}><Box tight style={{ alignItems: 'center' }}><Icon src="icPhone" size={38} /><T b style={{ fontSize: 14 }}>키오스크 연습</T></Box></Pressable>
        <Pressable onPress={() => open('https://kiolearn.co.kr/fortune')} style={{ flex: 1 }}><Box tight style={{ alignItems: 'center' }}><Icon src="icActivity" size={38} /><T b style={{ fontSize: 14 }}>놀이 · 운세</T></Box></Pressable>
      </Row>
    </Screen>
  );
}
