// A3 도움 요청: 유료로 넘어가는 문
import React from 'react';
import { Pressable, Alert, View } from 'react-native';
import { Screen, T, Box, Row, Grow, Icon, Tile, Chip } from '../../src/ui';
import { useStore, sel } from '../../src/data/store';
import { sendTicket } from '../../src/lib/profile';

export default function Help() {
  const s = useStore(); const rec = sel.myRecipient(s); const fam = rec.guardians[0]?.name ?? '가족';
  const ask = (kind: '자녀에게 알리기' | '선생님 불러 주세요') => Alert.alert(kind === '자녀에게 알리기' ? `${fam} 님에게 알릴까요` : '선생님을 부를까요', kind === '자녀에게 알리기' ? '운영자가 바로 가족에게 연락해요.' : `남은 회차를 쓰거나 ${fam} 님이 결제한 뒤 찾아가요.`, [{ text: '아니오' }, { text: '네', onPress: async () => { const msg = s.help(kind); const out = await sendTicket(kind === '자녀에게 알리기' ? 'senior_help_family' : 'senior_help_teacher', kind === '자녀에게 알리기' ? '어르신이 "자녀에게 알리기"를 눌렀어요. 가족에게 연락해 주세요.' : '어르신이 "선생님 불러 주세요"를 눌렀어요. 일정 상담이 필요해요.'); s.toast(out.ok ? (kind === '자녀에게 알리기' ? '운영자가 가족에게 바로 알려 드릴게요.' : '운영자가 가족과 일정을 맞춰 연락드릴게요.') : out.error!); void msg; } }]);
  return (
    <Screen>
      <T v="ttl" style={{ fontSize: 26 }}>막히셨나요</T>
      <T v="sub" style={{ fontSize: 16, marginTop: -6 }}>아래 하나만 누르시면 돼요.</T>
      <Pressable onPress={() => ask('자녀에게 알리기')}><Box kind="white" style={{ padding: 18 }}><Row><Icon src="icFamily" size={48} /><Grow><T v="h" style={{ fontSize: 17 }}>자녀에게 알리기</T><T v="cap" style={{ fontSize: 15 }}>운영자가 {fam} 님에게 바로 알려 드려요</T></Grow></Row></Box></Pressable>
      <Pressable onPress={() => ask('선생님 불러 주세요')}><Tile title="선생님 불러 주세요" text={`남은 회차에서 1회를 쓰거나, ${fam} 님이 결제한 뒤 찾아가요`} obj="icBell" /></Pressable>
      <View style={{ height: 4 }} />
      <T v="fine" style={{ fontSize: 15 }}>급한 일은 119나 112에 전화해 주세요. 선생님을 부르면 운영자가 가족에게 먼저 알리고 일정을 잡아 드려요.</T>
    </Screen>
  );
}
