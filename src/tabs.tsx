// 탭 바 공통 옵션. 시안의 둥근 네모 아이콘.
import React from 'react';
import { View } from 'react-native';
import { C, F } from './theme';

export const tabOptions = {
  headerShown: false,
  tabBarActiveTintColor: C.fg,
  tabBarInactiveTintColor: C.muted,
  tabBarLabelStyle: { fontFamily: F.semibold, fontSize: 11 },
  tabBarStyle: { borderTopColor: C.line, backgroundColor: '#fff', height: 64, paddingTop: 6, paddingBottom: 8 },
  tabBarIcon: ({ focused }: { focused: boolean }) => <View style={{ width: 20, height: 20, borderRadius: 7, backgroundColor: focused ? C.fg : '#e8e8e8' }} />,
};
