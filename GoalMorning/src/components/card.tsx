import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Layout, Radius, Space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const c = useTheme();
  return <View style={[styles.card, { backgroundColor: c.surface }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: { borderRadius: Radius.card, padding: Layout.cardPadding, gap: Space.sm },
});
