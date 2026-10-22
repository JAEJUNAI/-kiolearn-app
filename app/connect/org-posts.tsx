// K2 기관 공지 (1차는 읽기, 신청은 기관 전화로)
import React from 'react';
import { Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Nav, T, Row, Grow, Icon, Hero, Box, KV, Chip, Btn } from '../../src/ui';
import { useStore } from '../../src/data/store';

export default function OrgPosts() {
  const r = useRouter(); const s = useStore(); const org = s.orgs.find((o) => o.id === s.linkedOrgId);
  if (!org) return <Screen><Nav title="기관 공지" /><T v="sub">연결된 기관이 없어요.</T><Btn label="기관 연결하기" onPress={() => r.replace('/connect/org')} /></Screen>;
  const [hero, ...rest] = org.posts;
  const call = (phone?: string) => phone && Linking.openURL(`tel:${phone}`).catch(() => s.toast(phone));
  return (
    <Screen>
      <Nav title="내 기관" />
      <Row><Grow><T v="cap">내 기관</T><T v="ttl" style={{ fontSize: 20 }}>{org.name}</T></Grow><Icon src="icOrg" size={52} /></Row>
      {hero && <Hero src="cls" title={hero.title} sub={hero.when} ratio={16 / 8} />}
      <Box kind="white" style={{ paddingVertical: 2 }}>
        {rest.map((p, i) => <KV key={p.id} first={i === 0} k={<T b style={{ fontSize: 13.5 }}>{p.title}</T>} sub={`${p.when}${p.place ? ` · ${p.place}` : ''}`} right={p.apply ? <Chip label="신청" kind="dark" onPress={() => call(p.phone)} /> : <Chip label="읽기만" kind="gray" />} style={{ paddingVertical: 12 }} />)}
      </Box>
      <T v="fine">신청을 누르면 기관으로 전화가 연결됩니다. 앱 안 신청은 다음 버전에 열립니다.</T>
    </Screen>
  );
}
