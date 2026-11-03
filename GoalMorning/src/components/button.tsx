import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/app-text';
import { pressScale, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  label: string;
  onPress?: () => void;
  // primary: 파란 알약 / secondary: 파란 테두리 알약 / text: 파란 글자 링크
  kind?: 'primary' | 'secondary' | 'text';
  disabled?: boolean;
  compact?: boolean;
  onTile?: boolean; // 어두운 타일 위에 놓일 때
};

export function Button({ label, onPress, kind = 'primary', disabled, compact, onTile }: Props) {
  const c = useTheme();
  const linkTone = onTile ? 'accentOnTile' : 'accent';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        compact && styles.compact,
        kind === 'primary' && { backgroundColor: disabled ? c.hairline : c.accentFill },
        kind === 'secondary' && { borderWidth: 1, borderColor: disabled ? c.hairline : c.accent },
        kind === 'text' && styles.text,
        pressScale(pressed && !disabled),
      ]}>
      <AppText
        variant={compact ? 'caption' : 'body'}
        tone={disabled ? 'textDisabled' : kind === 'primary' ? 'onAccent' : linkTone}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 50,
    borderRadius: Radius.pill,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compact: { minHeight: 34, paddingHorizontal: 15 },
  text: { minHeight: 44, paddingHorizontal: 8 },
});
