// T2 활동 설정
import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Nav, T, Box, Row, Grow, Toggle, Chips, Chip, Seg, Stepper, Btn, Input } from '../../src/ui';
import { useStore, sel } from '../../src/data/store';

const DONGS = ['목1동', '목2동', '신정동', '염창동', '등촌동', '화곡동', '신월동'];
type Slot = 'am' | 'pm' | 'eve';

export default function Settings() {
  const r = useRouter(); const s = useStore(); const me = sel.me(s);
  const [f, setF] = useState({ ...me.settings }); const [add, setAdd] = useState('');
  const valid = f.dongs.length > 0 && f.weekdays.length > 0 && f.timeslots.length > 0;
  const save = () => { const enabled = f.enabled && valid; s.updateSettings({ ...f, enabled }); s.toast(enabled ? '저장했어요. 조건에 맞는 요청이 옵니다.' : valid ? '저장했어요. 배정 받기는 꺼져 있어요.' : '동네, 요일, 시간대를 하나 이상 골라야 배정을 받을 수 있어요.'); r.back(); };
  return (
    <Screen>
      <Nav title="활동 설정" />
      <Box kind="white" tight><Row><Grow><T b>배정 받기</T><T v="cap">끄면 요청이 오지 않아요</T></Grow><Toggle on={f.enabled} onChange={(v) => setF({ ...f, enabled: v })} /></Row></Box>
      <View><T v="lbl">갈 수 있는 동네 <T v="cap">여러 곳 선택</T></T>
        <Chips>{[...new Set([...DONGS, ...f.dongs])].map((d) => <Chip key={d} big label={d} kind="line" sel={f.dongs.includes(d)} onPress={() => setF({ ...f, dongs: f.dongs.includes(d) ? f.dongs.filter((x) => x !== d) : f.dongs.length < 10 ? [...f.dongs, d] : f.dongs })} />)}</Chips>
        <Input value={add} onChangeText={setAdd} placeholder="다른 동 직접 입력" style={{ marginTop: 8 }} right={<Chip label="추가" kind="dark" onPress={() => { if (add.trim()) { setF({ ...f, dongs: [...new Set([...f.dongs, add.trim()])] }); setAdd(''); } }} />} />
      </View>
      <View><T v="lbl">요일</T><Seg items={[1, 2, 3, 4, 5, 6, 0].map((k) => ({ k: String(k), label: '일월화수목금토'[k] }))} value={f.weekdays.map(String)} onChange={(v) => setF({ ...f, weekdays: v.map(Number) })} /></View>
      <View><T v="lbl">시간대</T><Chips>{([['am', '오전 10~12'], ['pm', '오후 2~5'], ['eve', '저녁 6~8']] as [Slot, string][]).map(([k, l]) => <Chip key={k} big label={l} kind="line" sel={f.timeslots.includes(k)} onPress={() => setF({ ...f, timeslots: f.timeslots.includes(k) ? f.timeslots.filter((x) => x !== k) : [...f.timeslots, k] })} />)}</Chips></View>
      <Row><Grow><T v="lbl" style={{ marginBottom: 0 }}>주 최대 수업</T><T v="cap">넘으면 요청이 멈춰요</T></Grow><Stepper value={f.maxPerWeek} onChange={(v) => setF({ ...f, maxPerWeek: v })} /></Row>
      <Box tight><T v="sub">요청은 조건에 맞는 분 몇 명에게만 갑니다. 24시간 안에 먼저 수락한 분이 맡습니다.</T></Box>
      {!valid && f.enabled && <T v="cap" style={{ color: '#e8551a' }}>동네, 요일, 시간대를 하나 이상 골라야 배정 받기가 켜집니다.</T>}
      <Btn label="저장하기" onPress={save} />
    </Screen>
  );
}
