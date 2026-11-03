import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { CheckRow } from '@/components/check-row';
import { Chip } from '@/components/chip';
import { useConfirm } from '@/components/confirm-dialog';
import { CaretRight, Plus } from '@/components/icons';
import { Screen } from '@/components/screen';
import { Section } from '@/components/section';
import { Sky } from '@/components/sky';
import { TextField } from '@/components/text-field';
import { OnSky, Skies, skyPeriod } from '@/constants/sky';
import { pressScale, Radius, Space } from '@/constants/theme';
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

  // 날마다 다른 비전·장기 목표를 돌아가며 보여준다
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
        <AppText variant="captionStrong" tone="textFaint">
          {longDateLabel(now)} · {Skies[skyPeriod(now)].label}
        </AppText>
        <AppText variant="hero">{greeting(now)}</AppText>
      </View>

      {spotlight ? <SpotlightTile goal={spotlight} /> : <NoVisionTile />}

      {checkedIn ? <TodayList today={today} /> : <MorningCheckin today={today} />}
    </Screen>
  );
}

// 하루의 첫 장면: 지금 시간의 하늘 위에 내 비전 한 문장, 아래로 해가 떠오른다
const TILE_SUN = { size: 132, right: -18, bottom: -66 };

function SpotlightTile({ goal }: { goal: Goal }) {
  return (
    <Sky style={styles.skyTile} sun={TILE_SUN}>
      <AppText variant="captionStrong" style={styles.onSkyMuted}>
        {goal.level === 'vision' ? '내가 그리는 모습' : `오늘 마음에 새길 ${LevelLabel[goal.level]}`}
      </AppText>
      <AppText variant="title" tone="onTile">
        {goal.title}
      </AppText>
      {!!goal.why && (
        <AppText variant="lead" style={styles.onSkyMuted}>
          {goal.why}
        </AppText>
      )}
    </Sky>
  );
}

function NoVisionTile() {
  return (
    <Sky style={styles.skyTile} sun={TILE_SUN}>
      <AppText variant="title" tone="onTile">
        아직 그려둔 꿈이 없어요
      </AppText>
      <AppText variant="body" style={styles.onSkyMuted}>
        5년 후 보내고 싶은 하루를 적어두면, 매일 아침 여기서 다시 보여드릴게요.
      </AppText>
      <View style={styles.tileAction}>
        <Button label="비전 그리기" compact onPress={() => router.push('/goal/new?level=vision')} />
      </View>
    </Sky>
  );
}

// ---- 아침 체크인 (체크인 전) ----

