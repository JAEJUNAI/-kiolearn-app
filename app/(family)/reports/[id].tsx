// G4 리포트 상세 (05-7장 순서)
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen, Nav, T, Row, Grow, Chip, Photo, Box, Check, Avatar, Btn, Input, Icon } from '../../../src/ui';
import { useStore } from '../../../src/data/store';
import { fmtDT, fmtTime } from '../../../src/lib/fmt';
import { C } from '../../../src/theme';

export default function ReportDetail() {
  const { id } = useLocalSearchParams<{ id: string }>(); const r = useRouter();
  const s = useStore(); const rep = s.reports.find((x) => x.id === id);
  const [note, setNote] = useState(''); const [showNote, setShowNote] = useState(false);
  useEffect(() => { if (rep && !rep.readAt) s.readReport(rep.id); }, [rep?.id]);
  if (!rep) return <Screen><Nav title="리포트" /><T v="sub">리포트를 찾을 수 없어요.</T></Screen>;
  const rec = s.recipients.find((x) => x.id === rep.recipientId)!; const t = s.instructors.find((i) => i.id === rep.instructorId)!;
  return (
    <Screen>
      <Nav title={`${rep.seq}회차 리포트`} onBack={() => (r.canGoBack() ? r.back() : r.replace('/(family)/reports'))} />
      <Row align="flex-start"><Grow><T v="cap">{rep.seq}회차 · {fmtDT(rep.date, false)}</T><T v="ttl2">오늘 {rec.honorific}이{'\n'}혼자 해낸 것</T></Grow><Chip label={`도착 ${fmtTime(rep.arrivedAt)} · 종료 ${fmtTime(rep.endedAt)}`} kind="dark" /></Row>
      {rep.flag && <Box kind="peach" tight><T b style={{ fontSize: 13 }}>특이사항 · {rep.flagType}</T><T style={{ fontSize: 13 }}>{rep.flagNote}</T></Box>}
      {rep.photo ? <Photo src={rep.photo} /> : <Box style={{ alignItems: 'center', paddingVertical: 24 }}><Icon src="icPhone" size={64} /><T v="cap">사진 없이 진행된 수업</T></Box>}
      <Box><View style={{ gap: 9 }}>{rep.checks.map((c, i) => <Check key={i} label={c.label} chip={c.first ? '처음 성공' : undefined} />)}</View></Box>
      <Row align="flex-start"><Avatar src={t.photo} size={34} /><Grow><T v="sub">"{rep.memo}" <T v="cap">— {t.name} 강사</T></T></Grow></Row>
      <Box kind="white" tight><T v="cap">다음까지 해 볼 것</T><T style={{ fontSize: 13.5, marginTop: 2 }}>{rep.nextTask}</T></Box>
      {rep.notes.map((n, i) => <Box key={i} tight><T v="cap">추가 메모 · {fmtDT(n.at)}</T><T style={{ fontSize: 13.5 }}>{n.body}</T></Box>)}
      <T v="cap">{rep.flag ? '특이사항 있음' : '특이사항 없음'}{rep.nextSessionAt ? ` · 다음 수업 ${fmtDT(rep.nextSessionAt)}` : ''}</T>
      {rep.rating
        ? <Row><Chip label={rep.rating === 'good' ? '도움이 됐어요' : '아쉬워요'} kind={rep.rating === 'good' ? 'ok' : 'gray'} big /><T v="cap">평가는 24시간 안에 바꿀 수 있어요</T></Row>
        : null}
      {(!rep.rating || showNote) && (
        <Row><Btn label="도움이 됐어요" kind="ghost" grow onPress={() => { s.rateReport(rep.id, 'good'); setShowNote(false); }} /><Btn label="아쉬워요" kind="ghost" grow onPress={() => setShowNote(true)} /></Row>
      )}
      {showNote && (
        <View style={{ gap: 8 }}>
          <Input value={note} onChangeText={setNote} placeholder="어떤 점이 아쉬웠는지 적어 주시면 운영자가 확인합니다" multiline />
          <Btn label="보내기" size="sm" onPress={() => { s.rateReport(rep.id, 'bad', note); setShowNote(false); s.toast('운영자가 확인하고 연락드릴게요.'); }} style={{ alignSelf: 'flex-end' }} />
        </View>
      )}
      <T v="fine" style={{ color: C.muted }}>사진은 길게 눌러 저장할 수 있어요. 강사에게는 평가 집계만 보이고 누가 남겼는지는 보이지 않습니다.</T>
    </Screen>
  );
}
