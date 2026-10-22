import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { useStore } from '../src/data/store';

export default function Index() {
  const loggedIn = useStore((s) => s.loggedIn);
  const mode = useStore((s) => s.mode);
  const [ready, setReady] = useState(useStore.persist.hasHydrated());
  useEffect(() => { if (ready) return; const off = useStore.persist.onFinishHydration(() => setReady(true)); const t = setTimeout(() => setReady(true), 1500); return () => { off(); clearTimeout(t); }; }, [ready]);
  if (!ready) return <View style={{ flex: 1, backgroundColor: '#fff' }} />;
  if (!loggedIn) return <Redirect href="/login" />;
  if (mode === 'instructor') return <Redirect href="/(instructor)/today" />;
  if (mode === 'senior') return <Redirect href="/(senior)/today" />;
  return <Redirect href="/(family)/home" />;
}
