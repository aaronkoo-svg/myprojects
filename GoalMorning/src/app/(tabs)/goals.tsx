import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { Card, Tile } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { CaretDown, CaretRight, Check, Compass, Plus } from '@/components/icons';
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
        <AppText variant="hero">목표</AppText>
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
        <VisionGroup key={v.id} vision={v} goals={goals} />
      ))}

      {(looseLongs.length > 0 || looseShorts.length > 0) && (
        <View style={styles.group}>
          <AppText variant="captionStrong" tone="textFaint" style={styles.groupLabel}>
            비전과 연결되지 않은 목표
          </AppText>
          <Card style={styles.groupCard}>
            {looseLongs.map((l, i) => (
              <LongBlock key={l.id} goal={l} goals={goals} first={i === 0} />
            ))}
            {looseShorts.length > 0 && (
              <View style={looseLongs.length > 0 && styles.looseShorts}>
                {looseShorts.map((s) => (
                  <ShortRow key={s.id} goal={s} />
                ))}
              </View>
            )}
          </Card>
        </View>
      )}

      <Button label="비전 더하기" kind={empty ? 'primary' : 'secondary'} onPress={() => newGoal('vision')} />

      {archived > 0 && (
        <AppText variant="caption" style={styles.center}>
          보관한 목표 {archived}개
        </AppText>
      )}
    </Screen>
  );
}

// 비전 하나 = 어두운 타일(비전) + 흰 카드(그 아래 목표들)
function VisionGroup({ vision, goals }: { vision: Goal; goals: Goal[] }) {
  const longs = childrenOf(goals, vision.id);
  return (
    <View style={styles.visionGroup}>
      <Pressable onPress={() => openGoal(vision.id)}>
        {({ pressed }) => (
          <Tile style={[styles.visionTile, { opacity: pressed ? 0.9 : 1 }]}>
            <AppText variant="captionStrong" tone="onTileMuted">
              미래 비전{vision.status !== 'active' ? ` · ${StatusLabel[vision.status]}` : ''}
            </AppText>
            <AppText variant="title" tone="onTile">
              {vision.title}
            </AppText>
            {!!vision.why && (
              <AppText variant="body" tone="onTileMuted">
                {vision.why}
              </AppText>
            )}
          </Tile>
        )}
      </Pressable>

      <Card style={styles.groupCard}>
        {longs.map((l, i) => (
          <LongBlock key={l.id} goal={l} goals={goals} first={i === 0} />
        ))}
        <AddLink label="장기 목표 더하기" onPress={() => newGoal('long', vision.id)} />
      </Card>
    </View>
  );
}

function LongBlock({ goal, goals, first }: { goal: Goal; goals: Goal[]; first: boolean }) {
  const c = useTheme();
  const [open, setOpen] = useState(true);
  const shorts = childrenOf(goals, goal.id);
  const progress = progressOf(goals, goal.id);
  const Caret = open ? CaretDown : CaretRight;

  return (
    <View style={[styles.longBlock, !first && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.hairline }]}>
      <View style={styles.longHead}>
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
        <Pressable
          accessibilityLabel={open ? '접기' : '펼치기'}
          hitSlop={12}
          onPress={() => setOpen(!open)}
          style={styles.caret}>
          <Caret size={16} color={c.textFaint} weight="bold" />
        </Pressable>
      </View>
      {progress !== null && <ProgressBar value={progress} />}
      {open && (
        <View>
          {shorts.map((s) => (
            <ShortRow key={s.id} goal={s} />
          ))}
          <AddLink label="이번 주 계획 더하기" onPress={() => newGoal('short', goal.id)} />
        </View>
      )}
    </View>
  );
}

// 단기 계획 한 줄: 동그라미로 바로 달성, 글자를 누르면 다듬기
function ShortRow({ goal }: { goal: Goal }) {
  const c = useTheme();
  const { updateGoal } = useStore();
  const done = goal.status === 'done';
  return (
    <View style={styles.shortRow}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        hitSlop={12}
        onPress={() => {
          tap(done ? 'light' : 'success');
          updateGoal(goal.id, { status: done ? 'active' : 'done' });
        }}
        style={[
          styles.miniCircle,
          { borderColor: done ? c.accent : c.textDisabled, backgroundColor: done ? c.accent : 'transparent' },
        ]}>
        {done && <Check size={11} weight="bold" color={c.onAccent} />}
      </Pressable>
      <Pressable style={styles.flex} onPress={() => openGoal(goal.id)}>
        <AppText variant="body" tone={done ? 'textFaint' : 'text'}>
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
      <AppText variant="body" tone="accent">
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { gap: Space.xxs },
  flex: { flex: 1, minWidth: 0 },
  center: { textAlign: 'center' },
  visionGroup: { gap: Space.xs },
  visionTile: { gap: Space.xs },
  group: { gap: Space.xs },
  groupLabel: { paddingHorizontal: Space.xxs },
  groupCard: { paddingVertical: Space.xs, gap: 0 },
  looseShorts: { marginTop: Space.xs },
  longBlock: { paddingVertical: Space.sm, gap: Space.xs },
  longHead: { flexDirection: 'row', alignItems: 'flex-start', gap: Space.sm },
  caret: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  shortRow: { flexDirection: 'row', alignItems: 'center', gap: Space.sm, minHeight: 44 },
  miniCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLink: { flexDirection: 'row', alignItems: 'center', gap: Space.xs, minHeight: 44 },
});
