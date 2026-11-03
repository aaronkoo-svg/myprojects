import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/app-text';
import { pressScale, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = { label: string; selected?: boolean; onPress?: () => void; disabled?: boolean };

// 애플 구성 선택 칩: 흰 알약 + 옅은 테두리, 고르면 파란 2px 테두리
export function Chip({ label, selected, onPress, disabled }: Props) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: c.surface,
          borderColor: selected ? c.accentFocus : c.hairline,
          borderWidth: selected ? 2 : 1,
          // 테두리가 두꺼워져도 글자 위치가 움직이지 않게 안쪽 여백을 보정
          paddingHorizontal: selected ? 15 : 16,
          opacity: disabled ? 0.4 : 1,
        },
        pressScale(pressed),
      ]}>
      <AppText variant="caption" tone={selected ? 'textStrong' : 'text'}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { minHeight: 40, paddingVertical: 9, borderRadius: Radius.pill, justifyContent: 'center' },
});
