// K1 기관 코드 연결 (QR 또는 코드 입력)
import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Nav, T, Input, Box, Row, Grow, Chip, Btn, Icon, Toggle } from '../../src/ui';
import { useStore } from '../../src/data/store';
import { C } from '../../src/theme';
import { Image } from 'expo-image';
import { IMG } from '../../src/theme';

export default function OrgLink() {
  const r = useRouter(); const s = useStore();
  const [code, setCode] = useState(''); const [consent, setConsent] = useState(false); const [err, setErr] = useState('');
  const linked = s.orgs.find((o) => o.id === s.linkedOrgId); const found = s.orgs.find((o) => o.code === code.toUpperCase().trim());
  const link = () => { const o = s.linkOrg(code, consent); if (!o.ok) return setErr('코드를 찾을 수 없어요. 기관에서 받은 코드를 다시 확인해 주세요.'); s.toast(`${o.org!.name}에 연결됐어요.`); r.push('/connect/org-posts'); };
  return (
    <Screen>
      <Nav title="기관 연결" />
      <T v="ttl" style={{ fontSize: 20 }}>복지관에서 받은{'\n'}QR을 찍어 주세요</T>
      <View style={{ alignSelf: 'center', width: 190, aspectRatio: 1, borderRadius: 20, backgroundColor: C.soft, alignItems: 'center', justifyContent: 'center' }}>
        <View pointerEvents="none" style={{ position: 'absolute', top: 18, left: 18, right: 18, bottom: 18, borderWidth: 3, borderColor: C.fg, borderRadius: 14, opacity: 0.9 }} />
        <Icon src="icOrg" size={100} />
      </View>
      <T v="cap" style={{ textAlign: 'center' }}>카메라로 QR을 비추면 자동으로 읽어요 (웹에서는 코드 입력)</T>
      <Row><T v="cap" style={{ flex: 1, textAlign: 'right' }}>또는 코드 입력</T><Input value={code} onChangeText={(v) => { setCode(v.toUpperCase()); setErr(''); }} placeholder="YC-MOK-2026" autoCapitalize="characters" style={{ flex: 1.4, paddingVertical: 9 }} /></Row>
      {(found ?? linked) && (
        <Box kind="white" tight><Row><Image source={IMG.cls} style={{ width: 52, height: 52, borderRadius: 12 }} contentFit="cover" /><Grow><T b>{(found ?? linked)!.name}</T><T v="cap">{(found ?? linked)!.program}</T></Grow><Chip label={linked && (found ?? linked)!.id === linked.id ? '연결됨' : '확인'} kind="ok" /></Row></Box>
      )}
      {!!err && <T v="cap" style={{ color: C.danger }}>{err}</T>}
      <Box tight><T v="sub">연결되면 이 기관을 통해 생긴 지원, 수료, 배정, 활동이 매달 기관 담당자에게 숫자로 전달됩니다. 이름과 전화번호는 동의한 범위에서만 갑니다.</T></Box>
      <Row><Grow><T b style={{ fontSize: 13.5 }}>이름·연락처까지 기관에 전달</T><T v="cap">선택. 실적 집계(숫자)는 연결하면 전달됩니다</T></Grow><Toggle on={consent} onChange={setConsent} /></Row>
      <Btn label="이 기관으로 연결하기" disabled={!found} onPress={link} />
      {linked && <Btn label="기관 공지 보기" kind="ghost" onPress={() => r.push('/connect/org-posts')} />}
    </Screen>
  );
}