function MorningCheckin({ today }: { today: string }) {
  const c = useTheme();
  const { data, carryTask, checkIn } = useStore();
  const shorts = activeGoals(data.goals, 'short').filter((g) => g.status === 'active');
  const todayTasks = data.tasks.filter((t) => t.date === today);

  // 최근 7일 동안 못 끝낸 일
  const leftovers = data.tasks.filter((t) => !t.done && t.date < today && daysBetween(t.date, today) <= 7);

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

  const choices = shorts.filter((g) => !todayTasks.some((t) => t.goalId === g.id));

  return (
    <>
      {leftovers.length > 0 && (
        <Section title="지난번에 못 끝낸 일" hint="오늘 이어서 해도 좋고, 놓아줘도 괜찮아요.">
          <Card style={styles.list}>
            {leftovers.map((t, i) => (
              <View key={t.id} style={[styles.leftover, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.hairline }]}>
                <AppText variant="body" tone="textStrong" style={styles.flex}>
                  {t.title}
                </AppText>
                <Button
                  label="오늘로"
                  kind="secondary"
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

      <Section title="오늘 집중할 일" hint={`이번 주 계획에서 고르거나 직접 적어요. ${count}/${MAX_PICKS}`}>
        {(todayTasks.length > 0 || choices.length > 0 || custom.length > 0) && (
          <View style={styles.chips}>
            {todayTasks.map((t) => (
              <Chip key={t.id} label={t.title} selected />
            ))}
            {choices.map((g) => (
              <Chip
                key={g.id}
                label={g.title}
                selected={picked.includes(g.id)}
                disabled={full && !picked.includes(g.id)}
                onPress={() => togglePick(g.id)}
              />
            ))}
            {custom.map((t, i) => (
              <Chip
                key={`${t}-${i}`}
                label={t}
                selected
                onPress={() => setCustom((cs) => cs.filter((_, j) => j !== i))}
              />
            ))}
          </View>
        )}
        <AddField
          value={draft}
          onChange={setDraft}
          onAdd={addCustom}
          disabled={full}
          placeholder={full ? '오늘은 이 정도면 충분해요' : '직접 적기'}
        />
      </Section>

      <Section title="오늘의 다짐" hint="한 줄이면 충분해요. 비워둬도 괜찮아요.">
        <TextField value={intention} onChangeText={setIntention} placeholder="조급해하지 말고 한 걸음씩" />
      </Section>

      <Button label="오늘 시작하기" disabled={count === 0} onPress={start} />
    </>
  );
}

// ---- 오늘 할 일 (체크인 후) ----

function TodayList({ today }: { today: string }) {
  const { data, toggleTask, deleteTask, addTask } = useStore();
  const confirm = useConfirm();
  const [draft, setDraft] = useState('');
  const tasks = data.tasks.filter((t) => t.date === today);
  const checkin = data.checkins.find((x) => x.date === today);
  const doneCount = tasks.filter((t) => t.done).length;
  const allDone = tasks.length > 0 && doneCount === tasks.length;

  const pathLabel = (t: Task) => {
    const parts = ancestry(data.goals, t.goalId)
      .filter((g) => g.level === 'long')
      .map((g) => g.title);
    if (t.carriedFrom) parts.push('지난번에서 이어옴');
    return parts.join(' · ');
  };

  const remove = async (t: Task) => {
    if (await confirm({ title: '할 일 지우기', message: `“${t.title}”을(를) 지울까요?`, okLabel: '지우기' }))
      deleteTask(t.id);
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
          <AppText variant="captionStrong" tone="textFaint">
            오늘의 다짐
          </AppText>
          <AppText variant="lead" tone="textStrong">
            {checkin.intention}
          </AppText>
        </View>
      )}

      <Section
        title={allDone ? '오늘의 초점을 모두 해냈어요' : '오늘의 초점'}
        hint={
          allDone
            ? '멋진 하루예요. 이제 푹 쉬어도 괜찮아요.'
            : `${doneCount}/${tasks.length} 완료 · 누르면 완료, 길게 누르면 지우기`
        }>
        <Card style={styles.list}>
          {tasks.length === 0 && (
            <AppText variant="body" tone="textFaint" style={styles.emptyLine}>
              오늘은 아직 할 일이 없어요.
            </AppText>
          )}
          {tasks.map((t, i) => (
            <CheckRow
              key={t.id}
              title={t.title}
              subtitle={pathLabel(t) || undefined}
              done={t.done}
              last={i === tasks.length - 1}
              onToggle={() => {
                tap(t.done ? 'light' : 'success');
                toggleTask(t.id);
              }}
              onLongPress={() => remove(t)}
            />
          ))}
        </Card>
        <AddField value={draft} onChange={setDraft} onAdd={add} placeholder="할 일 더하기" />
      </Section>

      <TextLink label="목표 지도에서 계획 다듬기" onPress={() => router.navigate('/goals')} />
    </>
  );
}

// ---- 작은 부품 ----

function AddField(props: {
  value: string;
  onChange: (t: string) => void;
  onAdd: () => void;
  placeholder: string;
  disabled?: boolean;
}) {
  const c = useTheme();
  const can = !!props.value.trim() && !props.disabled;
  return (
    <View style={styles.addRow}>
      <TextField
        style={styles.flex}
        value={props.value}
        onChangeText={props.onChange}
        placeholder={props.placeholder}
        editable={!props.disabled}
        onSubmitEditing={props.onAdd}
        returnKeyType="done"
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="추가"
        onPress={props.onAdd}
        disabled={!can}
        style={({ pressed }) => [
          styles.addBtn,
          { backgroundColor: can ? c.accentFill : c.hairline },
          pressScale(pressed),
        ]}>
        <Plus size={20} color={can ? c.onAccent : c.textFaint} weight="bold" />
      </Pressable>
    </View>
  );
}

function TextLink({ label, onPress }: { label: string; onPress: () => void }) {
  const c = useTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.link, { opacity: pressed ? 0.6 : 1 }]}>
      <AppText variant="body" tone="accent">
        {label}
      </AppText>
      <CaretRight size={14} color={c.accent} weight="bold" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { gap: Space.xxs },
  skyTile: {
    borderRadius: Radius.card,
    paddingHorizontal: Space.lg,
    paddingTop: Space.lg + 4,
    paddingBottom: Space.section + 8, // 아래쪽은 해가 뜨는 자리
    gap: Space.sm,
  },
  onSky: { color: OnSky.strong },
  onSkyMuted: { color: OnSky.muted },
  tileAction: { flexDirection: 'row', marginTop: Space.xs },
  flex: { flex: 1, minWidth: 0 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.xs },
  addRow: { flexDirection: 'row', gap: Space.xs, alignItems: 'center' },
  addBtn: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  list: { paddingVertical: Space.xxs, gap: 0 },
  leftover: { flexDirection: 'row', alignItems: 'center', gap: Space.sm, paddingVertical: Space.sm },
  intention: { gap: Space.xxs },
  emptyLine: { paddingVertical: Space.sm },
  link: { flexDirection: 'row', alignItems: 'center', gap: Space.xxs, alignSelf: 'center', minHeight: 44 },
});
