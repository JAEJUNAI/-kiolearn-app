// T5 일정 (주간)
import React, { useState } from 'react';
import { View, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, T, Row, Grow, Chip, Box, Btn } from '../../src/ui';
import { useStore, sel } from '../../src/data/store';
import { fmtTime, weekOf, ymd } from '../../src/lib/fmt';
import { C, F } from '../../src/theme';

const LABEL: Record<string, string> = { scheduled: '확정', confirmed: '전화 완료', departed: '출발', arrived: '도착', in_progress: '진행 중', submitted: '리포트 제출', done: '완료', no_show: '만나지 못함', early_end: '조기 종료', cancelled: '취소' };

export default function Schedule() {
  const r = useRouter(); const s = useStore(); const [off, setOff] = useState(0); const [selId, setSelId] = useState<string | undefined>();
  const base = weekOf(new Date()); base.setDate(base.getDate() + off * 7);
  const days = Array.from({ length: 7 }, (_, i) => { const x = new Date(base); x.setDate(x.getDate() + i); return x; });
  const mine = sel.mySessions(s); const todayKey = ymd(new Date());
  const selSes = mine.find((x) => x.id === selId);
  const cancel = () => { if (!selSes) return; const o = s.cancelSession(selSes.id, 'instructor'); if (!o.ok) return Alert.alert('취소할 수 없어요', o.error); s.toast('취소했어요. 같은 조건 강사에게 다시 요청됩니다.'); setSelId(undefined); };
  const change = () => { if (!selSes) return; s.toast('변경 요청을 보호자에게 보냈어요. 승인되면 바뀝니다.'); setSelId(undefined); };
  return (
    <Screen>
      <Row><T v="ttl">{off === 0 ? '이번 주' : off === 1 ? '다음 주' : off === -1 ? '지난 주' : `${off > 0 ? '+' : ''}${off}주`}</T><Grow /><Chip label="‹" kind="line" big onPress={() => setOff(off - 1)} /><Chip label={`${days[0].getMonth() + 1}월 ${days[0].getDate()}일 ~ ${days[6].getDate()}일`} kind="line" big onPress={() => setOff(0)} /><Chip label="›" kind="line" big onPress={() => setOff(off + 1)} /></Row>
      <View style={{ gap: 8 }}>
        {days.map((d) => {
          const k = ymd(d); const items = mine.filter((x) => ymd(x.scheduledAt) === k).sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
          const dayLbl = <View style={{ width: 34, alignItems: 'center' }}><T style={{ fontFamily: F.extra, lineHeight: 18 }}>{'일월화수목금토'[d.getDay()]}</T><T style={{ fontSize: 10, color: C.muted, lineHeight: 12 }}>{d.getDate()}</T></View>;
          if (items.length === 0) return <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: '#e5e5e5', paddingVertical: 10, paddingHorizontal: 12 }}>{dayLbl}<T style={{ color: '#a0a0a0', fontSize: 13 }}>{d.getDay() === 0 || d.getDay() === 6 ? '쉬는 날' : '수업 없음'}</T></View>;
          return items.map((x) => { const rec = s.recipients.find((q) => q.id === x.recipientId)!; const isToday = k === todayKey; const on = selId === x.id; return (
            <Pressable key={x.id} onPress={() => setSelId(on ? undefined : x.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: on ? C.white : C.soft, borderWidth: on ? 2 : 0, borderColor: C.orange, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12 }}>
              {dayLbl}<Grow><T b style={{ fontSize: 13.5 }}>{fmtTime(x.scheduledAt)} {rec.name} {rec.honorific}</T><T v="cap">{rec.dong} · {x.seq}회차 · {x.topic}</T></Grow>
              <Chip label={isToday && !['done', 'cancelled'].includes(x.status) ? '오늘' : LABEL[x.status]} kind={x.status === 'done' ? 'ok' : isToday ? 'peach' : x.status === 'cancelled' ? 'gray' : 'gray'} />
            </Pressable>); });
        })}
      </View>
      <Box tight><T v="sub">취소는 24시간 전까지. 그 뒤에는 운영자에게 전화로 말씀해 주세요. 변경 요청은 보호자가 승인해야 바뀝니다.</T></Box>
      <Row><Btn label="변경 요청" kind="ghost" size="sm" grow disabled={!selSes || !['scheduled', 'confirmed'].includes(selSes.status)} onPress={change} /><Btn label="취소" kind="ghost" size="sm" grow disabled={!selSes || !['scheduled', 'confirmed'].includes(selSes.status)} onPress={cancel} /></Row>
      {selSes && ['in_progress', 'submitted'].includes(selSes.status) && <Btn label="리포트로 가기" size="sm" onPress={() => r.push(`/instructor/report/${selSes.id}`)} />}
    </Screen>
  );
}
