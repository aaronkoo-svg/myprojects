import { Check } from '@/components/icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  title: string;
  subtitle?: string;
  done: boolean;
  onToggle: () => void;
  onLongPress?: () => void;
};

// 오늘 할 일 한 줄: 동그라미를 누르면 완료
export function CheckRow({ title, subtitle, done, onToggle, onLongPress }: Props) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done }}
      onPress={onToggle}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}>
      <View
        style={[
          styles.circle,
          { borderColor: done ? c.success : c.textFaint, backgroundColor: done ? c.success : 'transparent' },
        ]}>
        {done && <Check size={14} weight="bold" color={c.surface} />}
      </View>
      <View style={styles.text}>
        <AppText
          variant="body"
          tone={done ? 'textFaint' : 'textStrong'}
          style={done && { textDecorationLine: 'line-through' }}>
          {title}
        </AppText>
        {!!subtitle && <AppText variant="caption">{subtitle}</AppText>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: Space.md, paddingVertical: Space.md, minHeight: 52 },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
  },
  text: { flex: 1, gap: 2 },
});
