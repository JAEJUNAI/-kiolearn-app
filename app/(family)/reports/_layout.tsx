import { Stack } from 'expo-router';

// 리포트 탭 안의 스택: 목록(index) → 상세([id])
export default function ReportsStack() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#fff' } }} />;
}
