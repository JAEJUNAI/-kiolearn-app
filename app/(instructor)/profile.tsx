// T10 프로필 (보호자에게 보이는 그대로 미리보기)
import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, T, Row, Grow, Avatar, Chips, Chip, Box, KV, Btn, Input } from '../../src/ui';
import { useStore, sel } from '../../src/data/store';
import { setToken } from '../../src/lib/supabase';

export default function Profile() {
  const r = useRouter(); const s = useStore(); const me = sel.me(s);
  const [edit, setEdit] = useState(false); const [intro, setIntro] = useState(me.intro);
  return (
    <Screen>
      <Row><Avatar src={me.photo} size={76} /><Grow><T v="h" style={{ fontSize: 18 }}>{me.name}</T><Chips style={{ marginTop: 4 }}><Chip label="디지털 돌봄강사" /><Chip label={`${me.grade}단계`} kind="gray" /></Chips><T v="cap">{me.sigungu} · {me.sinceLabel}</T></Grow></Row>
      <Box tight>
        <KV first k="배정" v={`${me.stats.assigned}회`} />
        <KV k="재예약" v={`${me.stats.rebooked}건`} />
        <KV k="자격·보험" v="서류 3종 · 배상책임보험" />
        <KV k="자격번호" v={me.certNo} />
      </Box>
      <View>
        <T v="lbl">보호자에게 이렇게 보여요</T>
        <Box kind="white">
          <Row><Avatar src={me.photo} /><Grow><T b>{me.name} 강사</T><T v="cap">{me.sigungu} · 재예약 {me.stats.rebooked}건 · 자격 확인{me.grade === 3 ? ' · 경험 많은 강사' : ''}</T></Grow></Row>
          {edit ? <Input value={intro} onChangeText={(v) => setIntro(v.slice(0, 80))} multiline placeholder="한 줄 소개 (20~80자)" style={{ marginTop: 10 }} /> : <T v="sub" style={{ marginTop: 10 }}>"{me.intro || '한 줄 소개를 적어 주세요.'}"</T>}
        </Box>
      </View>
      <Row>
        <Btn label={edit ? '저장' : '사진 · 소개 수정'} kind={edit ? 'primary' : 'ghost'} size="sm" grow onPress={() => { if (edit) { s.updateIntro(intro); s.toast('저장했어요.'); } setEdit(!edit); }} />
        <Btn label="활동 설정" kind="ghost" size="sm" grow onPress={() => r.push('/instructor/settings')} />
      </Row>
      <T v="fine">이름, 사진, 한 줄 소개, 재예약 수, 자격 확인 표시만 보호자에게 보입니다. 전화번호와 주소, 수업 수, 평가 비율은 보이지 않습니다.</T>
      <Box style={{ paddingVertical: 2 }}>
        {s.account.roles.includes('family') && <KV first k="가족 모드로 보기" onPress={() => { s.setMode('family'); r.replace('/(family)/home'); }} style={{ paddingVertical: 12 }} />}
        <KV first={!s.account.roles.includes('family')} k="배우고, 일로 잇기 (과정)" onPress={() => r.push('/courses')} style={{ paddingVertical: 12 }} />
        <KV k="수료증 · 출강 자격" onPress={() => r.push('/courses/certs')} style={{ paddingVertical: 12 }} />
        <KV k="로그아웃" onPress={() => { setToken(''); s.logout(); r.replace('/login'); }} style={{ paddingVertical: 12 }} />
      </Box>
    </Screen>
  );
}
