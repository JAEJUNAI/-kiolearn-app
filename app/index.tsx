import { useEffect, useState } from 'react';
import { View, Platform } from 'react-native';
import { Redirect } from 'expo-router';
import { useStore } from '../src/data/store';

export default function Index() {
  const loggedIn = useStore((s) => s.loggedIn);
  const mode = useStore((s) => s.mode); const onboarded = useStore((s) => s.onboarded); const demo = useStore((s) => s.demo);
  const [ready, setReady] = useState(useStore.persist.hasHydrated());
  useEffect(() => { if (ready) return; const off = useStore.persist.onFinishHydration(() => setReady(true)); const t = setTimeout(() => setReady(true), 1500); return () => { off(); clearTimeout(t); }; }, [ready]);
  if (!ready) return <View style={{ flex: 1, backgroundColor: '#fff' }} />;
  // 웹에서 처음 온 분(검색·공유)은 소개부터, 앱은 바로 로그인
  if (!loggedIn) return <Redirect href={Platform.OS === 'web' ? '/tour' : '/login'} />;
  if (demo === false && !onboarded && mode === 'family') return <Redirect href="/onboarding" />;
  if (mode === 'instructor') return <Redirect href="/(instructor)/today" />;
  if (mode === 'senior') return <Redirect href="/(senior)/today" />;
  return <Redirect href="/(family)/home" />;
}
