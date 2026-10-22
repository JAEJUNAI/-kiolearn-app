// T6 수업 카드. 단계 3 체크가 리포트로 넘어간다. 체크 상태는 로컬(스토어)에 남는다.
import React, { useEffect, useState } from 'react';
import { View, Pressable, Alert, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen, Nav, T, Row, Chip, Box, Btn } from '../../../src/ui';
import { useStore } from '../../../src/data/store';
import { fmtTime } from '../../../src/lib/fmt';
import { C, F } from '../../../src/theme';
import { lessonCard } from '../../../src/data/cards';

export default function Lesson() {
  const { id } = useLocalSearchParams<{ id: string }>(); const r = useRouter(); const s = useStore();
  const ses = s.sessions.find((x) => x.id === id);
  const [, tick] = useState(0); useEffect(() => { const t = setInterval(() => tick((x) => x + 1), 60000); return () => clearInterval(t); }, []);
  const [checks, setChecks] = useState<boolean[]>(() => (globalThis as { __checks?: Record<string, boolean[]> }).__checks?.[id] ?? [false, false, false]);
  useEffect(() => { const g = globalThis as { __checks?: Record<string, boolean[]> }; g.__checks = { ...(g.__checks ?? {}), [id]: checks }; }, [checks, id]);
  if (!ses) return <Screen><Nav title="수업 카드" /><T v="sub">수업을 찾을 수 없어요.</T></Screen>;
  const rec = s.recipients.find((x) => x.id === ses.recipientId)!; const card = lessonCard(ses.seq, ses.topic, rec.deviceBrand);
  const elapsed = ses.arrivedAt ? Math.floor((Date.now() - new Date(ses.arrivedAt).getTime()) / 60000) : 0;
  const nowIdx = checks.findIndex((c) => !c);
  const emergency = () => Alert.alert('비상', '운영자에게 바로 전화를 겁니다. 위협이나 급한 상황이면 먼저 자리를 피하세요.', [{ text: '닫기', style: 'cancel' }, { text: '전화 걸기', style: 'destructive', onPress: () => { s.ticket('emergency', ses.id); Linking.openURL('tel:01038715430').catch(() => {}); } }]);
  return (
    <Screen>
      <Nav title={`${ses.seq}회차 · ${ses.topic}`} right={<Chip label="비상" kind="danger" onPress={emergency} />} />
      <Row><Chip label="오프라인 저장됨" kind="gray" /><T v="cap">{ses.arrivedAt ? `도착 ${fmtTime(ses.arrivedAt)} · 진행 ${elapsed}분` : '도착 전'}</T>{elapsed > 105 && <Chip label="90분 지남" />}</Row>
      <Box kind="white">
        <View style={{ gap: 10 }}>
          {card.steps.map((st, i) => { const done = checks[i]; const now = !done && i === nowIdx; return (
            <Pressable key={i} onPress={() => setChecks(checks.map((c, k) => (k === i ? !c : c)))} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
              <View style={{ width: done || now ? 22 : 18, height: done || now ? 22 : 18, borderRadius: 11, marginTop: done || now ? 0 : 2, backgroundColor: done ? C.orange : now ? C.fg : '#fff', borderWidth: done || now ? 0 : 2, borderColor: '#ddd', alignItems: 'center', justifyContent: 'center' }}>{(done || now) && <T style={{ color: '#fff', fontFamily: F.extra, fontSize: 12, lineHeight: 14 }}>{done ? '✓' : String(i + 1)}</T>}</View>
              <View style={{ flex: 1 }}><T style={{ fontFamily: now ? F.extra : F.regular, color: !done && !now ? C.muted : C.fg }}>{st}</T>{now && <T v="cap">지금 하는 단계</T>}</View>
            </Pressable>); })}
        </View>
      </Box>
      <Box tight><T v="lbl">할 말 예시</T><T style={{ fontSize: 13.5 }}>"{card.say}"</T></Box>
      <Box tight><T v="lbl">막혔을 때</T><T style={{ fontSize: 13.5 }}>{card.stuck}</T></Box>
      <Box kind="peach" tight><T v="lbl" style={{ color: C.orangeDeep }}>하지 말 것</T><T style={{ fontSize: 13.5 }}>{card.dont.join(' · ')}</T></Box>
      {card.device && <T v="cap">기종 안내: {card.device}</T>}
      <Btn label="사진 찍고 리포트 쓰기" onPress={() => { s.startLesson(ses.id); r.push(`/instructor/report/${ses.id}`); }} />
    </Screen>
  );
}
