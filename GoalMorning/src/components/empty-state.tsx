import type { Icon } from '@/components/icons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { Space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = { icon: Icon; title: string; body: string };

// 아직 내용이 없는 화면에서 다음 단계를 부드럽게 안내
export function EmptyState({ icon: IconCmp, title, body }: Props) {
  const c = useTheme();
  return (
    <Card style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: c.accentSoft }]}>
        <IconCmp size={24} color={c.accent} weight="regular" />
      </View>
      <AppText variant="bodyStrong">{title}</AppText>
      <AppText variant="body" tone="textFaint">
        {body}
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Space.sm, paddingVertical: Space.xxl },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Space.xs,
  },
});
