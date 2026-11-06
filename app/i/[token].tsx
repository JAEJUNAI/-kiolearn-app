// 가족 초대 링크 https://app.kiolearn.co.kr/i/<토큰>
// 토큰을 기억해 두고 로그인으로 보낸다. 로그인이 끝나면 login.tsx가 초대를 수락한다.
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen, T, Btn, Icon } from '../../src/ui';
import { useStore } from '../../src/data/store';
import { savePendingInvite, acceptPendingInvite } from '../../src/lib/profile';

export default function InviteLanding() {
  const { token } = useLocalSearchParams<{ token: string }>(); const r = useRouter();
  const loggedIn = useStore((s) => s.loggedIn); const demo = useStore((s) => s.demo);
  useEffect(() => {
    if (!token) return;
    savePendingInvite(String(token)).then(async () => {
      if (loggedIn && demo === false) { const msg = await acceptPendingInvite(); if (msg) useStore.getState().toast(msg); r.replace('/'); }
    });
  }, [token]);
  return (
    <Screen>
      <View style={{ alignItems: 'center', paddingTop: 24 }}><Icon src="icFamily" size={110} /></View>
      <T v="ttl" style={{ textAlign: 'center' }}>가족이 부모님 수업 소식을{'\n'}같이 받자고 초대했어요</T>
      <T v="sub" style={{ textAlign: 'center' }}>전화번호로 로그인하면 바로 연결돼요. 수업 일정과 그날 결과를 같은 시간에 받아요.</T>
      <Btn label="전화번호로 시작하기" onPress={() => r.replace({ pathname: '/login', params: { invite: String(token || '') } })} />
    </Screen>
  );
}
