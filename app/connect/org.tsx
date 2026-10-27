// K1 기관 코드 연결 (QR 또는 코드 입력). 코드는 서버(app_orgs)에서 찾고, 예시 데이터 코드는 그대로 보여 준다.
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Nav, T, Input, Box, Row, Grow, Chip, Btn, Icon, Toggle } from '../../src/ui';
import { useStore } from '../../src/data/store';
import { Org } from '../../src/data/types';
import { api } from '../../src/lib/supabase';
import { C } from '../../src/theme';
import { Image } from 'expo-image';
import { IMG } from '../../src/theme';

export default function OrgLink() {
  const r = useRouter(); const s = useStore();
  const [code, setCode] = useState(''); const [consent, setConsent] = useState(false); const [err, setErr] = useState('');
  const [found, setFound] = useState<Org | null>(null); const [busy, setBusy] = useState(false); const [looking, setLooking] = useState(false);
  const linked = s.orgs.find((o) => o.id === s.linkedOrgId);
  const norm = code.toUpperCase().replace(/\s/g, '');

  useEffect(() => {
    setErr(''); const local = s.orgs.find((o) => o.code === norm);
    if (local) { setFound(local); return; }
    if (norm.length < 8) { setFound(null); return; }
    let alive = true; setLooking(true);
    const t = setTimeout(async () => {
      const res = await api<{ org: Org }>('app', { op: 'org-lookup', code: norm });
      if (!alive) return; setLooking(false);
      const org = (res as { org?: Org }).org;
      if (res.ok && org) setFound(org); else { setFound(null); if (norm.length >= 10) setErr(res.error || '코드를 찾을 수 없어요.'); }
    }, 450);
    return () => { alive = false; clearTimeout(t); setLooking(false); };
  }, [norm]);

  const link = async () => {
    if (!found) return; setErr(''); setBusy(true);
    const res = await api('app', { op: 'org-link', code: found.code, consent }); setBusy(false);
    if (!res.ok) { if (!/로그인|토큰|인증/.test(res.error || '')) return setErr(res.error || '연결하지 못했어요. 잠시 후 다시 해 주세요.'); }
    s.setLinkedOrg(found, consent); s.toast(`${found.name}에 연결됐어요.`); r.push('/connect/org-posts');
  };
  const show = found ?? linked;
  return (
    <Screen>
      <Nav title="기관 연결" />
      <T v="ttl" style={{ fontSize: 20 }}>기관에서 받은{'\n'}코드를 넣어 주세요</T>
      <View style={{ alignSelf: 'center', width: 190, aspectRatio: 1, borderRadius: 20, backgroundColor: C.soft, alignItems: 'center', justifyContent: 'center' }}>
        <View pointerEvents="none" style={{ position: 'absolute', top: 18, left: 18, right: 18, bottom: 18, borderWidth: 3, borderColor: C.fg, borderRadius: 14, opacity: 0.9 }} />
        <Icon src="icOrg" size={100} />
      </View>
      <T v="cap" style={{ textAlign: 'center' }}>복지관·센터 안내문에 적힌 코드입니다. QR 읽기는 앱 스토어 버전에서 열립니다</T>
      <Row><T v="cap" style={{ flex: 1, textAlign: 'right' }}>기관 코드</T><Input value={code} onChangeText={(v) => setCode(v.toUpperCase())} placeholder="IC-BPS-2026" autoCapitalize="characters" style={{ flex: 1.4, paddingVertical: 9 }} right={looking ? <T v="cap">확인 중</T> : undefined} /></Row>
      {show && (
        <Box kind="white" tight><Row><Image source={IMG.cls} style={{ width: 52, height: 52, borderRadius: 12 }} contentFit="cover" /><Grow><T b>{show.name}</T><T v="cap">{show.program || show.type}</T></Grow><Chip label={linked && show.id === linked.id ? '연결됨' : '확인'} kind="ok" /></Row></Box>
      )}
      {!!err && <T v="cap" style={{ color: C.danger }}>{err}</T>}
      <Box tight><T v="sub">연결되면 이 기관을 통해 생긴 지원, 수료, 배정, 활동이 매달 기관 담당자에게 숫자로 전달됩니다. 이름과 전화번호는 동의한 범위에서만 갑니다.</T></Box>
      <Row><Grow><T b style={{ fontSize: 13.5 }}>이름·연락처까지 기관에 전달</T><T v="cap">선택. 실적 집계(숫자)는 연결하면 전달됩니다</T></Grow><Toggle on={consent} onChange={setConsent} /></Row>
      <Btn label={busy ? '연결 중' : '이 기관으로 연결하기'} disabled={!found || busy} onPress={link} />
      {linked && <Btn label="기관 공지 보기" kind="ghost" onPress={() => r.push('/connect/org-posts')} />}
    </Screen>
  );
}
