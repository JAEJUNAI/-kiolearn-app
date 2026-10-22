// A3 도움 요청: 유료로 넘어가는 문
import React from 'react';
import { Pressable, Alert, View } from 'react-native';
import { Screen, T, Box, Row, Grow, Icon, Tile, Chip } from '../../src/ui';
import { useStore, sel } from '../../src/data/store';

export default function Help() {
  const s = useStore(); const rec = sel.myRecipient(s); const fam = rec.guardians[0]?.name ?? '가족';
  const ask = (kind: '자녀에게 알리기' | '선생님 불러 주세요') => Alert.alert(kind === '자녀에게 알리기' ? `${fam} 님에게 알릴까요` : '선생님을 부를까요', kind === '자녀에게 알리기' ? '지금 바로 문자가 갑니다.' : `남은 회차를 쓰거나 ${fam} 님이 결제한 뒤 갑니다.`, [{ text: '아니오' }, { text: '네', onPress: () => s.toast(s.help(kind)) }]);
  return (
    <Screen>
      <T v="ttl" style={{ fontSize: 26 }}>막히셨나요</T>
      <T v="sub" style={{ fontSize: 15, marginTop: -6 }}>아래 하나만 누르시면 됩니다.</T>
      <Pressable onPress={() => ask('자녀에게 알리기')}><Box kind="white" style={{ padding: 18 }}><Row><Icon src="icFamily" size={48} /><Grow><T v="h" style={{ fontSize: 17 }}>자녀에게 알리기</T><T v="cap" style={{ fontSize: 13.5 }}>{fam} 님에게 바로 문자가 갑니다</T></Grow></Row></Box></Pressable>
      <Pressable onPress={() => ask('선생님 불러 주세요')}><Tile title="선생님 불러 주세요" text={`남은 회차에서 1회를 쓰거나, ${fam} 님이 결제한 뒤 갑니다`} obj="icBell" /></Pressable>
      <Box style={{ padding: 18 }}><Row><Icon src="icPhone" size={48} /><Grow><T v="h" style={{ fontSize: 17 }}>이상한 문자 보여 주기</T><Row style={{ flexWrap: 'wrap', gap: 6 }}><T v="cap" style={{ fontSize: 13.5 }}>사진 올리면 사기인지 확인해 드려요</T><Chip label="준비 중" kind="gray" /></Row></Grow></Row></Box>
      <View style={{ height: 4 }} />
      <T v="fine" style={{ fontSize: 13 }}>급한 일은 119 또는 112. 선생님 호출은 가족에게 먼저 알린 뒤 운영자가 일정을 잡습니다.</T>
    </Screen>
  );
}
