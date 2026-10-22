// W1 일자리 안내 → 지원하면 학습실(웹)로
import React from 'react';
import { Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Nav, T, Hero, Box, KV, Chips, Chip, Btn } from '../../src/ui';
import { useStore } from '../../src/data/store';

export default function Jobs() {
  const r = useRouter(); const s = useStore(); const org = s.orgs.find((o) => o.id === s.linkedOrgId);
  const apply = () => { s.ticket('seeker_apply', org?.code ?? ''); const url = `https://kiolearn.co.kr/teach${org ? `?ref=${encodeURIComponent(org.name)}` : ''}`; Linking.openURL(url).catch(() => s.toast(url)); };
  return (
    <Screen>
      <Nav title="강사 지원" onBack={() => (r.canGoBack() ? r.back() : r.replace('/'))} />
      <Hero src="lesson" title={'동네 어르신 댁에 가서\n스마트폰을 가르치는 일'} />
      <Box kind="white">
        <KV first k="수당" v="회당 40,000원 + 교통비" />
        <KV k="시간" v="90분 · 내가 정한 요일만" />
        <KV k="준비" v="학습실 6모듈 · 서류 3종" />
        <KV k="일감" v="조건 맞는 요청이 앱으로" />
      </Box>
      <Chips><Chip big label="경력 무관" /><Chip big label="50~60대 환영" /><Chip big label="실습·시범 없음" /></Chips>
      {org && <Box kind="peach" tight><T style={{ fontSize: 13 }}>{org.name} 추천으로 들어오셨네요. 지원하면 기관 실적에 자동으로 기록됩니다.</T></Box>}
      <Btn label="지원하고 학습실로" onPress={apply} />
      <Btn label="과정 둘러보기" kind="ghost" onPress={() => r.push('/courses')} />
      <T v="fine">서류 3종(자격증, 신분증, 범죄경력 회보서)을 올리면 자격번호가 발급되고 강사 앱이 열립니다.</T>
    </Screen>
  );
}
