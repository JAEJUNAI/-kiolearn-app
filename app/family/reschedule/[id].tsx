// G7 일정 변경 (24시간 전까지 무료)
import React, { useMemo, useState } from 'react';
import { View, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen, Nav, T, Box, Row, Grow, Avatar, Chip, Chips, Btn, Toggle } from '../../../src/ui';
import { useStore, RULES } from '../../../src/data/store';
import { fmtDT, hoursUntil, ymd } from '../../../src/lib/fmt';
import { C, F } from '../../../src/theme';

export default function Reschedule() {
  const { id } = useLocalSearchParams<{ id: string }>(); const r = useRouter(); const s = useStore();
  const ses = s.sessions.find((x) => x.id === id);
  const [day, setDay] = useState<string>(''); const [hour, setHour] = useState<number>(14); const [health, setHealth] = useState(false);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => { const x = new Date(); x.setDate(x.getDate() + 1 + i); x.setHours(0, 0, 0, 0); return x; }), []);
  if (!ses) return <Screen><Nav title="일정 바꾸기" /><T v="sub">수업을 찾을 수 없어요.</T></Screen>;
  const t = s.instructors.find((i) => i.id === ses.instructorId)!; const rec = s.recipients.find((x) => x.id === ses.recipientId)!;
  const left = hoursUntil(ses.scheduledAt); const free = left >= RULES.changeFreeHours;
  const slots = t.settings.timeslots.flatMap((x) => ({ am: [10, 11], pm: [14, 15, 16], eve: [18, 19] }[x]));
  const target = day ? (() => { const x = new Date(day + 'T00:00:00'); x.setHours(hour, 0, 0, 0); return x.toISOString(); })() : '';
  const go = () => {
    const { deduction } = s.reschedule(ses.id, target, 'family', health);
    s.toast(deduction ? `바꿨어요. 회차 ${deduction}회가 차감됐습니다.` : `${fmtDT(target)}로 바꿨어요. ${rec.honorific}께는 전날 강사가 전화드려요.`); r.back();
  };
  const cancel = () => Alert.alert('이번 수업을 취소할까요', free ? '24시간 전이라 차감 없이 취소됩니다.' : health ? '어르신 건강 사유는 운영자가 확인 뒤 차감 없이 처리할 수 있어요.' : '24시간 안이라 회차 절반이 차감됩니다.', [{ text: '아니오' }, { text: '취소하기', style: 'destructive', onPress: () => { const o = s.cancelSession(ses.id, 'family', health ? '건강 사유' : undefined); s.toast(o.deduction ? '취소했어요. 회차 0.5회가 차감됐습니다.' : '취소했어요.'); r.back(); } }]);
  return (
    <Screen>
      <Nav title="일정 바꾸기" />
      <Box kind="white" tight><Row><Avatar src={t.photo} size={36} /><Grow><T v="cap">지금 잡힌 수업</T><T v="h">{fmtDT(ses.scheduledAt)}</T><T v="cap">{t.name} 강사 · {ses.topic}</T></Grow><Chip label={free ? '변경 가능' : '24시간 안'} kind={free ? 'ok' : 'peach'} /></Row></Box>
      <T v="cap">{free ? `수업 24시간 전까지 바꿀 수 있어요. 지금은 ${Math.floor(left)}시간 남았습니다.` : '24시간 안이라 바꾸면 회차 절반이 차감됩니다. 어르신 건강 사유는 아래를 켜 주세요.'}</T>
      <View><T v="lbl">날짜 <T v="cap">강사가 가능한 요일만 켜져요</T></T>
        <Row style={{ gap: 5 }}>{days.map((x) => { const k = ymd(x); const okDay = t.settings.weekdays.includes(x.getDay()); const on = day === k; return (
          <Pressable key={k} disabled={!okDay} onPress={() => setDay(k)} style={{ flex: 1, backgroundColor: on ? C.orange : C.soft, borderRadius: 12, paddingVertical: 8, alignItems: 'center', opacity: okDay ? 1 : 0.35 }}>
            <T style={{ fontFamily: F.semibold, fontSize: 12.5, lineHeight: 16, color: on ? '#fff' : C.muted }}>{'일월화수목금토'[x.getDay()]}</T><T style={{ fontSize: 10, lineHeight: 12, color: on ? '#fff' : C.muted }}>{x.getDate()}</T>
          </Pressable>); })}</Row>
      </View>
      <View><T v="lbl">시간 <T v="cap">강사가 가능한 시간만 보여요</T></T><Chips>{slots.map((h) => <Chip key={h} big label={`${String(h).padStart(2, '0')}:00`} kind="line" sel={hour === h} onPress={() => setHour(h)} />)}</Chips></View>
      {!free && <Row><Grow><T b style={{ fontSize: 13.5 }}>어르신 건강 사유</T><T v="cap">운영자가 확인 뒤 차감 없이 처리할 수 있어요</T></Grow><Toggle on={health} onChange={setHealth} /></Row>}
      {!!target && <Box tight><T style={{ fontSize: 13 }}>바꾸면 {fmtDT(target)}, 같은 강사가 갑니다. {rec.honorific}께는 전날 강사가 전화로 다시 알려드려요.</T></Box>}
      <Btn label="이 날로 바꾸기" disabled={!target} onPress={go} />
      <Btn label="이번 수업 취소하기" kind="ghost" onPress={cancel} />
      <T v="fine">24시간 안에 취소하면 회차 절반이 차감됩니다. 어르신 건강 문제는 운영자에게 말씀해 주세요.</T>
    </Screen>
  );
}
