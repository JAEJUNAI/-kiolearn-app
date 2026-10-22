import { Tabs } from 'expo-router';
import { tabOptions } from '../../src/tabs';

export default function SeniorTabs() {
  return (
    <Tabs screenOptions={{ ...tabOptions, tabBarLabelStyle: { fontFamily: 'Pretendard-SemiBold', fontSize: 12 } }}>
      <Tabs.Screen name="me" options={{ title: '내 페이지' }} />
      <Tabs.Screen name="today" options={{ title: '오늘' }} />
      <Tabs.Screen name="help" options={{ title: '도움' }} />
    </Tabs>
  );
}
