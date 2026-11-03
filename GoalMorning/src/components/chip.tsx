import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/app-text';
import { Radius, Space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = { label: string; selected?: boolean; onPress?: () => void; disabled?: boolean };

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
          backgroundColor: selected ? c.accent : c.surface,
          borderColor: selected ? c.accent : c.line,
          opacity: disabled ? 0.45 : pressed ? 0.8 : 1,
        },
      ]}>
      <AppText variant="label" tone={selected ? 'onAccent' : 'text'}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 40,
    paddingHorizontal: Space.lg,
    paddingVertical: Space.sm,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
  },
});
