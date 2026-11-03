import { router } from 'expo-router';
import { CaretDown, CaretRight, Check, Compass, Plus } from '@/components/icons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { ProgressBar } from '@/components/progress-bar';
import { Screen } from '@/components/screen';
import { Space } from '@/constants/theme';
import { activeGoals, childrenOf, progressOf, useStore } from '@/data/store';
import { StatusLabel, type Goal, type GoalLevel } from '@/data/types';
import { useTheme } from '@/hooks/use-theme';
import { tap } from '@/lib/feedback';

const openGoal = (id: string) => router.push(`/goal/${id}`);
const newGoal = (level: GoalLevel, parentId?: string) =>
  router.push(`/goal/new?level=${level}${parentId ? `&parentId=${parentId}` : ''}`);

export default function GoalsScreen() {
  const { data } = useStore();
  const goals = data.goals;
  const visions = activeGoals(goals, 'vision');
  const ids = new Set(goals.filter((g) => g.status !== 'archived').map((g) => g.id));
  // 위 단계와 연결되지 않은 목표들
  const looseLongs = activeGoals(goals, 'long').filter((g) => !g.parentId || !ids.has(g.parentId));
  const looseShorts = activeGoals(goals, 'short').filter((g) => !g.parentId || !ids.has(g.parentId));
  const archived = goals.filter((g) => g.status === 'archived').length;
  const empty = visions.length + looseLongs.length + looseShorts.length === 0;

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="title">목표 지도</AppText>
        <AppText variant="body" tone="textFaint">
          꿈에서 이번 주 계획까지, 한 줄로 이어져 있어요.
        </AppText>
      </View>

      {empty && (
        <EmptyState
          icon={Compass}
          title="첫 비전을 적어볼까요?"
          body="5년 후 되고 싶은 모습을 적고, 그 아래에 장기 목표와 이번 주 계획을 이어 붙여요."
        />
      )}

      {visions.map((v) => (
        <VisionCard key={v.id} vision={v} goals={goals} />
      ))}

      {(looseLongs.length > 0 || looseShorts.length > 0) && (
        <Card>
          <AppText variant="caption">아직 비전과 연결되지 않은 목표</AppText>
          {looseLongs.map((l) => (
            <LongBlock key={l.id} goal={l} goals={goals} />
          ))}
          {looseShorts.map((s) => (
            <ShortRow key={s.id} goal={s} />
          ))}
        </Card>
      )}

      <Button label="비전 더하기" kind={empty ? 'primary' : 'quiet'} onPress={() => newGoal('vision')} />

      {archived > 0 && (
        <AppText variant="caption" style={styles.center}>
          보관한 목표 {archived}개
        </AppText>
      )}
    </Screen>
  );
}

function VisionCard({ vision, goals }: { vision: Goal; goals: Goal[] }) {
  const longs = childrenOf(goals, vision.id);
  return (
    <Card style={styles.visionCard}>
      <Pressable onPress={() => openGoal(vision.id)} style={styles.visionHead}>
        <AppText variant="caption" tone="accent">
          미래 비전{vision.status !== 'active' ? ` · ${StatusLabel[vision.status]}` : ''}
        </AppText>
        <AppText variant="title">{vision.title}</AppText>
        {!!vision.why && (
          <AppText variant="quote" tone="textFaint">
            {vision.why}
          </AppText>
        )}
      </Pressable>

      {longs.map((l) => (
        <LongBlock key={l.id} goal={l} goals={goals} />
      ))}

      <AddLink label="장기 목표 더하기" onPress={() => newGoal('long', vision.id)} />
    </Card>
  );
}

function LongBlock({ goal, goals }: { goal: Goal; goals: Goal[] }) {
  const c = useTheme();
  const [open, setOpen] = useState(true);
  const shorts = childrenOf(goals, goal.id);
  const progress = progressOf(goals, goal.id);
  const Caret = open ? CaretDown : CaretRight;

  return (
    <View style={[styles.longBlock, { borderTopColor: c.line }]}>
      <View style={styles.longHead}>
        <Pressable accessibilityLabel={open ? '접기' : '펼치기'} hitSlop={10} onPress={() => setOpen(!open)} style={styles.caret}>
          <Caret size={16} color={c.textFaint} />
        </Pressable>
        <Pressable style={styles.flex} onPress={() => openGoal(goal.id)}>
          <AppText variant="bodyStrong" tone={goal.status === 'done' ? 'textFaint' : 'textStrong'}>
            {goal.title}
          </AppText>
          <AppText variant="caption">
            장기 목표
            {goal.status !== 'active' ? ` · ${StatusLabel[goal.status]}` : ''}
            {progress !== null ? ` · ${Math.round(progress * 100)}%` : ''}
          </AppText>
        </Pressable>
      </View>
      {progress !== null && (
        <View style={styles.indent}>
          <ProgressBar value={progress} />
        </View>
      )}
      {open && (
        <View style={styles.indent}>
          {shorts.map((s) => (
            <ShortRow key={s.id} goal={s} />
          ))}
          <AddLink label="이번 주 계획 더하기" onPress={() => newGoal('short', goal.id)} />
        </View>
      )}
    </View>
  );
}

// 단기 계획 한 줄: 동그라미로 바로 달성 처리, 글자를 누르면 수정
function ShortRow({ goal }: { goal: Goal }) {
  const c = useTheme();
  const { updateGoal } = useStore();
  const done = goal.status === 'done';
  return (
    <View style={styles.shortRow}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        hitSlop={10}
        onPress={() => {
          tap(done ? 'light' : 'success');
          updateGoal(goal.id, { status: done ? 'active' : 'done' });
        }}
        style={[styles.miniCircle, { borderColor: done ? c.success : c.textFaint, backgroundColor: done ? c.success : 'transparent' }]}>
        {done && <Check size={11} weight="bold" color={c.surface} />}
      </Pressable>
      <Pressable style={styles.flex} onPress={() => openGoal(goal.id)}>
        <AppText
          variant="body"
          tone={done ? 'textFaint' : 'text'}
          style={done && { textDecorationLine: 'line-through' }}>
          {goal.title}
        </AppText>
        {goal.status === 'paused' && <AppText variant="caption">보류 중</AppText>}
      </Pressable>
    </View>
  );
}

function AddLink({ label, onPress }: { label: string; onPress: () => void }) {
  const c = useTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.addLink, { opacity: pressed ? 0.6 : 1 }]}>
      <Plus size={16} color={c.accent} weight="bold" />
      <AppText variant="label" tone="accent">
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { gap: Space.xs },
  flex: { flex: 1, minWidth: 0 },
  center: { textAlign: 'center' },
  visionCard: { gap: Space.md },
  visionHead: { gap: Space.xs },
  longBlock: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: Space.md, gap: Space.sm },
  longHead: { flexDirection: 'row', alignItems: 'flex-start', gap: Space.sm },
  caret: { width: 20, height: 24, justifyContent: 'center' },
  indent: { paddingLeft: 28 },
  shortRow: { flexDirection: 'row', alignItems: 'center', gap: Space.md, minHeight: 44 },
  miniCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  addLink: { flexDirection: 'row', alignItems: 'center', gap: Space.sm, minHeight: 44 },
});
