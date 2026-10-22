import React, { useEffect } from 'react';
import { View, Pressable, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useStore } from '../src/data/store';
import { T } from '../src/ui';
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

export default function Root() {
  const [loaded] = useFonts({
    'Pretendard-Regular': require('../assets/fonts/Pretendard-Regular.otf'),
    'Pretendard-Medium': require('../assets/fonts/Pretendard-Medium.otf'),
    'Pretendard-SemiBold': require('../assets/fonts/Pretendard-SemiBold.otf'),
    'Pretendard-Bold': require('../assets/fonts/Pretendard-Bold.otf'),
    'Pretendard-ExtraBold': require('../assets/fonts/Pretendard-ExtraBold.otf'),
  });
  if (!loaded) return <View style={{ flex: 1, backgroundColor: '#fff' }} />;
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: Platform.OS === 'web' ? '#f3f3f3' : '#fff' }}>
        <View style={{ flex: 1, width: '100%', maxWidth: Platform.OS === 'web' ? 480 : undefined, alignSelf: 'center', backgroundColor: '#fff' }}>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#fff' } }} />
          <Toast />
        </View>
      </View>
    </SafeAreaProvider>
  );
}
