// G2 어르신 프로필
import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Nav, T, Input, Chips, Chip, Btn, Row, Toggle, Grow } from '../../src/ui';
import { useStore, sel } from '../../src/data/store';

const PAINS = ['은행 앱', '키오스크', '사진 보내기', '병원 예약', '사기 문자', '영상통화', '지도·길 찾기'];

export default function Profile() {
  const r = useRouter(); const s = useStore(); const rec = sel.myRecipient(s);
  const [f, setF] = useState({ honorific: rec.honorific, name: rec.name, sigungu: rec.sigungu, dong: rec.dong, addressDetail: rec.addressDetail ?? '', deviceBrand: rec.deviceBrand ?? '', pains: rec.pains, photoConsent: !!rec.photoConsent });
  const ok = f.name.length >= 2 && !!f.sigungu && !!f.dong && !!f.deviceBrand;
  const save = () => { s.saveRecipient(rec.id, { ...f, honorificTeacher: rec.honorificTeacher }); s.toast('저장했어요.'); r.back(); };
  return (
    <Screen>
      <Nav title="어르신 정보" right={<T v="cap">{rec.consultDoneAt ? '상담 완료' : '작성 중'}</T>} />
      <Row style={{ gap: 8 }}>
        <View style={{ width: 110 }}><T v="lbl">호칭</T><Input value={f.honorific} onChangeText={(v) => setF({ ...f, honorific: v })} placeholder="어머님" /></View>
        <Grow><T v="lbl">이름</T><Input value={f.name} onChangeText={(v) => setF({ ...f, name: v })} placeholder="성함" /></Grow>
      </Row>
      <Row style={{ gap: 8 }}>
        <Grow><T v="lbl">시·구</T><Input value={f.sigungu} onChangeText={(v) => setF({ ...f, sigungu: v })} placeholder="서울 양천구" /></Grow>
        <Grow><T v="lbl">동</T><Input value={f.dong} onChangeText={(v) => setF({ ...f, dong: v })} placeholder="목1동" right={<T v="cap">동까지만 보여요</T>} /></Grow>
      </Row>
      <View><T v="lbl">상세 주소 <T v="cap">강사에게는 수락 뒤에만 보여요</T></T><Input value={f.addressDetail} onChangeText={(v) => setF({ ...f, addressDetail: v })} placeholder="도로명, 동·호수, 공동현관 번호" /></View>
      <View><T v="lbl">쓰시는 기기</T><Chips>{['갤럭시 S', '갤럭시 A', '아이폰', '기타·모름'].map((k) => <Chip key={k} big label={k} kind="line" sel={f.deviceBrand.startsWith(k.split(' ')[0]) && (k !== '기타·모름' || f.deviceBrand === k)} onPress={() => setF({ ...f, deviceBrand: k })} />)}</Chips></View>
      <View><T v="lbl">가장 불편한 것</T><Chips>{PAINS.map((p) => <Chip key={p} big label={p} kind="line" sel={f.pains.includes(p)} onPress={() => setF({ ...f, pains: f.pains.includes(p) ? f.pains.filter((x) => x !== p) : [...f.pains, p] })} />)}</Chips></View>
      <View><T v="lbl">운영자 메모 <T v="cap">상담 통화 뒤 운영자가 적습니다</T></T><Input ro value={rec.opsMemo ?? ''} placeholder="상담 뒤 운영자가 적습니다" multiline /></View>
      <Row><Grow><T b style={{ fontSize: 13.5 }}>사진에 얼굴이 나와도 괜찮아요</T><T v="cap">아니면 손과 화면만 찍습니다</T></Grow><Toggle on={f.photoConsent} onChange={(v) => setF({ ...f, photoConsent: v })} /></Row>
      <View><T v="lbl">결과 받을 가족</T><Chips>{rec.guardians.map((g) => <Chip key={g.name} big label={`${g.name}${g.relation ? ` (${g.relation})` : ''} · ${g.canPay ? '결제·열람' : g.smsOnly ? '문자' : '열람'}`} kind={g.isPrimary ? 'dark' : 'gray'} />)}<Chip big label="+ 추가" kind="line" onPress={() => r.push('/family/invite')} /></Chips></View>
      <Btn label="저장하기" disabled={!ok} onPress={save} />
    </Screen>
  );
}
