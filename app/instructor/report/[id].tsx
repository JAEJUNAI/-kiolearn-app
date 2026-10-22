// T7 리포트 작성. 제출하면 잠기고 정산 확정, 회차 차감, 다음 세션 생성.
import React, { useState } from 'react';
import { View, Pressable, Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen, Nav, T, Row, Grow, Box, Btn, Input, Toggle, Chips, Chip, KV, Check } from '../../../src/ui';
import { useStore } from '../../../src/data/store';
import { fmtDT, won } from '../../../src/lib/fmt';
import { lessonCard } from '../../../src/data/cards';
import { IMG, C } from '../../../src/theme';
import type { Report } from '../../../src/data/types';

export default function ReportWrite() {
  const { id } = useLocalSearchParams<{ id: string }>(); const r = useRouter(); const s = useStore();
  const ses = s.sessions.find((x) => x.id === id); const existing = s.reports.find((x) => x.sessionId === id);
  const rec = s.recipients.find((x) => x.id === ses?.recipientId);
  const card = ses ? lessonCard(ses.seq, ses.topic, rec?.deviceBrand) : undefined;
  const pre = (globalThis as { __checks?: Record<string, boolean[]> }).__checks?.[id] ?? [true, true, false];
  const [checks, setChecks] = useState<{ label: string; on: boolean; first: boolean }[]>(() => (card?.steps ?? []).map((l, i) => ({ label: l, on: !!pre[i], first: false })));
  const [photo, setPhoto] = useState<Report['photo'] | undefined>(); const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [memo, setMemo] = useState(''); const [task, setTask] = useState(''); const [flag, setFlag] = useState(false); const [flagType, setFlagType] = useState('건강'); const [flagNote, setFlagNote] = useState('');
  const [early, setEarly] = useState(false); const [earlyMin, setEarlyMin] = useState('20'); const [note, setNote] = useState('');
  if (!ses || !rec) return <Screen><Nav title="리포트" /><T v="sub">수업을 찾을 수 없어요.</T></Screen>;
  const nextAt = (() => { const x = new Date(ses.scheduledAt); x.setDate(x.getDate() + 7); return x.toISOString(); })();
  const pass = s.passes.find((p) => p.id === ses.passId)!;

  if (existing) return (
    <Screen>
      <Nav title={`리포트 · ${existing.seq}회차`} right={<Chip label={existing.status === 'held' ? '운영자 확인 중' : existing.status === 'submitted' ? '08:00 전송' : '전송됨'} kind={existing.status === 'held' ? 'peach' : 'ok'} />} />
      {existing.photo && <Image source={IMG[existing.photo]} style={{ width: '100%', aspectRatio: 16 / 10, borderRadius: 16 }} contentFit="cover" />}
      <Box tight><View style={{ gap: 9 }}>{existing.checks.map((c, i) => <Check key={i} label={c.label} chip={c.first ? '처음 성공' : undefined} />)}</View></Box>
      <Box kind="white" tight><T v="cap">한 줄 메모</T><T style={{ fontSize: 13.5 }}>{existing.memo}</T><T v="cap" style={{ marginTop: 6 }}>다음까지 해 볼 것</T><T style={{ fontSize: 13.5 }}>{existing.nextTask}</T></Box>
      {existing.notes.map((n, i) => <Box key={i} tight><T v="cap">추가 메모 · {fmtDT(n.at)}</T><T style={{ fontSize: 13.5 }}>{n.body}</T></Box>)}
      <T v="fine">제출된 리포트는 고칠 수 없고 추가 메모만 붙습니다.</T>
      <Input value={note} onChangeText={setNote} placeholder="추가 메모" multiline />
      <Btn label="추가 메모 붙이기" kind="ghost" disabled={note.trim().length < 2} onPress={() => { s.addNote(existing.id, note.trim()); setNote(''); s.toast('추가 메모를 붙였어요.'); }} />
      {ses.status === 'submitted' && <Btn label="종료" onPress={() => { s.finishSession(ses.id); r.replace('/(instructor)/today'); }} />}
    </Screen>
  );

  const takePhoto = async () => {
    if (Platform.OS === 'web') { setPhoto('kiosk'); return; }
    const p = await ImagePicker.requestCameraPermissionsAsync(); if (!p.granted) return Alert.alert('카메라 권한이 필요해요', '리포트 사진을 찍을 때 씁니다.');
    const res = await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: false });
    if (!res.canceled) { setPhotoUri(res.assets[0].uri); setPhoto('kiosk'); }
  };
  const valid = (early ? true : checks.some((c) => c.on)) && memo.trim().length >= 10 && (early || task.trim().length >= 5) && (!flag || flagNote.trim().length >= 10);
  const submit = () => {
    const go = () => {
      const out = s.submitReport(ses.id, { checks: checks.filter((c) => c.on).map((c) => ({ label: c.label, first: c.first })), photo, memo: memo.trim(), nextTask: task.trim(), flag, flagType: flag ? flagType : undefined, flagNote: flag ? flagNote.trim() : undefined, nextSessionAt: pass.remaining > 1 && !early ? nextAt : undefined, earlyEndMin: early ? Number(earlyMin) : undefined, earlyEndReason: early ? '어르신 컨디션' : undefined });
      if (!out.ok) return Alert.alert('제출할 수 없어요', out.error);
      Alert.alert('제출 완료', `이달 확정 금액에 ${won(out.amount)}이 더해졌어요.`, [{ text: '확인', onPress: () => r.replace('/(instructor)/today') }]);
    };
    if (!photo) Alert.alert('사진 없이 보낼까요', '사진이 없으면 리포트에 활동 카드가 대신 들어갑니다.', [{ text: '사진 찍기', onPress: takePhoto }, { text: '사진 없이 보내기', onPress: go }]); else go();
  };
  return (
    <Screen>
      <Nav title={`리포트 · ${ses.seq}회차`} />
      <Row align="flex-start">
        <Pressable onPress={takePhoto} style={{ width: 84, height: 84, borderRadius: 14, backgroundColor: C.soft, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>{photoUri ? <Image source={{ uri: photoUri }} style={{ width: '100%', height: '100%' }} /> : photo ? <Image source={IMG[photo]} style={{ width: '100%', height: '100%' }} contentFit="cover" /> : <T v="cap">카메라</T>}</Pressable>
        <Grow><T b>사진 1장</T><T v="cap">얼굴·계좌번호가 안 보이게 찍혔는지 확인{rec.photoConsent ? '' : ' · 얼굴 동의 없음: 손과 화면만'}</T><Btn label={photo ? '다시 찍기' : '사진 찍기'} kind="ghost" size="sm" style={{ alignSelf: 'flex-start', marginTop: 6 }} onPress={takePhoto} /></Grow>
      </Row>
      <Box tight>
        <View style={{ gap: 9 }}>
          {checks.map((c, i) => (
            <Row key={i} align="flex-start">
              <Pressable onPress={() => setChecks(checks.map((x, k) => (k === i ? { ...x, on: !x.on } : x)))} style={{ flex: 1 }}><Check label={c.label} state={c.on ? 'done' : 'off'} /></Pressable>
              <Chip label="처음 성공" kind={c.first ? 'peach' : 'line'} onPress={() => setChecks(checks.map((x, k) => (k === i ? { ...x, first: !x.first, on: true } : x)))} />
            </Row>
          ))}
        </View>
      </Box>
      <View><T v="lbl">한 줄 메모 <T v="cap">보호자에게 그대로 갑니다 · 어르신이 한 일을 주어로</T></T><Input value={memo} onChangeText={(v) => setMemo(v.slice(0, 200))} multiline placeholder="두 번째는 혼자 끝까지 누르셨어요." /></View>
      <View><T v="lbl">다음까지 해 볼 것</T><Input value={task} onChangeText={(v) => setTask(v.slice(0, 80))} placeholder="따님께 5천 원 보내 보기" /></View>
      <Row><Grow><T b style={{ fontSize: 13.5 }}>특이사항</T><T v="cap">켜면 운영자가 10분 먼저 봅니다</T></Grow><Toggle on={flag} onChange={setFlag} /></Row>
      {flag && <View style={{ gap: 8 }}><Chips>{['건강', '금전·사기', '가족 요청', '기기 문제', '기타'].map((k) => <Chip key={k} big label={k} kind="line" sel={flagType === k} onPress={() => setFlagType(k)} />)}</Chips><Input value={flagNote} onChangeText={setFlagNote} multiline placeholder="무엇을 보셨는지 10자 이상" /></View>}
      <Row><Grow><T b style={{ fontSize: 13.5 }}>조기 종료</T><T v="cap">30분 미만이면 차감 없이 재방문, 수당은 교통비만</T></Grow><Toggle on={early} onChange={setEarly} /></Row>
      {early && <Input value={earlyMin} onChangeText={(v) => setEarlyMin(v.replace(/\D/g, ''))} keyboardType="number-pad" placeholder="진행한 분" right={<T v="cap">분</T>} />}
      {!early && pass.remaining > 1 && <KV first k="다음 수업" v={`${fmtDT(nextAt)} (현장에서 정한 날짜)`} />}
      {!early && pass.remaining === 1 && <Box kind="peach" tight><T style={{ fontSize: 13 }}>이번이 마지막 회차예요. 재예약 여부는 운영자가 알려 드립니다.</T></Box>}
      <Btn label="제출하기" disabled={!valid} onPress={submit} />
      <T v="fine">제출하면 이달 확정 금액에 더해지고, 그 뒤에는 추가 메모만 쓸 수 있습니다.</T>
    </Screen>
  );
}
