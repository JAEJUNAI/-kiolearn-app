// A1 내 페이지 (어르신 본인). 자랑 창, 설정 없음, 글씨 크게.
import React from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Screen, T, Row, Grow, Avatar, Chip, Cert, Icon, Box, KV } from '../../src/ui';
import { useStore, sel } from '../../src/data/store';
import { IMG, C } from '../../src/theme';

export default function Me() {
  const r = useRouter(); const s = useStore(); const rec = sel.myRecipient(s); const org = s.orgs.find((o) => o.id === rec.orgId);
  const reps = sel.reportsOf(s, rec.id); const solo = reps.reduce((a, x) => a + x.checks.length, 0) + s.missions.filter((m) => m.doneAt).length; const firsts = reps.reduce((a, x) => a + x.checks.filter((c) => c.first).length, 0);
  const photos = reps.filter((x) => x.photo).slice(0, 3);
  return (
    <Screen>
      <Row><Avatar src="seniorMan" size={76} /><Grow><T v="ttl" style={{ fontSize: 24 }}>{rec.name}</T>{org && <Chip label={org.name} kind="gray" big />}</Grow></Row>
      {s.certificates.length > 0 ? s.certificates.map((c) => (
        <Cert key={c.id} style={{ padding: 14, alignItems: 'stretch' }}><Row><Icon src="icCert" size={44} /><Grow><T v="h">{c.course} 수료</T><T v="cap">{c.issuedAt.slice(0, 7).replace('-', '년 ')}월 · {c.issuer}</T></Grow></Row></Cert>
      )) : (
        <Cert style={{ padding: 14, alignItems: 'stretch' }}><Row><Icon src="icCert" size={44} /><Grow><T v="h">스마트폰 기초 8주 수료</T><T v="cap">2026년 9월 · 복지관 과정</T></Grow></Row></Cert>
      )}
      <Box kind="white" tight><Row><Grow><T v="h" style={{ fontSize: 17 }}>혼자 해낸 것 {solo}개</T><T v="cap" style={{ fontSize: 13.5 }}>처음 성공 {firsts}번{reps[0] ? ` · 마지막은 ${reps[0].date.slice(5, 10).replace('-', '/')}` : ''}</T></Grow><Chip label="+1" /></Row></Box>
      <View>
        <T v="lbl" style={{ fontSize: 14 }}>내 사진</T>
        <Row style={{ gap: 6 }}>{photos.map((x) => <Image key={x.id} source={IMG[x.photo!]} style={{ flex: 1, aspectRatio: 1, borderRadius: 12 }} contentFit="cover" />)}{photos.length === 0 && <T v="sub">수업 사진이 여기에 쌓입니다.</T>}</Row>
      </View>
      <Row><T v="lbl" style={{ marginBottom: 0, fontSize: 14 }}>가족</T><Grow /><Row style={{ gap: 0 }}>{rec.guardians.filter((g) => !g.smsOnly).map((g, i) => <View key={g.name} style={{ marginLeft: i ? -12 : 0, borderWidth: 2, borderColor: '#fff', borderRadius: 18 }}><Avatar src={i === 0 ? 'teacher3' : 'teacher2'} size={32} /></View>)}</Row><T v="cap" style={{ fontSize: 13.5 }}>{rec.guardians.filter((g) => !g.smsOnly).map((g) => g.name).join(' · ')}</T></Row>
      <Box style={{ paddingVertical: 2 }}>
        <KV first k={<T style={{ fontSize: 15 }}>가족 모드로 돌아가기</T>} onPress={() => { s.setMode('family'); r.replace('/(family)/home'); }} style={{ paddingVertical: 12 }} />
      </Box>
      <T v="fine" style={{ color: C.muted }}>사진과 수료증은 본인 것입니다. 길게 눌러 지울 수 있어요.</T>
    </Screen>
  );
}
