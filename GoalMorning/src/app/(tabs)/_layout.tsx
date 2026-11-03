import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { StyleSheet, type ColorValue } from 'react-native';

import { CalendarCheck, GearSix, Mountains, SunHorizon, type Icon } from '@/components/icons';
import { Type } from '@/constants/theme';
import { useStore } from '@/data/store';
import { useTheme } from '@/hooks/use-theme';

const tabIcon =
  (IconCmp: Icon) =>
  ({ color, focused }: { color: ColorValue; focused: boolean }) => (
    <IconCmp size={25} color={String(color)} weight={focused ? 'fill' : 'regular'} />
  );

export default function TabsLayout() {
  const c = useTheme();
  const { data } = useStore();

  // 처음 쓰는 사람은 온보딩부터
  if (!data.onboarded) return <Redirect href="/onboarding" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.accent,
        tabBarInactiveTintColor: c.textFaint,
        tabBarStyle: {
          backgroundColor: c.canvas,
          borderTopColor: c.hairline,
          borderTopWidth: StyleSheet.hairlineWidth,
          elevation: 0,
        },
        tabBarLabelStyle: { fontFamily: Type.caption.fontFamily, fontSize: 10, letterSpacing: -0.1 },
      }}>
      <Tabs.Screen name="index" options={{ title: '오늘', tabBarIcon: tabIcon(SunHorizon) }} />
      <Tabs.Screen name="goals" options={{ title: '목표', tabBarIcon: tabIcon(Mountains) }} />
      <Tabs.Screen name="records" options={{ title: '기록', tabBarIcon: tabIcon(CalendarCheck) }} />
      <Tabs.Screen name="settings" options={{ title: '설정', tabBarIcon: tabIcon(GearSix) }} />
    </Tabs>
  );
}
