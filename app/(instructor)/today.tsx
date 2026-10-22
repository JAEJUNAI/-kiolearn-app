// T3 홈(오늘). 세션 상태에 따라 주 버튼이 하나씩 바뀐다: 전화 → 출발 → 도착 → 수업 카드 → 리포트 → 종료
import React, { useEffect, useState } from 'react';
import { View, Alert, Linking, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Screen, T, Row, Grow, Avatar, Box, Chip, Btn, Check, Tile, KV, Empty } from '../../src/ui';
import { useStore, sel } from '../../src/data/store';
import { fmtDT, fmtTime, remain, won, ymd } from '../../src/lib/fmt';

export default function Today() {
  const r = useRouter(); const s = useStore(); const me = sel.me(s);
  const [, tick] = useState(0); useEffect(() => { const t = setInterval(() => tick((x) => x + 1), 30000); return () => clearInterval(t); }, []);
  const todayKey = ymd(new Date());
  const mine = sel.mySessions(s);
  const today = mine.filter((x) => ymd(x.scheduledAt) === todayKey && !['cancelled', 'done', 'no_show', 'early_end'].includes(x.status)).sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  const tomorrow = mine.filter((x) => { const d = new Date(); d.setDate(d.getDate() + 1); return ymd(x.scheduledAt) === ymd(d) && x.status === 'scheduled'; });
  const reqs = sel.myAssignments(s);
  const month = new Date().toISOString().slice(0, 7);
  const confirmed = s.payouts.filter((p) => p.instructorId === me.id && p.month === month).reduce((a, b) => a + b.amount, 0);
  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7)); weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 7);
  const weekCount = mine.filter((x) => new Date(x.scheduledAt) >= weekStart && new Date(x.scheduledAt) < weekEnd && x.status !== 'cancelled').length;
  const callsLeft = mine.filter((x) => x.status === 'scheduled' && new Date(x.scheduledAt) > new Date() && new Date(x.scheduledAt) < weekEnd).length;

  const callSheet = (sid: string, phone = '010-0000-0000') => Alert.alert('어르신께 전화', `${phone}로 전화를 겁니다. 통화 결과를 알려 주세요.`, [
    { text: '통화함', onPress: () => s.confirmCall(sid) }, { text: '통화 안 됨', onPress: () => s.callFailed(sid) }, { text: '닫기', style: 'cancel' }]);
  const arrive = async (sid: string) => {
    let dist: number | undefined;
    try {
      if (Platform.OS !== 'web') { const p = await Location.requestForegroundPermissionsAsync(); if (p.granted) { await Location.getCurrentPositionAsync({}); dist = 80; } }
      else dist = 80;
    } catch { dist = undefined; }
    if (dist === undefined || dist > 200) {
      Alert.alert('위치가 다릅니다', '그래도 도착 처리할까요? 사유를 골라 주세요.', [{ text: '주소 오류', onPress: () => s.arrive(sid, dist, '주소 오류') }, { text: '위치 안 잡힘', onPress: () => s.arrive(sid, dist, '위치 안 잡힘') }, { text: '기타', onPress: () => s.arrive(sid, dist, '기타') }, { text: '닫기', style: 'cancel' }]);
    } else s.arrive(sid, dist);
  };

  return (
    <Screen>
      <Row><Grow><T v="cap">{fmtDT(new Date(), false)}</T><T v="ttl">{me.name.slice(1)} 님,{'\n'}오늘 수업 {today.length}건</T></Grow><Avatar src={me.photo} /></Row>
      {!me.settings.enabled && <Box kind="peach" tight><Row><Grow><T b style={{ fontSize: 13 }}>배정 받기가 꺼져 있어요</T><T v="cap">활동 설정을 켜면 요청이 옵니다</T></Grow><Chip label="활동 설정" kind="dark" onPress={() => r.push('/instructor/settings')} /></Row></Box>}

      {today.length === 0 && tomorrow.length === 0 && <Empty text="배정 요청이 오면 여기에 보입니다." />}

      {today.map((ses) => {
        const rec = s.recipients.find((x) => x.id === ses.recipientId)!; const st = ses.status;
        const arrivedMin = ses.arrivedAt ? (Date.now() - new Date(ses.arrivedAt).getTime()) / 60000 : 0;
        return (
          <Box key={ses.id} kind="white">
            <Chip label={fmtTime(ses.scheduledAt)} kind="dark" />
            <T v="h" style={{ fontSize: 16, marginTop: 6 }}>{rec.name} {rec.honorific} · {ses.seq}회차</T>
            <T v="cap">{rec.sigungu.split(' ').pop()} {rec.dong} · {ses.topic}</T>
            <View style={{ marginTop: 10 }}>
              {ses.confirmedAt ? <Check label="전날 전화 완료" sub={fmtDT(ses.confirmedAt)} /> : ses.callFailedAt ? <Check state="now" label="통화 안 됨 · 보호자에게 알림" /> : <Check state="off" label="전날 전화 전" />}
              {ses.departedAt && <View style={{ height: 8 }} />}
              {ses.departedAt && <Check label={`출발 ${fmtTime(ses.departedAt)}`} />}
              {ses.arrivedAt && <View style={{ height: 8 }} />}
              {ses.arrivedAt && <Check label={`도착 ${fmtTime(ses.arrivedAt)}${ses.arriveReason ? ` · ${ses.arriveReason}` : ''}`} />}
            </View>
            <Row style={{ marginTop: 12 }}>
              {st === 'scheduled' && <><Btn label="어르신께 전화" grow onPress={() => callSheet(ses.id)} /><Btn label="수업 카드" kind="ghost" size="sm" style={{ height: 50 }} onPress={() => r.push(`/instructor/lesson/${ses.id}`)} /></>}
              {st === 'confirmed' && <><Btn label="출발" grow onPress={() => s.depart(ses.id)} /><Btn label="수업 카드" kind="ghost" size="sm" style={{ height: 50 }} onPress={() => r.push(`/instructor/lesson/${ses.id}`)} /></>}
              {st === 'departed' && <Btn label="도착" grow onPress={() => arrive(ses.id)} />}
              {st === 'arrived' && <><Btn label="수업 카드 열기" grow onPress={() => { s.startLesson(ses.id); r.push(`/instructor/lesson/${ses.id}`); }} />{arrivedMin >= 15 && <Btn label="만나지 못함" kind="danger" size="sm" style={{ height: 50 }} onPress={() => Alert.alert('만나지 못했나요', '15분 기다렸고 연락이 안 되면 눌러 주세요. 보호자에게 바로 알립니다.', [{ text: '아니오' }, { text: '네', onPress: () => s.noShow(ses.id) }])} />}</>}
              {st === 'in_progress' && <><Btn label="수업 카드" kind="ghost" grow onPress={() => r.push(`/instructor/lesson/${ses.id}`)} /><Btn label="리포트 쓰기" grow onPress={() => r.push(`/instructor/report/${ses.id}`)} /></>}
              {st === 'submitted' && <Btn label="종료" grow onPress={() => { s.finishSession(ses.id); s.toast('수고하셨어요. 정산에 반영됐습니다.'); }} />}
            </Row>
            {st === 'arrived' && arrivedMin < 15 && <T v="fine" style={{ marginTop: 8 }}>문을 안 여시면 15분 뒤 "만나지 못함" 버튼이 생깁니다.</T>}
          </Box>
        );
      })}

      {tomorrow.map((ses) => { const rec = s.recipients.find((x) => x.id === ses.recipientId)!; return (
        <Box key={ses.id} tight><Row><Grow><T v="cap">내일 {fmtTime(ses.scheduledAt)}</T><T b style={{ fontSize: 14 }}>{rec.name} {rec.honorific} · {ses.seq}회차</T><T v="cap">오늘 저녁 전화 확인</T></Grow><Btn label="전화" size="sm" onPress={() => callSheet(ses.id)} /></Row></Box>); })}

      {reqs.length > 0 && (() => { const a = reqs[0]; const rec = s.recipients.find((x) => x.id === a.recipientId)!; const p = s.passes.find((x) => x.id === a.passId)!; return (
        <Tile title={`새 배정 요청 ${reqs.length}건`} text={`${rec.dong} · ${p.slot1 ? fmtDT(p.slot1.date + 'T00:00:00', false) : ''} ${p.slot1 ? { am: '오전', pm: '오후', eve: '저녁' }[p.slot1.slot] : ''} · 남은 시간 ${remain(a.expiresAt)}`} obj="icBell" />
      ); })()}
      {reqs.length > 0 && <Btn label="요청 보기" kind="ghost" onPress={() => r.push(`/instructor/assignment/${reqs[0].id}`)} />}

      <Box tight>
        <KV first k="이번 주" v={`수업 ${weekCount}회 · 전화 ${callsLeft}통 남음`} />
        <KV k="이달 확정" v={`${won(confirmed)} · 다음 달 10일 입금`} onPress={() => r.push('/(instructor)/payout')} />
      </Box>
      {Platform.OS === 'web' && <T v="fine">웹에서는 위치 확인을 건너뜁니다.</T>}
      {!!Linking && null}
    </Screen>
  );
}
