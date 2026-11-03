import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Check } from '@/components/icons';
import { Space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  title: string;
  subtitle?: string;
  done: boolean;
  onToggle: () => void;
  onLongPress?: () => void;
  last?: boolean; // 마지막 줄은 구분선 없음
};

// 미리알림 앱처럼: 동그라미를 누르면 파랗게 채워지며 완료
export function CheckRow({ title, subtitle, done, onToggle, onLongPress, last }: Props) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done }}
      onPress={onToggle}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}>
      <View
        style={[
          styles.circle,
          { borderColor: done ? c.accent : c.textDisabled, backgroundColor: done ? c.accent : 'transparent' },
        ]}>
        {done && <Check size={13} weight="bold" color={c.onAccent} />}
      </View>
      <View style={[styles.text, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.hairline }]}>
        <AppText variant="body" tone={done ? 'textFaint' : 'textStrong'}>
          {title}
        </AppText>
        {!!subtitle && <AppText variant="caption">{subtitle}</AppText>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: Space.sm },
  circle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  text: { flex: 1, minWidth: 0, gap: 2, paddingVertical: 13 },
});
