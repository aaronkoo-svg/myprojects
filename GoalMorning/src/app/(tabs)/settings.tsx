import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { useConfirm } from '@/components/confirm-dialog';
import { Screen } from '@/components/screen';
import { Space } from '@/constants/theme';
import { useStore } from '@/data/store';
import { useTheme } from '@/hooks/use-theme';
import { getApiKey } from '@/lib/ai-key';

// iOS 설정 앱처럼: 묶음 제목 + 흰 카드 안의 줄 목록
export default function SettingsScreen() {
  const { resetAll } = useStore();
  const confirm = useConfirm();
  const [hasKey, setHasKey] = useState(false);

  // 키 화면에서 돌아올 때마다 연결 상태 새로고침
  useFocusEffect(
    useCallback(() => {
      getApiKey().then((k) => setHasKey(!!k));
    }, []),
  );

  const reset = async () => {
    const ok = await confirm({
      title: '처음부터 다시 시작',
      message: '모든 목표와 기록이 지워지고 첫 화면으로 돌아가요. 되돌릴 수 없어요.',
      okLabel: '모두 지우기',
    });
    if (ok) {
      resetAll();
      router.replace('/onboarding');
    }
  };

  return (
    <Screen>
      <AppText variant="hero">설정</AppText>

      <Group title="AI 도우미" footer="윗단계 목표만 적으면 AI가 아랫단계를 제안해요. 내 Anthropic API 키로 동작해요.">
        <Row label="API 키" value={hasKey ? '연결됨' : '설정하기'} onPress={() => router.push('/ai-key')} last />
      </Group>

      <Group title="알림" footer="아침·저녁 알림은 다음 업데이트에서 열려요.">
        <Row label="아침 알림" value="곧 제공" />
        <Row label="저녁 회고 알림" value="곧 제공" last />
      </Group>

      <Group title="데이터" footer="모든 기록은 이 폰에만 저장돼요.">
        <Row label="백업 내보내기" value="곧 제공" />
        <Row label="처음부터 다시 시작" onPress={reset} action last />
      </Group>
    </Screen>
  );
}

function Group({ title, footer, children }: { title: string; footer?: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <AppText variant="captionStrong" tone="textFaint" style={styles.groupText}>
        {title}
      </AppText>
      <Card style={styles.groupCard}>{children}</Card>
      {!!footer && (
        <AppText variant="caption" style={styles.groupText}>
          {footer}
        </AppText>
      )}
    </View>
  );
}

function Row(props: { label: string; value?: string; onPress?: () => void; action?: boolean; last?: boolean }) {
  const c = useTheme();
  return (
    <Pressable
      disabled={!props.onPress}
      onPress={props.onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: c.canvas }]}>
      <View style={[styles.rowInner, !props.last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.hairline }]}>
        <AppText variant="body" tone={props.action ? 'accent' : 'textStrong'} style={styles.flex}>
          {props.label}
        </AppText>
        {!!props.value && (
          <AppText variant="body" tone="textFaint">
            {props.value}
          </AppText>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  group: { gap: Space.xs },
  groupText: { paddingHorizontal: Space.md },
  groupCard: { padding: 0, gap: 0, overflow: 'hidden' },
  row: { paddingLeft: Space.md },
  rowInner: { flexDirection: 'row', alignItems: 'center', minHeight: 50, paddingRight: Space.md, gap: Space.sm },
  flex: { flex: 1, minWidth: 0 },
});
