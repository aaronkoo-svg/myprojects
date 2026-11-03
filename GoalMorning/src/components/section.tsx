import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Space } from '@/constants/theme';

// 제목 + 설명 + 내용. 제목과 설명은 붙이고, 내용과는 띄운다.
export function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <AppText variant="tagline">{title}</AppText>
        {!!hint && <AppText variant="caption">{hint}</AppText>}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Space.sm },
  head: { gap: Space.xxs },
});
