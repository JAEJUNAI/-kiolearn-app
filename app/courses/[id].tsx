// P2 과정 상세·수강 신청
import React from 'react';
import { View, Linking, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen, Nav, T, Chip, Photo, Box, KV, Row, Grow, Btn } from '../../src/ui';
import { useStore } from '../../src/data/store';
import { won } from '../../src/lib/fmt';

export default function CourseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>(); const r = useRouter(); const s = useStore();
  const c = s.courses.find((x) => x.id === id); const en = s.enrollments.find((e) => e.courseId === id);
  if (!c) return <Screen><Nav title="과정" /><T v="sub">과정을 찾을 수 없어요.</T></Screen>;
  const enroll = () => {
    if (c.direct && c.price === 0) { const url = 'https://kiolearn.co.kr/teach-course'; return Linking.openURL(url).catch(() => s.toast(url)); }
    Alert.alert('수강 신청', `${won(c.price)}을 토스페이먼츠로 결제합니다. 첫 회 전까지 전액 환불됩니다.`, [{ text: '아니오' }, { text: '결제', onPress: () => { s.enroll(c.id); s.toast('수강 신청이 됐어요. 기관에서 일정 안내가 갑니다.'); } }]);
  };
  return (
    <Screen>
      <Nav title="과정" right={<Chip label={c.direct ? '직영' : '파트너'} kind={c.direct ? 'dark' : 'peach'} />} />
      <Photo src={c.img} ratio={16 / 9} />
      <View><T v="ttl2">{c.title}</T><T v="cap">{c.provider} · {c.format}{c.place ? ` · ${c.place}` : ''}</T></View>
      <Box kind="white" style={{ paddingVertical: 2 }}>{c.curriculum.map((x, i) => <KV key={x.k} first={i === 0} k={x.k} v={x.v} />)}</Box>
      <Box tight><T v="sub">{c.note ?? `수료하면 "${c.provider} 과정 수료" 수료증이 앱에 발급됩니다. 서류 3종과 학습실 확인 문제까지 통과하면 출강 가능 표시가 붙고 배정 요청을 받습니다.`}</T></Box>
      <Row><Grow><T v="cap">수강료</T><T v="h" style={{ fontSize: 18 }}>{c.price ? won(c.price) : '무료'}</T></Grow>
        {en ? <Row><Chip label={en.status === 'completed' ? '수료' : '수강 중'} kind="ok" big />{en.status === 'paid' && <Btn label="수료 처리 (개발용)" kind="ghost" size="sm" onPress={() => { s.completeCourse(c.id); r.push('/courses/certs'); }} />}</Row> : <Btn label={c.price ? '수강 신청' : '학습실 열기'} style={{ paddingHorizontal: 28 }} onPress={enroll} />}
      </Row>
      <T v="fine">{c.direct ? '키오런이 직접 운영하는 과정입니다.' : '심사를 거친 파트너 기관입니다. 환불은 첫 회 전까지 전액, 이후 기관 규정에 따릅니다.'}</T>
    </Screen>
  );
}
