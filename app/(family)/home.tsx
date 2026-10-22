// G3 홈 + G3-2 배정 중. 회차권 상태에 따라 타일과 카드가 바뀐다.
import React, { useEffect, useState } from 'react';
import { View, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, T, Row, Grow, Avatar, Tile, Box, Chip, ModTile, Photo, Btn, KV, Bar, Icon } from '../../src/ui';
import { useStore, sel } from '../../src/data/store';
import { fmtDT, remain, won, slotLabel } from '../../src/lib/fmt';
import { PRODUCTS } from '../../src/data/types';
import { C, F } from '../../src/theme';

export default function Home() {
  const r = useRouter();
  const s = useStore(); const rec = sel.myRecipient(s); const pass = sel.activePass(s, rec.id);
  const next = sel.nextSession(s, rec.id); const used = sel.usedCount(s, rec.id); const bought = sel.totalBought(s, rec.id);
  const last = sel.reportsOf(s, rec.id)[0]; const teacher = s.instructors.find((i) => i.id === next?.instructorId) ?? s.instructors[0];
  const [, tick] = useState(0); useEffect(() => { const t = setInterval(() => tick((x) => x + 1), 30000); return () => clearInterval(t); }, []);

  const greet = <T v="cap">안녕하세요, {s.account.name} 님</T>;
  const nameLine = `${rec.honorific} 수업`;

  // 상태: 어르신 미등록 / 입금 확인 중 / 배정 중 / 예정·진행 / 소진
  if (!rec.addressDetail) return (
    <Screen>
      {greet}<T v="ttl">{rec.honorific} 정보를{'\n'}먼저 적어 주세요</T>
      <Box kind="white"><T v="sub">주소와 쓰시는 기기, 가장 불편한 것을 적으면 상담 뒤 배정이 시작됩니다.</T><Btn label="어르신 정보 적기" style={{ marginTop: 12 }} onPress={() => r.push('/family/profile')} /></Box>
    </Screen>
  );

  if (pass && (pass.status === 'paid' || pass.status === 'pending_deposit') && !next) {
    const pending = pass.status === 'pending_deposit';
    const over = pass.promiseDueAt ? new Date(pass.promiseDueAt) < new Date() : false;
    return (
      <Screen>
        <Row>{<Grow>{greet}<T v="ttl">{pending ? '입금을\n확인하고 있어요' : `${rec.honorific} 강사를\n찾고 있어요`}</T></Grow>}<Icon src="icCalendar" size={56} /></Row>
        <Tile dark title={pending ? '입금 확인 뒤 72시간' : over ? '운영자가 연락드립니다' : `약속 기한까지 ${remain(pass.promiseDueAt!)}`}
          text={pending ? `${PRODUCTS[pass.product].name} ${won(pass.price)}. 입금이 확인되면 그때부터 72시간 안에 첫 일정이 정해집니다.` : `${fmtDT(pass.promiseDueAt!)}까지 첫 일정이 정해집니다. 안 되면 전액 환불.`}>
          {!pending && !over && <Bar light pct={100 - (new Date(pass.promiseDueAt!).getTime() - Date.now()) / (72 * 36000)} style={{ marginTop: 12 }} />}
        </Tile>
        <Box kind="white">
          <KV first k="희망 일정" v={pass.slot1 ? `${fmtDT(pass.slot1.date + 'T00:00:00', false)} ${slotLabel(pass.slot1.slot)}` : '-'} />
          {pass.slot2 && <KV k="두 번째 희망" v={`${fmtDT(pass.slot2.date + 'T00:00:00', false)} ${slotLabel(pass.slot2.slot)}`} />}
          <KV k="상품" v={`${PRODUCTS[pass.product].name} · ${won(pass.price)}`} />
        </Box>
        {pending
          ? <Box tight><T v="sub">{pass.method === 'vaccount' ? '가상계좌' : '법인 계좌'}로 3일 안에 입금해 주세요. 입금이 확인되면 알려드립니다.</T><Btn label="입금했어요 (개발용 확인)" kind="ghost" size="sm" style={{ marginTop: 10, alignSelf: 'flex-start' }} onPress={() => s.confirmDeposit(pass.id)} /></Box>
          : <Box tight><T v="sub">조건에 맞는 강사에게 요청을 보냈습니다. 정해지면 푸시로 알려드리고, 그 전에 운영자가 전화로 한 번 확인합니다.</T></Box>}
        <Box kind="white" tight><Row><Avatar src="teacher3" size={36} /><Grow><T b style={{ fontSize: 13.5 }}>운영자 상담</T><T v="cap">월~금 10:00~18:00 · 전화 연결</T></Grow><Chip label="전화" kind="line" /></Row></Box>
        {over && !pass.promiseExtended && <Btn label="72시간 더 기다리기" kind="soft" onPress={() => s.extendPromise(pass.id)} />}
        <Btn label={pending ? '주문 취소하기' : '기다리지 않고 환불 받기'} kind="ghost" onPress={() => Alert.alert(pending ? '주문을 취소할까요' : '전액 환불할까요', '첫 수업 전까지는 언제든 전액 환불됩니다.', [{ text: '아니오' }, { text: '네', onPress: () => s.refund(pass.id, pending ? 'cancel_pending' : 'promise') }])} />
        <T v="fine" style={{ textAlign: 'center' }}>첫 수업 전까지는 언제든 전액 환불됩니다.</T>
      </Screen>
    );
  }

  const exhausted = !pass || pass.remaining === 0;
  const inLesson = next && ['arrived', 'in_progress'].includes(next.status);
  const callFailed = next?.callFailedAt && !next.confirmedAt;
  const promo = pass?.product === 'pass3' && used >= 2;
  return (
    <Screen>
      <Row><Grow>{greet}<T v="ttl">{nameLine}{'\n'}{used}회째 진행 중</T></Grow><Pressable onPress={() => r.push('/family/profile')}><Avatar src={teacher.photo} /></Pressable></Row>
      {exhausted
        ? <Tile dark title="남은 회차 0회" text={`지금까지 ${used}회. 이어가시면 같은 강사가 계속 갑니다.`} />
        : <Tile title={'원하시는 날짜에\n강사가 갑니다'} text="결제 뒤 72시간 안에 첫 일정이 정해집니다. 안 되면 전액 환불." pad={15} />}
      {callFailed && <Box kind="peach" tight><T style={{ fontSize: 13 }}>{teacher.name} 강사가 {rec.honorific}과 통화가 안 됩니다. 한 번 연락 부탁드려요.</T></Box>}
      {next && (
        <Pressable onPress={() => !inLesson && r.push(`/family/reschedule/${next.id}`)}>
          <Box kind="white" tight>
            {inLesson
              ? <Row><Grow><T v="cap">지금 수업 중</T><T v="h">{fmtDT(next.arrivedAt!)} 도착</T><T v="cap">끝나면 리포트가 옵니다</T></Grow><Chip label="수업 중" kind="dark" /></Row>
              : <Row><Grow><T v="cap">다음 수업</T><T v="h">{fmtDT(next.scheduledAt)}</T><T v="cap">{teacher.name} 강사 · {next.topic}</T></Grow><Chip label={next.status === 'confirmed' ? '전날 통화 완료' : next.status === 'departed' ? '출발' : next.status === 'submitted' ? '리포트 작성 중' : '배정 완료'} /></Row>}
          </Box>
        </Pressable>
      )}
      {promo && <Box kind="peach" tight><T style={{ fontSize: 13 }}>10회권으로 바꾸면 회당 63,900원. 같은 강사가 계속 갑니다.</T></Box>}
      <Row style={{ gap: 8 }}>
        <ModTile src="icFamily" label="가족" onPress={() => r.push('/family/invite')} />
        <ModTile src="icActivity" label="활동" onPress={() => { s.setMode('senior'); r.replace('/(senior)/today'); }} />
        <ModTile src="icWork" label="일" onPress={() => r.push('/connect/jobs')} />
        <ModTile src="icOrg" label="기관" onPress={() => r.push('/connect/org')} />
      </Row>
      {last ? (
        <Pressable onPress={() => r.push(`/(family)/reports/${last.id}`)}>
          <Row style={{ marginBottom: 6 }}><T v="sub" style={{ fontFamily: F.bold, color: C.fg }}>최근 리포트</T><Grow /><T v="cap">{fmtDT(last.date, false)}</T>{!last.readAt && <Chip label="새 리포트" />}</Row>
          {last.photo ? <Photo src={last.photo} ratio={21 / 9} /> : null}
          <Row style={{ marginTop: 6, flexWrap: 'wrap', gap: 6 }}><T style={{ fontSize: 13.5 }}>{last.checks[0]?.label}{last.checks[0]?.first ? '' : ''}</T>{last.checks.some((c) => c.first) && <Chip label="처음 성공" />}</Row>
        </Pressable>
      ) : <Box tight><T v="sub">첫 수업 뒤 여기에 리포트가 쌓입니다.</T></Box>}
      <Btn label={exhausted ? '이어서 예약하기' : '수업 예약하기'} onPress={() => r.push('/(family)/book')} />
      <View style={{ marginTop: 6 }}><Bar pct={bought ? (used / bought) * 100 : 0} /><T v="cap" style={{ marginTop: 6 }}>{used} / {bought}회 · 남은 회차 {pass?.remaining ?? 0}</T></View>
    </Screen>
  );
}
