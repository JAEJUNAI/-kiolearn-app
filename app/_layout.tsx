import React, { useEffect } from 'react';
import { View, Pressable, Platform, useWindowDimensions, Linking } from 'react-native';
import { Image } from 'expo-image';
import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useStore } from '../src/data/store';
import { T, Btn } from '../src/ui';
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

/** PC 브라우저(폭 900 이상)에서는 왼쪽에 소개와 QR, 오른쪽에 폰 모양 틀 안의 앱을 보여 준다. */
function DesktopShell({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#f3f3f3' }}>
      <View style={{ height: 64, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: C.line, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 32, gap: 10 }}>
        <Image source={require('../assets/img/app-mark.png')} style={{ width: 28, height: 28, borderRadius: 8 }} />
        <T style={{ fontFamily: F.extra, fontSize: 17 }}>키오런</T>
        <T v="cap" style={{ marginLeft: 6 }}>부모님 1:1 과외</T>
        <View style={{ flex: 1 }} />
        <Pressable onPress={() => open('https://kiolearn.co.kr/lesson')}><T v="sub" style={{ fontFamily: F.semibold, marginRight: 22 }}>혼자 해 보는 수업</T></Pressable>
        <Pressable onPress={() => open('https://kiolearn.co.kr/teach')}><T v="sub" style={{ fontFamily: F.semibold, marginRight: 22 }}>강사 지원</T></Pressable>
        <Pressable onPress={() => open('https://kiolearn.co.kr')}><T v="sub" style={{ fontFamily: F.semibold }}>홈페이지</T></Pressable>
      </View>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 72, paddingHorizontal: 40, paddingVertical: 28 }}>
        <View style={{ width: 380, gap: 14 }}>
          <T style={{ fontFamily: F.extra, fontSize: 34, lineHeight: 44, letterSpacing: -0.8 }}>부모님 댁에{'\n'}선생님이 갑니다</T>
          <T v="sub" style={{ fontSize: 15.5, lineHeight: 24 }}>자녀가 날짜를 고르면 자격 확인을 마친 강사가 부모님 댁으로 가서 90분 동안 함께 눌러 봅니다. 그날 저녁 사진과 "혼자 해낸 것"이 옵니다.</T>
          <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 16, borderWidth: 1, borderColor: C.line, marginTop: 8 }}>
            <Image source={require('../assets/img/qr-app.png')} style={{ width: 108, height: 108, borderRadius: 10 }} />
            <View style={{ flex: 1 }}>
              <T v="h">폰으로 열기</T>
              <T v="cap" style={{ marginTop: 4 }}>카메라로 QR을 찍으면 같은 화면이 폰에서 열립니다. 설치 없이 바로 쓸 수 있고, 앱 스토어 버전은 심사 중입니다.</T>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
            <Btn label="방문 수업 알아보기" size="sm" onPress={() => open('https://kiolearn.co.kr/visit')} />
            <Btn label="강사로 일하기" size="sm" kind="ghost" onPress={() => open('https://kiolearn.co.kr/teach')} />
          </View>
          <T v="fine" style={{ marginTop: 10 }}>오른쪽 화면은 실제 앱입니다. PC에서도 그대로 쓸 수 있습니다.</T>
        </View>
        <View style={{ width: 412, height: 860, maxHeight: '96%', borderRadius: 44, borderWidth: 10, borderColor: '#141311', backgroundColor: '#141311', overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 40, shadowOffset: { width: 0, height: 24 } }}>
          <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 34, overflow: 'hidden' }}>{children}</View>
        </View>
      </View>
    </View>
  );
}

export default function Root() {
  useShotHook();
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
      {web && (
        <Head>
          <title>키오런 - 부모님 1:1 과외</title>
          <meta name="description" content="자녀가 날짜를 고르면 자격 확인을 마친 강사가 부모님 댁에 가서 90분 동안 함께 눌러 봅니다. 그날 저녁 사진과 결과가 옵니다." />
          <meta name="theme-color" content="#ffffff" />
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
          <link rel="manifest" href="/manifest.webmanifest" />
          <meta property="og:title" content="키오런 - 부모님 1:1 과외" />
          <meta property="og:image" content="https://app.kiolearn.co.kr/icon-512.png" />
        </Head>
      )}
      {desktop ? <DesktopShell>{app}</DesktopShell> : (
        <View style={{ flex: 1, backgroundColor: web ? '#f3f3f3' : '#fff' }}>
          <View style={{ flex: 1, width: '100%', maxWidth: web && !wide ? 480 : undefined, alignSelf: 'center', backgroundColor: '#fff' }}>{app}</View>
        </View>
      )}
    </SafeAreaProvider>
  );
}
