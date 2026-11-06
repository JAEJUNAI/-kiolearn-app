// G2 어르신 정보. 양가 부모님처럼 여러 분을 등록하고 위 띠에서 바꿔 가며 고친다. 모든 칸은 선택.
import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Screen, Nav, T, Input, Chips, Chip, Btn, Row, Toggle, Grow } from '../../src/ui';
import { useStore, sel } from '../../src/data/store';
import { Recipient } from '../../src/data/types';
import { pushProfile, deleteRecipient } from '../../src/lib/profile';
import { RecipientBar, recipientLabel } from '../../src/components/RecipientBar';

const WHO = ['어머님', '아버님', '장모님', '장인어른', '시어머님', '시아버님', '할머님', '할아버님', '본인'];
const PAINS = ['은행 앱', '키오스크', '사진 보내기', '병원 예약', '사기 문자', '영상통화', '지도·길 찾기'];

export default function Profile() {
  const s = useStore(); const rec = sel.myRecipient(s); const { new: isNew } = useLocalSearchParams<{ new?: string }>();
  return (
    <Screen>
      <Nav title={isNew ? '어르신 추가' : '어르신 정보'} right={<T v="cap">{rec?.consultDoneAt ? '상담 완료' : '작성 중'}</T>} />
      <RecipientBar />
      {rec && <Form key={rec.id} rec={rec} count={s.recipients.length} />}
    </Screen>
  );
}

function Form({ rec, count }: { rec: Recipient; count: number }) {
  const r = useRouter(); const s = useStore();
  const [f, setF] = useState({ honorific: rec.honorific === '부모님' ? '' : rec.honorific, name: rec.name, sigungu: rec.sigungu, dong: rec.dong, addressDetail: rec.addressDetail ?? '', deviceBrand: rec.deviceBrand ?? '', pains: rec.pains, photoConsent: !!rec.photoConsent });
  const [busy, setBusy] = useState(false);
  // 예약(배정)에는 시·구, 동, 상세 주소가 필요하다.
  const forBooking = !!f.sigungu && !!f.dong && !!f.addressDetail;
  const save = async () => {
    setBusy(true);
    s.saveRecipient(rec.id, { ...f, honorific: f.honorific || '부모님', honorificTeacher: rec.honorificTeacher });
    const out = await pushProfile({ recipientId: rec.id }); setBusy(false);
    s.toast(out.ok ? '저장했어요.' : '이 기기에는 저장했어요. 서버 저장은 다시 시도해 주세요.');
    r.canGoBack() ? r.back() : r.replace('/');
  };
  const remove = () => Alert.alert(`${recipientLabel(rec)} 정보를 지울까요`, '다른 가족이 같이 보고 있으면 그 가족에게는 남습니다.', [
    { text: '아니오' },
    { text: '지우기', style: 'destructive', onPress: async () => { const out = await deleteRecipient(rec.id); if (!out.ok) return Alert.alert('지울 수 없어요', out.error ?? ''); s.toast('지웠어요.'); } },
  ]);
  return (
    <>
      <View><T v="lbl">누구신가요</T><Chips>{WHO.map((w) => <Chip key={w} big label={w} kind="line" sel={f.honorific === w} onPress={() => setF({ ...f, honorific: f.honorific === w ? '' : w })} />)}</Chips></View>
      <Row style={{ gap: 8 }}>
        <View style={{ width: 110 }}><T v="lbl">호칭 직접</T><Input value={f.honorific} onChangeText={(v) => setF({ ...f, honorific: v })} placeholder="예: 큰어머님" maxLength={12} /></View>
        <Grow><T v="lbl">성함</T><Input value={f.name} onChangeText={(v) => setF({ ...f, name: v })} placeholder="예: 김옥순" maxLength={20} /></Grow>
      </Row>
      <Row style={{ gap: 8 }}>
        <Grow><T v="lbl">시·구</T><Input value={f.sigungu} onChangeText={(v) => setF({ ...f, sigungu: v })} placeholder="예: 서울 양천구" /></Grow>
        <Grow><T v="lbl">동</T><Input value={f.dong} onChangeText={(v) => setF({ ...f, dong: v })} placeholder="예: 목1동" /></Grow>
      </Row>
      <View><T v="lbl">상세 주소 <T v="cap">강사에게는 수업을 수락한 뒤에만 보여요</T></T><Input value={f.addressDetail} onChangeText={(v) => setF({ ...f, addressDetail: v })} placeholder="도로명, 동·호수, 공동현관 번호" /></View>
      <View><T v="lbl">쓰시는 휴대폰</T><Chips>{['갤럭시 S', '갤럭시 A', '아이폰', '기타·모름'].map((k) => <Chip key={k} big label={k} kind="line" sel={f.deviceBrand === k} onPress={() => setF({ ...f, deviceBrand: f.deviceBrand === k ? '' : k })} />)}</Chips></View>
      <View><T v="lbl">가장 불편한 것</T><Chips>{PAINS.map((p) => <Chip key={p} big label={p} kind="line" sel={f.pains.includes(p)} onPress={() => setF({ ...f, pains: f.pains.includes(p) ? f.pains.filter((x) => x !== p) : [...f.pains, p] })} />)}</Chips></View>
      {!!rec.opsMemo && <View><T v="lbl">운영자 메모 <T v="cap">상담 통화 뒤 운영자가 적습니다</T></T><Input ro value={rec.opsMemo} multiline /></View>}
      <Row><Grow><T b style={{ fontSize: 14 }}>사진에 얼굴이 나와도 괜찮아요</T><T v="cap">아니면 손과 화면만 찍습니다</T></Grow><Toggle on={f.photoConsent} onChange={(v) => setF({ ...f, photoConsent: v })} /></Row>
      <View><T v="lbl">결과 받을 가족</T><Chips>{rec.guardians.map((g, i) => <Chip key={g.accountId || g.name + i} big label={`${g.relation === '나' ? (g.name && g.name !== '나' ? `${g.name} (나)` : '나') : `${g.name || '가족'}${g.relation ? ` (${g.relation})` : ''}`} · ${g.canPay ? '결제·열람' : g.smsOnly ? '문자' : '열람'}`} kind={g.isPrimary ? 'dark' : 'gray'} />)}<Chip big label="+ 가족 초대" kind="line" onPress={() => r.push('/family/invite')} /></Chips></View>
      {!forBooking && <T v="cap">수업 예약에는 시·구, 동, 상세 주소가 필요해요. 지금은 아는 것만 저장해도 됩니다.</T>}
      <Btn label={busy ? '저장 중…' : '저장하기'} disabled={busy} onPress={save} />
      {count > 1 && <Btn label="이 분 정보 지우기" kind="ghost" onPress={remove} />}
    </>
  );
}
