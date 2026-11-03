import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { CalendarBlank } from '@/components/icons';
import { Screen } from '@/components/screen';
import { Space } from '@/constants/theme';
import { useStore } from '@/data/store';
import { addDays, dateKey } from '@/lib/date';

export default function RecordsScreen() {
  const { data } = useStore();
  const today = dateKey();
  // 이번 주(월요일 시작) 체크인 횟수
  const dow = (new Date().getDay() + 6) % 7;
  const monday = addDays(today, -dow);
  const weekCount = data.checkins.filter((c) => c.date >= monday && c.date <= today).length;
  const doneTasks = data.tasks.filter((t) => t.done).length;
  const doneGoals = data.goals.filter((g) => g.status === 'done').length;

  return (
    <Screen>
      <AppText variant="hero">기록</AppText>
      {data.checkins.length === 0 ? (
        <EmptyState
          icon={CalendarBlank}
          title="첫 아침을 기다리고 있어요"
          body="체크인한 날과 이뤄낸 일들이 여기에 차곡차곡 쌓여요."
        />
      ) : (
        <>
          <Card style={styles.hero}>
            <AppText variant="captionStrong" tone="textFaint">
              이번 주 아침
            </AppText>
            <View style={styles.bigRow}>
              <AppText variant="hero" style={styles.bigNumber}>
                {weekCount}
              </AppText>
              <AppText variant="tagline" tone="textFaint">
                / 7일
              </AppText>
            </View>
            <AppText variant="body" tone="textFaint">
              {weekCount >= 5 ? '꾸준함이 쌓이고 있어요.' : '하루하루가 다 의미 있어요.'}
            </AppText>
          </Card>
          <View style={styles.row}>
            <Stat label="해낸 일" value={doneTasks} />
            <Stat label="달성한 목표" value={doneGoals} />
            <Stat label="모든 아침" value={data.checkins.length} />
          </View>
          <AppText variant="caption" style={styles.center}>
            달력과 회고 모아보기는 다음 단계에서 더해져요.
          </AppText>
        </>
      )}
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card style={styles.stat}>
      <AppText variant="title" style={styles.tabular}>
        {value}
      </AppText>
      <AppText variant="caption">{label}</AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  hero: { gap: Space.xxs, paddingVertical: Space.lg },
  bigRow: { flexDirection: 'row', alignItems: 'baseline', gap: Space.xs },
  bigNumber: { fontSize: 64, lineHeight: 70, letterSpacing: -2, fontVariant: ['tabular-nums'] },
  row: { flexDirection: 'row', gap: Space.xs },
  stat: { flex: 1, padding: Space.md, gap: 2 },
  tabular: { fontVariant: ['tabular-nums'] },
  center: { textAlign: 'center' },
});
