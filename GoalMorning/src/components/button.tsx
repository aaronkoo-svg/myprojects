import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/app-text';
import { Radius, Space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = { label: string; onPress?: () => void; kind?: 'primary' | 'quiet' };

export function Button({ label, onPress, kind = 'primary' }: Props) {
  const c = useTheme();
  const primary = kind === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: primary ? c.accent : c.accentSoft, opacity: pressed ? 0.85 : 1 },
      ]}>
      <AppText variant="label" tone={primary ? 'onAccent' : 'accent'}>
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
});
