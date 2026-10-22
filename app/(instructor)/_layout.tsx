import { Tabs } from 'expo-router';
import { tabOptions } from '../../src/tabs';

export default function InstructorTabs() {
  return (
    <Tabs screenOptions={tabOptions}>
      <Tabs.Screen name="today" options={{ title: '오늘' }} />
      <Tabs.Screen name="schedule" options={{ title: '일정' }} />
      <Tabs.Screen name="payout" options={{ title: '정산' }} />
      <Tabs.Screen name="profile" options={{ title: '프로필' }} />
    </Tabs>
  );
}
