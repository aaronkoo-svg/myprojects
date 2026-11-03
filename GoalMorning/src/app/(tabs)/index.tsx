import { router } from 'expo-router';
import { ArrowBendDownRight, Mountains, Plus } from '@/components/icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { CheckRow } from '@/components/check-row';
import { useConfirm } from '@/components/confirm-dialog';
import { Chip } from '@/components/chip';
import { EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';
import { Section } from '@/components/section';
import { TextField } from '@/components/text-field';
import { Space } from '@/constants/theme';
import { activeGoals, ancestry, useStore } from '@/data/store';
import { LevelLabel, type Goal, type Task } from '@/data/types';
import { useTheme } from '@/hooks/use-theme';
import { daysBetween, dateKey, greeting, longDateLabel } from '@/lib/date';
import { tap } from '@/lib/feedback';

const MAX_PICKS = 3;

export default function TodayScreen() {
  const { data } = useStore();
  const now = new Date();
  const today = dateKey(now);
  const checkedIn = data.checkins.some((c) => c.date === today);

  // 날마다 다른 목표를 돌아가며 보여준다 (비전 → 장기 순으로 섞어서)
  const spotlight = useMemo(() => {
    const pool = [...activeGoals(data.goals, 'vision'), ...activeGoals(data.goals, 'long')].filter(
      (g) => g.status === 'active',
    );
    if (pool.length === 0) return null;
    const dayIndex = Math.floor(Date.now() / 86400000);
    return pool[dayIndex % pool.length];
  }, [data.goals]);

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="caption">{longDateLabel(now)}</AppText>
        <AppText variant="display">{greeting(now)}</AppText>
      </View>

      {spotlight ? (
        <SpotlightCard goal={spotlight} />
      ) : (
        <>
          <EmptyState
            icon={Mountains}
            title="아직 그려둔 꿈이 없어요"
            body="5년 후 어떤 하루를 보내고 싶은지 적어두면, 매일 아침 여기서 다시 떠올려 드릴게요."
          />
          <Button label="내 비전 그려보기" kind="quiet" onPress={() => router.push('/goal/new?level=vision')} />
        </>
      )}

      {checkedIn ? <TodayList today={today} /> : <MorningCheckin today={today} />}
    </Screen>
  );
}

function SpotlightCard({ goal }: { goal: Goal }) {
  const c = useTheme();
  return (
    <Card style={[styles.spotlight, { backgroundColor: c.accentSoft }]}>
      <AppText variant="caption" tone="accent">
        {goal.level === 'vision' ? '내가 그리는 모습' : `오늘 마음에 새길 ${LevelLabel[goal.level]}`}
      </AppText>
      <AppText variant="title">{goal.title}</AppText>
      {!!goal.why && (
        <AppText variant="quote" style={styles.why}>
          {goal.why}
        </AppText>
      )}
    </Card>
  );
}

// ---- 아침 체크인 (체크인 전) ----

function MorningCheckin({ today }: { today: string }) {
  const c = useTheme();
  const { data, carryTask, checkIn } = useStore();
  const shorts = activeGoals(data.goals, 'short').filter((g) => g.status === 'active');
  const todayTasks = data.tasks.filter((t) => t.date === today);

  // 최근 7일 동안 못 끝낸 일
  const leftovers = data.tasks.filter(
    (t) => !t.done && t.date < today && daysBetween(t.date, today) <= 7,
  );

  const [picked, setPicked] = useState<string[]>([]); // 단기 계획 id
  const [custom, setCustom] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [intention, setIntention] = useState('');

  const count = picked.length + custom.length + todayTasks.length;
  const full = count >= MAX_PICKS;

  const togglePick = (id: string) => {
    tap();
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : full ? p : [...p, id]));
  };

  const addCustom = () => {
    const t = draft.trim();
    if (!t || full) return;
    setCustom((cs) => [...cs, t]);
    setDraft('');
  };

  const start = () => {
    checkIn({
      picks: [
        ...picked.map((id) => {
          const g = data.goals.find((x) => x.id === id)!;
          return { title: g.title, goalId: g.id };
        }),
        ...custom.map((title) => ({ title, goalId: null })),
      ],
      intention,
    });
    tap('success');
  };

  return (
    <>
      {leftovers.length > 0 && (
        <Section title="지난번에 못 끝낸 일" hint="오늘 이어서 해볼까요? 놓아줘도 괜찮아요.">
          <Card style={styles.listCard}>
            {leftovers.map((t) => (
              <View key={t.id} style={styles.leftover}>
                <AppText variant="body" tone="textStrong" style={styles.flex}>
                  {t.title}
                </AppText>
                <Button
                  label="오늘로"
                  kind="quiet"
                  compact
                  disabled={full}
                  onPress={() => {
                    tap();
                    carryTask(t.id);
                  }}
                />
              </View>
            ))}
          </Card>
        </Section>
      )}

      <Section
        title={`오늘 집중할 일 ${count}/${MAX_PICKS}`}
        hint="단기 계획에서 고르거나 직접 적어요. 1~3가지면 충분해요.">
        {todayTasks.length > 0 && (
          <View style={styles.chips}>
            {todayTasks.map((t) => (
              <Chip key={t.id} label={t.title} selected />
            ))}
          </View>
        )}
        {shorts.length > 0 && (
          <View style={styles.chips}>
            {shorts
              .filter((g) => !todayTasks.some((t) => t.goalId === g.id))
              .map((g) => (
                <Chip
                  key={g.id}
                  label={g.title}
                  selected={picked.includes(g.id)}
                  disabled={full && !picked.includes(g.id)}
                  onPress={() => togglePick(g.id)}
                />
              ))}
          </View>
        )}
        {custom.length > 0 && (
          <View style={styles.chips}>
            {custom.map((t, i) => (
              <Chip key={`${t}-${i}`} label={t} selected onPress={() => setCustom((cs) => cs.filter((_, j) => j !== i))} />
            ))}
          </View>
        )}
        <View style={styles.addRow}>
          <TextField
            style={styles.flex}
            value={draft}
            onChangeText={setDraft}
            placeholder={full ? '오늘은 이 정도면 충분해요' : '직접 적기'}
            editable={!full}
            onSubmitEditing={addCustom}
            returnKeyType="done"
          />
          <Pressable
            accessibilityLabel="추가"
            onPress={addCustom}
            disabled={!draft.trim() || full}
            style={[styles.addBtn, { backgroundColor: c.accentSoft, opacity: !draft.trim() || full ? 0.4 : 1 }]}>
            <Plus size={20} color={c.accent} weight="bold" />
          </Pressable>
        </View>
      </Section>

      <Section title="오늘의 다짐" hint="선택 사항이에요.">
        <TextField value={intention} onChangeText={setIntention} placeholder="예) 조급해하지 말고 한 걸음씩" />
      </Section>

      <Button label="오늘 시작하기" disabled={count === 0} onPress={start} />
    </>
  );
}

