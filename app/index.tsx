import { Redirect } from 'expo-router';
import { useStore } from '../src/data/store';

export default function Index() {
  const loggedIn = useStore((s) => s.loggedIn);
  const mode = useStore((s) => s.mode);
  if (!loggedIn) return <Redirect href="/login" />;
  if (mode === 'instructor') return <Redirect href="/(instructor)/today" />;
  if (mode === 'senior') return <Redirect href="/(senior)/today" />;
  return <Redirect href="/(family)/home" />;
}
