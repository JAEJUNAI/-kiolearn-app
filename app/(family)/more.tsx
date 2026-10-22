// G9 설정(더보기)
import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, T, Row, Grow, Avatar, ModTile, Box, KV, Toggle, Chip, Input, Btn } from '../../src/ui';
import { useStore, sel } from '../../src/data/store';
import { C } from '../../src/theme';
import { Alert as RNAlert } from 'react-native';
import { setToken, api } from '../../src/lib/supabase';

export default function More() {
  const r = useRouter(); const s = useStore(); const rec = sel.myRecipient(s);
  const [n1, setN1] = useState(true); const [n2, setN2] = useState(true);
  const change = () => Alert.alert('강사 변경 요청', '사유를 골라 주세요. 강사에게는 알리지 않습니다.', [
    { text: '성격이 안 맞음', onPress: () => done('성격') }, { text: '시간이 안 맞음', onPress: () => done('시간') }, { text: '기타', onPress: () => done('기타') }, { text: '취소', style: 'cancel' }]);
  const done = (why: string) => { s.ticket('change_instructor', why); s.toast('운영자가 1영업일 안에 전화드립니다.'); };
  const del = () => {
    const active = s.passes.some((p) => p.recipientId === rec.id && ['paid', 'active'].includes(p.status) && p.remaining > 0);
    if (active) return Alert.alert('남은 회차가 있어요', '환불하거나 다른 가족에게 양도한 뒤 삭제할 수 있어요.');
    Alert.alert('계정을 삭제할까요', '30일 뒤 완전히 지워집니다.', [{ text: '아니오' }, { text: '삭제', style: 'destructive', onPress: () => { api('auth', { op: 'delete' }); setToken(''); s.logout(); r.replace('/login'); } }]);
  };
  const roles = s.account.roles;
  const [certInput, setCertInput] = useState(''); const [certOpen, setCertOpen] = useState(false); const [certBusy, setCertBusy] = useState(false);
  const claim = async () => {
    setCertBusy(true); const out = (await api('auth', { op: 'claim-cert', cert_no: certInput })) as { ok: boolean; error?: string; instructor?: { name: string; certNo: string }; account?: { roles: string[] } };
    setCertBusy(false);
    if (!out.ok || !out.instructor) return RNAlert.alert('등록할 수 없어요', out.error ?? '자격번호를 확인해 주세요.');
    s.loginServer({ phone: s.account.phone, name: s.account.name, roles: (out.account?.roles as string[]) ?? [...roles, 'instructor'], instructor: out.instructor });
    setCertOpen(false); s.toast('강사 자격이 등록됐어요. 강사 모드로 열립니다.'); r.replace('/(instructor)/today');
  };
  return (
    <Screen>
      <Row><Avatar src={s.account.photo ?? 'teacher3'} size={48} /><Grow><T v="h" style={{ fontSize: 16 }}>{s.account.name} 님</T><T v="cap">010-{s.account.phone.slice(3, 7)}-**** · {rec.honorific} 1명 연결</T></Grow>
        {roles.includes('instructor') && <Chip label="강사 모드" kind="line" big onPress={() => { s.setMode('instructor'); r.replace('/(instructor)/today'); }} />}
      </Row>
      <Row style={{ gap: 8 }}>
        <ModTile src="icGift" label="효도권 코드" onPress={() => r.push('/connect/gift')} />
        <ModTile src="icOrg" label="기관 연결" onPress={() => r.push('/connect/org')} />
        <ModTile src="icWork" label="강사 지원" onPress={() => r.push('/connect/jobs')} />
      </Row>
      <Box kind="white" style={{ paddingVertical: 2 }}>
        <KV first k="리포트 도착 알림" right={<Toggle on={n1} onChange={setN1} />} style={{ paddingVertical: 12 }} />
        <KV k="수업 전날 안내" right={<Toggle on={n2} onChange={setN2} />} style={{ paddingVertical: 12 }} />
        <KV k="영수증 · 결제 내역" onPress={() => s.toast('결제 내역은 토스페이먼츠 영수증으로 열립니다.')} style={{ paddingVertical: 12 }} />
        <KV k="가족 초대 · 권한" onPress={() => r.push('/family/invite')} style={{ paddingVertical: 12 }} />
        <KV k={<T b style={{ fontSize: 13.5 }}>강사 변경 요청</T>} sub="운영자가 전화로 사정을 듣고 바꿔드려요" onPress={change} style={{ paddingVertical: 12 }} />
        <KV k="어르신 정보 수정" onPress={() => r.push('/family/profile')} style={{ paddingVertical: 12 }} />
        {!roles.includes('instructor') && <KV k={<T b style={{ fontSize: 13.5 }}>강사 자격번호 등록</T>} sub="학습실에서 받은 KL-DC-… 번호" onPress={() => setCertOpen(!certOpen)} style={{ paddingVertical: 12 }} />}
        {certOpen && <View style={{ paddingVertical: 8, gap: 8 }}><Input value={certInput} onChangeText={(v) => setCertInput(v.toUpperCase())} placeholder="KL-DC-2026-0000" autoCapitalize="characters" /><Btn label="등록" size="sm" disabled={certInput.length < 10 || certBusy} onPress={claim} style={{ alignSelf: 'flex-end' }} /></View>}
        <KV k="배우고, 일로 잇기 (과정)" onPress={() => r.push('/courses')} style={{ paddingVertical: 12 }} />
      </Box>
      <Box style={{ paddingVertical: 2 }}>
        <KV first k="이용약관 · 개인정보" onPress={() => s.toast('kiolearn.co.kr/visit-terms')} style={{ paddingVertical: 12 }} />
        <KV k="활동 모드로 보기 (부모님 폰)" onPress={() => { s.setMode('senior'); r.replace('/(senior)/today'); }} style={{ paddingVertical: 12 }} />
        <KV k="로그아웃" onPress={() => { setToken(''); s.logout(); r.replace('/login'); }} style={{ paddingVertical: 12 }} />
        <KV k={<T style={{ color: C.danger, fontSize: 13.5 }}>계정 삭제</T>} onPress={del} style={{ paddingVertical: 12 }} />
        <KV k={<T v="cap">개발용: 데이터 초기화</T>} onPress={() => { s.reset(); r.replace('/login'); }} style={{ paddingVertical: 12 }} />
      </Box>
      <View style={{ height: 10 }} />
    </Screen>
  );
}
