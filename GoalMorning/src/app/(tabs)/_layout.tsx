import { Tabs } from 'expo-router/js-tabs';
import { CalendarCheck, GearSix, Mountains, SunHorizon, type Icon } from 'phosphor-react-native';
import type { ColorValue } from 'react-native';

import { Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const tabIcon =
  (IconCmp: Icon) =>
  ({ color, focused }: { color: ColorValue; focused: boolean }) => (
    <IconCmp size={24} color={String(color)} weight={focused ? 'fill' : 'regular'} />
  );

export default function TabsLayout() {
  const c = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.accent,
        tabBarInactiveTintColor: c.textFaint,
        tabBarStyle: { backgroundColor: c.surface, borderTopColor: c.line },
        tabBarLabelStyle: { fontFamily: Type.label.fontFamily, fontSize: 11 },
      }}>
      <Tabs.Screen name="index" options={{ title: '오늘', tabBarIcon: tabIcon(SunHorizon) }} />
      <Tabs.Screen name="goals" options={{ title: '목표', tabBarIcon: tabIcon(Mountains) }} />
      <Tabs.Screen name="records" options={{ title: '기록', tabBarIcon: tabIcon(CalendarCheck) }} />
      <Tabs.Screen name="settings" options={{ title: '설정', tabBarIcon: tabIcon(GearSix) }} />
    </Tabs>
  );
}
