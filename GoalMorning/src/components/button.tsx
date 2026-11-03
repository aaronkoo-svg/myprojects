import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/app-text';
import { Radius, Space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  label: string;
  onPress?: () => void;
  kind?: 'primary' | 'quiet' | 'text';
  disabled?: boolean;
  compact?: boolean;
};

export function Button({ label, onPress, kind = 'primary', disabled, compact }: Props) {
  const c = useTheme();
  const bg = kind === 'primary' ? c.accent : kind === 'quiet' ? c.accentSoft : 'transparent';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        compact && styles.compact,
        { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.85 : 1 },
      ]}>
      <AppText
        variant="label"
        tone={kind === 'primary' ? 'onAccent' : kind === 'quiet' ? 'accent' : 'textFaint'}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: Radius.control,
    paddingHorizontal: Space.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compact: { minHeight: 36, paddingHorizontal: Space.md },
});