// ---- 오늘 할 일 (체크인 후) ----

function TodayList({ today }: { today: string }) {
  const c = useTheme();
  const { data, toggleTask, deleteTask, addTask } = useStore();
  const confirm = useConfirm();
  const [draft, setDraft] = useState('');
  const tasks = data.tasks.filter((t) => t.date === today);
  const checkin = data.checkins.find((x) => x.date === today);
  const doneCount = tasks.filter((t) => t.done).length;
  const allDone = tasks.length > 0 && doneCount === tasks.length;

  const pathLabel = (t: Task) => {
    const chain = ancestry(data.goals, t.goalId).filter((g) => g.level !== 'short' || g.title !== t.title);
    const parts = chain.filter((g) => g.level !== 'vision').map((g) => g.title);
    if (t.carriedFrom) parts.push('지난번에서 이어옴');
    return parts.join(' · ');
  };

  const remove = async (t: Task) => {
    if (await confirm({ title: '할 일 지우기', message: `“${t.title}”을(를) 지울까요?`, okLabel: '지우기' })) deleteTask(t.id);
  };

  const add = () => {
    if (!draft.trim()) return;
    addTask(draft);
    setDraft('');
  };

  return (
    <>
      {!!checkin?.intention && (
        <View style={styles.intention}>
          <AppText variant="caption">오늘의 다짐</AppText>
          <AppText variant="quote" tone="textStrong">
            {checkin.intention}
          </AppText>
        </View>
      )}

      <Section
        title={allDone ? '오늘의 초점을 모두 해냈어요' : `오늘의 초점 ${doneCount}/${tasks.length}`}
        hint={allDone ? '정말 멋진 하루예요. 푹 쉬어도 괜찮아요.' : '누르면 완료, 길게 누르면 지울 수 있어요.'}>
        <Card style={styles.listCard}>
          {tasks.length === 0 && (
            <AppText variant="body" tone="textFaint" style={styles.emptyLine}>
              오늘은 아직 할 일이 없어요.
            </AppText>
          )}
          {tasks.map((t) => (
            <CheckRow
              key={t.id}
              title={t.title}
              subtitle={pathLabel(t) || undefined}
              done={t.done}
              onToggle={() => {
                tap(t.done ? 'light' : 'success');
                toggleTask(t.id);
              }}
              onLongPress={() => remove(t)}
            />
          ))}
        </Card>
        <View style={styles.addRow}>
          <TextField
            style={styles.flex}
            value={draft}
            onChangeText={setDraft}
            placeholder="할 일 더하기"
            onSubmitEditing={add}
            returnKeyType="done"
          />
          <Pressable
            accessibilityLabel="추가"
            onPress={add}
            disabled={!draft.trim()}
            style={[styles.addBtn, { backgroundColor: c.accentSoft, opacity: draft.trim() ? 1 : 0.4 }]}>
            <Plus size={20} color={c.accent} weight="bold" />
          </Pressable>
        </View>
      </Section>

      <Pressable onPress={() => router.navigate('/goals')} style={styles.linkRow}>
        <ArrowBendDownRight size={16} color={c.textFaint} />
        <AppText variant="label" tone="textFaint">
          목표 지도에서 계획 다듬기
        </AppText>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  header: { gap: Space.xs, marginBottom: Space.sm },
  spotlight: { gap: Space.sm },
  why: { marginTop: Space.xs },
  flex: { flex: 1, minWidth: 0 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm },
  addRow: { flexDirection: 'row', gap: Space.sm, alignItems: 'center' },
  addBtn: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  listCard: { paddingVertical: Space.sm, gap: 0 },
  leftover: { flexDirection: 'row', alignItems: 'center', gap: Space.md, paddingVertical: Space.sm },
  intention: { gap: Space.xs },
  emptyLine: { paddingVertical: Space.md },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: Space.sm, alignSelf: 'center', padding: Space.sm },
});
