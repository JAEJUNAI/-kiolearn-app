// 둘러보기: 로그인 없이 보는 설명 3장(스토어 심사 대응).
import React from 'react';
import { useRouter } from 'expo-router';
import { Screen, Nav, T, Tile, Box, KV, Btn, Photo, Chips, Chip } from '../src/ui';

export default function Tour() {
  const r = useRouter();
  return (
    <Screen>
      <Nav title="둘러보기" />
      <T v="ttl">부모님 곁에 사람을 보내고,{'\n'}그날 저녁 결과를 받습니다</T>
      <Photo src="lesson" ratio={16 / 9} />
      <Tile title="원하시는 날짜에 강사가 갑니다" text="결제 뒤 72시간 안에 첫 일정이 정해집니다. 안 되면 전액 환불." />
      <Box kind="white">
        <KV first k="수업" v="90분 · 어르신 댁 1:1" />
        <KV k="강사" v="자격 확인 · 배상책임보험" />
        <KV k="리포트" v="수업마다 사진과 결과" />
        <KV k="환불" v="첫 수업 전까지 전액" />
      </Box>
      <T v="h">가격</T>
      <Box>
        <KV first k="3회권" v="199,000원" sub="같은 강사가 끝까지" />
        <KV k="10회권" v="639,000원" sub="회당 63,900원 · 수료증과 액자" />
        <KV k="멤버십" v="월 29,000원" sub="월 2회 전화 점검" />
      </Box>
      <T v="h">바로 배정되는 지역</T>
      <Chips>{['서울 전역', '하남', '구리', '성남', '광명', '부천', '고양'].map((x) => <Chip key={x} label={x} kind="line" big />)}</Chips>
      <T v="cap">그 밖의 지역도 일정을 주시면 찾아봅니다.</T>
      <Btn label="전화번호로 시작하기" onPress={() => r.back()} />
    </Screen>
  );
}
