import { Tabs } from 'expo-router';
import { tabOptions } from '../../src/tabs';

export default function FamilyTabs() {
  return (
    <Tabs screenOptions={tabOptions}>
      <Tabs.Screen name="home" options={{ title: '홈' }} />
      <Tabs.Screen name="reports" options={{ title: '리포트' }} />
      <Tabs.Screen name="book" options={{ title: '예약' }} />
      <Tabs.Screen name="more" options={{ title: '더보기' }} />
    </Tabs>
  );
}
