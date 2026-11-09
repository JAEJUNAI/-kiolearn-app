import React, { useEffect } from 'react';
import { View, Pressable, Platform, useWindowDimensions, Linking } from 'react-native';
import { Image } from 'expo-image';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useStore } from '../src/data/store';
import { T, Row } from '../src/ui';
import { setOnExpired, setToken } from '../src/lib/supabase';
import { C, F } from '../src/theme';

function Toast() {
  const toast = useStore((s) => s.toastMsg);
  const setToast = useStore((s) => s.toast);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(undefined), 3200); return () => clearTimeout(t); }, [toast, setToast]);
  if (!toast) return null;
  return (
    <Pressable onPress={() => setToast(undefined)} style={{ position: 'absolute', left: 18, right: 18, bottom: 90, backgroundColor: C.fg, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 16, zIndex: 50 }}>
      <T style={{ color: '#fff', fontFamily: F.semibold, fontSize: 13.5 }}>{toast}</T>
    </Pressable>
  );
}

// 웹 스크린샷·디자인 확인용: ?shot=family|instructor|senior 로 열면 로그인 상태(예시 데이터)로 시작. ?wide 는 폭 제한 해제.
function useShotHook() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof location === 'undefined') return;
    const m = location.search.match(/[?&]shot=(family|instructor|senior)/); if (!m) return;
    const st = useStore.getState(); if (st.loggedIn && st.mode === m[1]) return;
    st.reset();
    useStore.getState().loginServer({ phone: '01043210000', name: '은희', roles: ['family', 'seeker', 'instructor'], instructor: { name: '박미선', certNo: 'KL-DC-2026-0417' } });
    useStore.getState().setMode(m[1] as 'family' | 'instructor' | 'senior');
  }, []);
}

const open = (url: string) => Linking.openURL(url).catch(() => {});

/** PC 브라우저(폭 900 이상): 왼쪽에 제목·QR·회사 정보, 오른쪽에 앱 화면을 위아래 꽉 차게(폰 테두리 없이). */
function DesktopShell({ children }: { children: React.ReactNode }) {
  const link = (label: string, url: string) => (
    <Pressable onPress={() => open(url)}><T v="sub" style={{ fontFamily: F.semibold, fontSize: 14, textDecorationLine: 'underline' }}>{label}</T></Pressable>
  );
  return (
    <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', backgroundColor: '#f6f6f6' }}>
      <View style={{ width: 400, marginRight: 96, paddingTop: 72, paddingBottom: 48, justifyContent: 'space-between' }}>
        <View style={{ gap: 18 }}>
          <Row style={{ gap: 10 }}>
            <Image source={require('../assets/img/app-mark.png')} style={{ width: 32, height: 32, borderRadius: 9 }} />
            <T style={{ fontFamily: F.extra, fontSize: 18 }}>키오런</T>
          </Row>
          <T style={{ fontFamily: F.extra, fontSize: 40, lineHeight: 52, letterSpacing: -1 }}>부모님 댁으로{'\n'}찾아가는 디지털{'\n'}1:1 방문 수업</T>
          <T v="sub" style={{ fontSize: 16, lineHeight: 25 }}>휴대폰, 키오스크, 은행 앱, AI까지.{'\n'}수업이 끝나면 사진과 결과가 와요.</T>
        </View>
        <View style={{ gap: 14 }}>
          <T style={{ fontFamily: F.bold, fontSize: 18, lineHeight: 26 }}>QR코드 찍고{'\n'}앱으로 예약하기</T>
          <Image source={require('../assets/img/qr-app.png')} style={{ width: 132, height: 158, borderRadius: 6 }} />
          <T v="fine">아이폰 앱은 준비 중이에요. 오른쪽 화면에서 바로 쓸 수 있어요.</T>
          <Row style={{ gap: 18, marginTop: 6 }}>
            {link('방문 수업 알아보기', 'https://kiolearn.co.kr/visit')}
            {link('강사로 일하기', 'https://kiolearn.co.kr/teach')}
            {link('홈페이지', 'https://kiolearn.co.kr')}
          </Row>
        </View>
        <View style={{ gap: 8 }}>
          <T style={{ fontFamily: F.bold, fontSize: 13 }}>(주) 재준에이아이</T>
          <T v="fine" style={{ lineHeight: 19 }}>대표 박성수 · 사업자등록번호 485-81-04147{'\n'}통신판매업 신고 2025-서울강남-06245{'\n'}서울특별시 강남구 논현로26길 46, 5층 506호{'\n'}문의 010-3871-5430</T>
          <T v="fine" style={{ marginTop: 6 }}>Copyright © KIOLEARN. All Rights Reserved.</T>
        </View>
      </View>
      <View style={{ width: 430, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 24, shadowOffset: { width: 0, height: 0 } }}>{children}</View>
    </View>
  );
}

export default function Root() {
  useShotHook();
  // 로그인 기간(30일)이 끝나 서버가 401을 주면: 로그아웃하고 로그인 화면으로 (화면상으로만 로그인된 채 실패하지 않게)
  useEffect(() => { setOnExpired(() => { const st = useStore.getState(); if (!st.loggedIn) return; setToken(''); st.logout(); st.toast('로그인 기간이 끝났어요. 다시 로그인해 주세요.'); router.replace('/login'); }); }, []);
  const { width } = useWindowDimensions();
  const [loaded] = useFonts({
    'Pretendard-Regular': require('../assets/fonts/Pretendard-Regular.otf'),
    'Pretendard-Medium': require('../assets/fonts/Pretendard-Medium.otf'),
    'Pretendard-SemiBold': require('../assets/fonts/Pretendard-SemiBold.otf'),
    'Pretendard-Bold': require('../assets/fonts/Pretendard-Bold.otf'),
    'Pretendard-ExtraBold': require('../assets/fonts/Pretendard-ExtraBold.otf'),
  });
  // 서체 로딩을 기다리지 않는다. 느린 회선에서 흰 화면이 길어지는 것을 막고, 로드되면 자연스럽게 바뀐다.
  void loaded;
  const web = Platform.OS === 'web';
  const wide = web && typeof location !== 'undefined' && /[?&]wide/.test(location.search);
  const desktop = web && !wide && width >= 900;
  const app = (
    <View style={{ flex: 1, position: 'relative' }}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#fff' } }} />
      <Toast />
    </View>
  );
  return (
    <SafeAreaProvider>
      {/* 웹 제목·설명·공유 이미지는 페이지별 HTML(scripts/seo-build.mjs)에서 정해요 */}
      {desktop ? <DesktopShell>{app}</DesktopShell> : (
        <View style={{ flex: 1, backgroundColor: web ? '#f3f3f3' : '#fff' }}>
          <View style={{ flex: 1, width: '100%', maxWidth: web && !wide ? 480 : undefined, alignSelf: 'center', backgroundColor: '#fff' }}>{app}</View>
        </View>
      )}
    </SafeAreaProvider>
  );
}
