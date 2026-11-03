import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Layout, Radius, Space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// 흰 카드: 그림자도 테두리도 없이, 회색 바탕과의 면 차이로만 구분
export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const c = useTheme();
  return <View style={[styles.card, { backgroundColor: c.surface }, style]}>{children}</View>;
}

// 어두운 타일: 비전처럼 가장 중요한 한 가지를 무대 위에 올릴 때
export function Tile({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const c = useTheme();
  return <View style={[styles.tile, { backgroundColor: c.tile }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: { borderRadius: Radius.card, padding: Layout.cardPadding, gap: Space.xs },
  tile: { borderRadius: Radius.card, paddingHorizontal: Space.lg, paddingVertical: Space.xl, gap: Space.sm },
});
