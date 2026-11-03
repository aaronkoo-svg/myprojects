import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Layout, Space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// 모든 탭 화면의 공통 틀: 옅은 회색 바탕, 좌우 20 여백, 스크롤
export function Screen({ children }: { children: ReactNode }) {
  const c = useTheme();
  return (
    <SafeAreaView edges={['top']} style={[styles.fill, { backgroundColor: c.canvas }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.inner}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { paddingHorizontal: Layout.screenX, paddingTop: Space.md, paddingBottom: Space.section },
  inner: { width: '100%', maxWidth: Layout.maxWidth, alignSelf: 'center', gap: Space.xl },
});
