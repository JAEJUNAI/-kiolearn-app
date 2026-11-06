// 첫 로그인 온보딩: 내 이름과 수업 받을 분 정보. 전부 선택 사항이고 "나중에 할게요"로 넘길 수 있다.
// 여기서 넣지 않은 값은 홈의 "어르신 정보 적기"와 더보기 > 어르신 정보에서 언제든 채운다.
import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Screen, T, Input, Chips, Chip, Btn, Row, Grow, Box, Icon } from '../src/ui';
import { useStore } from '../src/data/store';
import { pushProfile } from '../src/lib/profile';

const WHO = ['어머님', '아버님', '장모님', '장인어른', '시어머님', '시아버님', '할머님', '할아버님', '본인'];
const DEVICE = ['갤럭시 S', '갤럭시 A', '아이폰', '기타·모름'];

export default function Onboarding() {
  // self=1: 로그인에서 "제가 직접 배우고 싶어요"를 고른 분. 수업 받는 분 = 본인.
  const r = useRouter(); const s = useStore(); const rec = s.recipients[0]; const self = useLocalSearchParams<{ self?: string }>().self === '1';
  const [step, setStep] = useState<1 | 2>(1);
  const [myName, setMyName] = useState(s.account.name || '');
  const [f, setF] = useState({ honorific: self ? '본인' : rec?.honorific && rec.honorific !== '부모님' ? rec.honorific : '', name: rec?.name ?? '', sigungu: rec?.sigungu ?? '', dong: rec?.dong ?? '', addressDetail: rec?.addressDetail ?? '', deviceBrand: rec?.deviceBrand ?? '' });
  const [busy, setBusy] = useState(false);

  const done = async (save: boolean) => {
    setBusy(true);
    if (save) s.finishOnboarding({ myName, recipient: { ...f, honorific: f.honorific || '부모님', ...(self ? { name: myName } : {}) } });
    else if (self) s.finishOnboarding({ myName: myName || undefined, recipient: { honorific: '본인', name: myName } });
    else s.finishOnboarding({ myName: myName || undefined });
    await pushProfile({ myName: save || myName ? myName : undefined }).catch(() => {});
    setBusy(false); r.replace('/');
  };

  if (step === 1) return (
    <Screen>
      <Row style={{ justifyContent: 'flex-end' }}><Chip label="나중에 할게요" kind="line" big onPress={() => done(false)} /></Row>
      <View style={{ alignItems: 'center', paddingTop: 6 }}><Icon src="icFamily" size={100} /></View>
      <T v="ttl" style={{ textAlign: 'center' }}>반가워요.{'\n'}어떻게 불러 드릴까요?</T>
      <T v="cap" style={{ textAlign: 'center', marginTop: -6 }}>강사와 운영자가 연락드릴 때 쓰는 이름입니다. 비워 둬도 됩니다.</T>
      <Input value={myName} onChangeText={setMyName} placeholder="이름 (예: 김은희)" maxLength={20} />
      <Btn label="다음" onPress={() => setStep(2)} />
      <T v="fine" style={{ textAlign: 'center' }}>지금 적지 않은 정보는 나중에 더보기에서 언제든 바꿀 수 있어요.</T>
    </Screen>
  );

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}><Chip label="← 이전" kind="line" big onPress={() => setStep(1)} /><Chip label="나중에 할게요" kind="line" big onPress={() => done(false)} /></Row>
      <T v="ttl">{self ? '수업 받으실 곳을\n알려 주세요' : '수업 받으실 분을\n알려 주세요'}</T>
      <T v="cap" style={{ marginTop: -6 }}>아는 것만 적어 주세요. 주소는 예약할 때 다시 여쭙니다.</T>
      {!self && <View><T v="lbl">누구신가요</T><Chips>{WHO.map((w) => <Chip key={w} big label={w} kind="line" sel={f.honorific === w} onPress={() => setF({ ...f, honorific: f.honorific === w ? '' : w })} />)}</Chips></View>}
      {!self && <View><T v="lbl">성함</T><Input value={f.name} onChangeText={(v) => setF({ ...f, name: v })} placeholder="예: 김옥순" maxLength={20} /></View>}
      <Row style={{ gap: 8 }}>
        <Grow><T v="lbl">사는 곳 (시·구)</T><Input value={f.sigungu} onChangeText={(v) => setF({ ...f, sigungu: v })} placeholder="예: 서울 양천구" maxLength={30} /></Grow>
        <Grow><T v="lbl">동</T><Input value={f.dong} onChangeText={(v) => setF({ ...f, dong: v })} placeholder="예: 목1동" maxLength={20} /></Grow>
      </Row>
      <View><T v="lbl">상세 주소 <T v="cap">강사에게는 수업을 수락한 뒤에만 보여요</T></T><Input value={f.addressDetail} onChangeText={(v) => setF({ ...f, addressDetail: v })} placeholder="도로명, 동·호수" maxLength={100} /></View>
      <View><T v="lbl">쓰시는 휴대폰</T><Chips>{DEVICE.map((k) => <Chip key={k} big label={k} kind="line" sel={f.deviceBrand === k} onPress={() => setF({ ...f, deviceBrand: f.deviceBrand === k ? '' : k })} />)}</Chips></View>
      <Btn label={busy ? '저장 중…' : '저장하고 시작하기'} disabled={busy} onPress={() => done(true)} />
      <Box tight><T v="cap">수업을 예약하려면 시·구, 동, 상세 주소가 필요해요. 지금 비워 두면 예약할 때 다시 안내해 드립니다. 양가 부모님처럼 여러 분이면 시작한 뒤 더보기에서 추가할 수 있어요.</T></Box>
    </Screen>
  );
}
