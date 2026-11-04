import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Layout } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Action = { label: string; onPress: () => void; disabled?: boolean };

// iOS 시트 머리: 왼쪽 취소, 가운데 제목, 오른쪽 동작(선택)
export function SheetHeader({ title, left, right }: { title: string; left: Action; right?: Action }) {
  const c = useTheme();
  return (
    <View style={[styles.bar, { borderBottomColor: c.hairline }]}>
      <Pressable hitSlop={12} onPress={left.onPress} style={styles.side}>
        <AppText variant="body" tone="accent">
          {left.label}
        </AppText>
      </Pressable>
      <AppText variant="bodyStrong" numberOfLines={1} style={styles.title}>
        {title}
      </AppText>
      <View style={[styles.side, styles.right]}>
        {right && (
          <Pressable hitSlop={12} onPress={right.onPress} disabled={right.disabled}>
            <AppText variant="bodyStrong" tone={right.disabled ? 'textDisabled' : 'accent'}>
              {right.label}
            </AppText>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.screenX,
    minHeight: 52,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  side: { width: 72, minHeight: 44, justifyContent: 'center' },
  right: { alignItems: 'flex-end' },
  title: { flex: 1, textAlign: 'center' },
});
