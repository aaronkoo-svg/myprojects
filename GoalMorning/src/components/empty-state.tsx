import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import type { Icon } from '@/components/icons';
import { Space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = { icon: Icon; title: string; body: string };

// 아직 내용이 없을 때: 가운데 정렬, 아이콘은 조용한 회색
export function EmptyState({ icon: IconCmp, title, body }: Props) {
  const c = useTheme();
  return (
    <Card style={styles.card}>
      <IconCmp size={32} color={c.textFaint} weight="light" />
      <View style={styles.text}>
        <AppText variant="bodyStrong" style={styles.center}>
          {title}
        </AppText>
        <AppText variant="caption" style={styles.center}>
          {body}
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', gap: Space.sm, paddingVertical: Space.xl, paddingHorizontal: Space.lg },
  text: { gap: Space.xxs, alignItems: 'center' },
  center: { textAlign: 'center' },
});
