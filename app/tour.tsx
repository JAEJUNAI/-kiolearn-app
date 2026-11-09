// 둘러보기: 로그인 없이 보는 설명 3장(스토어 심사 대응).
import React from 'react';
import { useRouter } from 'expo-router';
import { Screen, Nav, T, Tile, Box, KV, Btn, Photo, Chips, Chip } from '../src/ui';

export default function Tour() {
  const r = useRouter();
  return (
    <Screen>
      <Nav title="둘러보기" onBack={() => (r.canGoBack() ? r.back() : r.replace('/login'))} />
      <T v="ttl">부모님 곁에 사람을 보내고,{'\n'}그날 저녁 결과를 받아요</T>
      <Photo src="homeLesson" ratio={16 / 9} />
      <Tile title="원하시는 날짜에 강사가 찾아가요" text="결제하면 운영자가 강사와 첫 일정을 맞춰 알려 드려요. 첫 수업 전에는 언제든 전액 환불돼요." />
      <Box kind="white">
        <KV first k="수업" v="90분 · 어르신 댁 1:1" />
        <KV k="강사" v="자격증 · 신분증 확인, 출강 필수 교육 이수" />
        <KV k="리포트" v="수업마다 사진과 결과" />
        <KV k="환불" v="첫 수업 전까지 전액" />
      </Box>
      <T v="h">이런 걸 같이 해 봐요</T>
      <Chips>{['휴대폰 기본', '카카오톡·사진', '키오스크 주문', '은행 앱', '병원 예약', 'AI에게 물어보기'].map((x) => <Chip key={x} label={x} kind="line" big />)}</Chips>
      <T v="h">가격</T>
      <Box>
        <KV first k="첫 체험 1회" v="39,000원" sub="처음 신청하는 가정만 · 11월은 35,000원" />
        <KV k="3회권" v="139,000원" sub="회당 46,300원 · 같은 강사가 끝까지" />
        <KV k="10회권" v="449,000원" sub="회당 44,900원 · 수료증과 액자" />
      </Box>
      <T v="h">바로 배정되는 지역</T>
      <Chips>{['서울 전역', '하남', '구리', '성남', '광명', '부천', '고양'].map((x) => <Chip key={x} label={x} kind="line" big />)}</Chips>
      <T v="cap">그 밖의 지역도 일정을 주시면 찾아볼게요.</T>
      <Btn label="전화번호로 시작하기" onPress={() => r.replace('/login')} />
    </Screen>
  );
}
