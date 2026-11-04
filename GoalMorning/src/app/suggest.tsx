import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { Tile } from '@/components/card';
import { ArrowClockwise, Check } from '@/components/icons';
import { SheetHeader } from '@/components/sheet-header';
import { Layout, pressScale, Radius, Space } from '@/constants/theme';
import { childrenOf, useStore } from '@/data/store';
import { LevelLabel, type Goal } from '@/data/types';
import { useTheme } from '@/hooks/use-theme';
import { AiError, suggestGoals, type Suggestion } from '@/lib/ai';
import { tap } from '@/lib/feedback';

// AI 제안 화면.
// level=long : 비전(parentId) 아래 장기 목표 후보 → 고른 것을 추가 → 이어서 각 목표의 이번 주 계획 제안
// level=short: 장기 목표(parentId) 아래 이번 주 계획 후보. queue에 다음 장기 목표들이 남아 있으면 이어서 진행
type Params = { level?: string; parentId?: string; queue?: string; step?: string; total?: string };

type State =
  | { kind: 'loading' }
  | { kind: 'error'; error: AiError }
  | { kind: 'ready'; list: Suggestion[] }
  | { kind: 'added'; ids: string[] };

export default function SuggestScreen() {
  const c = useTheme();
  const p = useLocalSearchParams<Params>();
  const { data, addGoal } = useStore();

  const level = p.level === 'short' ? 'short' : 'long';
  const parent = data.goals.find((g) => g.id === p.parentId);
  const vision = level === 'short' ? data.goals.find((g) => g.id === parent?.parentId) : parent;
  const queue = (p.queue ?? '').split(',').filter(Boolean);
  const step = Number(p.step ?? 0);
  const total = Number(p.total ?? 0);

  const [state, setState] = useState<State>({ kind: 'loading' });
  const [picked, setPicked] = useState<number[]>([]);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/goals'));

  const load = useCallback(async () => {
    if (!parent) return;
    setState({ kind: 'loading' });
    setPicked([]);
    const existing = childrenOf(data.goals, parent.id).map((g) => g.title);
    try {
      const list =
        level === 'long'
          ? await suggestGoals({ level: 'long', vision: pick(parent), existing })
          : await suggestGoals({ level: 'short', vision: vision ? pick(vision) : undefined, long: pick(parent), existing });
      setState({ kind: 'ready', list });
    } catch (e) {
      setState({ kind: 'error', error: e instanceof AiError ? e : new AiError('unknown', '다시 시도해 주세요.') });
    }
    // 화면을 열 때와 "다시 제안받기"에서만 부른다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parent?.id, level]);

  useEffect(() => {
    load();
  }, [load]);

  // API 키 화면에 다녀오면(화면에 다시 들어올 때만) 키 문제였던 경우 다시 시도
  const stateRef = useRef(state);
  stateRef.current = state;
  const loadRef = useRef(load);
  loadRef.current = load;
  useFocusEffect(
    useCallback(() => {
      const st = stateRef.current;
      if (st.kind === 'error' && (st.error.kind === 'no-key' || st.error.kind === 'bad-key')) loadRef.current();
    }, []),
  );

  // 다음 장기 목표의 이번 주 계획으로 넘어가기
  const goNext = (ids: string[], nextStep: number, nextTotal: number) => {
    const [first, ...rest] = ids;
    if (!first) return close();
    router.replace(
      `/suggest?level=short&parentId=${first}&queue=${rest.join(',')}&step=${nextStep}&total=${nextTotal}`,
    );
  };

  const add = () => {
    if (state.kind !== 'ready' || !parent) return;
    const ids = picked.map((i) => addGoal({ level, title: state.list[i].title, why: state.list[i].why, parentId: parent.id }).id);
    tap('success');
    if (level === 'long') setState({ kind: 'added', ids });
    else if (queue.length) goNext(queue, step + 1, total);
    else close();
  };

  if (!parent) {
    return (
      <SafeAreaView style={[styles.fill, { backgroundColor: c.canvas }]}>
        <SheetHeader title="AI 제안" left={{ label: '닫기', onPress: close }} />
        <View style={styles.page}>
          <AppText variant="body">기준이 되는 목표를 찾을 수 없어요.</AppText>
        </View>
      </SafeAreaView>
    );
  }

  const title = level === 'long' ? '장기 목표 제안' : `이번 주 계획 제안${total > 1 ? ` ${step}/${total}` : ''}`;
  const skip = level === 'short' && queue.length ? { label: '건너뛰기', onPress: () => goNext(queue, step + 1, total) } : undefined;

  return (
    <SafeAreaView style={[styles.fill, { backgroundColor: c.canvas }]}>
      <SheetHeader title={title} left={{ label: '닫기', onPress: close }} right={skip} />
      <ScrollView contentContainerStyle={styles.page}>
        <Tile style={styles.context}>
          <AppText variant="captionStrong" tone="onTileMuted">
            {LevelLabel[parent.level]}
          </AppText>
          <AppText variant="tagline" tone="onTile">
            {parent.title}
          </AppText>
        </Tile>

        {state.kind === 'loading' && (
          <View style={styles.center}>
            <ActivityIndicator color={c.accent} />
            <AppText variant="body" tone="textFaint">
              {level === 'long' ? '이 비전으로 가는 길을 그려보고 있어요…' : '이번 주에 할 수 있는 걸 찾고 있어요…'}
            </AppText>
          </View>
        )}

        {state.kind === 'error' && (
          <View style={styles.center}>
            <AppText variant="body" style={styles.centerText}>
              {state.error.message}
            </AppText>
            {state.error.kind === 'no-key' || state.error.kind === 'bad-key' ? (
              <Button label="API 키 설정하기" onPress={() => router.push('/ai-key')} />
            ) : (
              <Button label="다시 시도" kind="secondary" onPress={load} />
            )}
          </View>
        )}

        {state.kind === 'ready' && (
          <>
            <View style={styles.head}>
              <AppText variant="tagline">
                {level === 'long' ? '마음에 드는 목표를 골라주세요' : '이번 주에 해볼 계획을 골라주세요'}
              </AppText>
              <AppText variant="caption">여러 개 골라도 돼요. 추가한 뒤에 언제든 고칠 수 있어요.</AppText>
            </View>
            <View style={styles.list}>
              {state.list.map((s, i) => (
                <SuggestionCard
                  key={`${s.title}-${i}`}
                  s={s}
                  selected={picked.includes(i)}
                  onPress={() => {
                    tap();
                    setPicked((ps) => (ps.includes(i) ? ps.filter((x) => x !== i) : [...ps, i]));
                  }}
                />
              ))}
            </View>
            <Button label={picked.length ? `${picked.length}개 추가` : '골라서 추가'} disabled={!picked.length} onPress={add} />
            <Pressable onPress={load} style={({ pressed }) => [styles.retry, { opacity: pressed ? 0.6 : 1 }]}>
              <ArrowClockwise size={16} color={c.accent} weight="bold" />
              <AppText variant="body" tone="accent">
                다른 제안 받기
              </AppText>
            </Pressable>
          </>
        )}

        {state.kind === 'added' && (
          <View style={styles.center}>
            <AppText variant="title" style={styles.centerText}>
              장기 목표 {state.ids.length}개를 더했어요
            </AppText>
            <AppText variant="body" tone="textFaint" style={styles.centerText}>
              이어서 목표마다 이번 주에 할 수 있는 계획도 제안받아 볼까요?
            </AppText>
            <View style={styles.actions}>
              <Button label="이어서 제안받기" onPress={() => goNext(state.ids, 1, state.ids.length)} />
              <Button label="여기까지 할게요" kind="text" onPress={close} />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SuggestionCard({ s, selected, onPress }: { s: Suggestion; selected: boolean; onPress: () => void }) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: c.surface,
          borderColor: selected ? c.accentFocus : 'transparent',
        },
        pressScale(pressed),
      ]}>
      <View
        style={[
          styles.circle,
          { borderColor: selected ? c.accent : c.textDisabled, backgroundColor: selected ? c.accent : 'transparent' },
        ]}>
        {selected && <Check size={13} weight="bold" color={c.onAccent} />}
      </View>
      <View style={styles.cardText}>
        <AppText variant="bodyStrong">{s.title}</AppText>
        {!!s.why && <AppText variant="caption">{s.why}</AppText>}
      </View>
    </Pressable>
  );
}

const pick = (g: Goal) => ({ title: g.title, why: g.why });

const styles = StyleSheet.create({
  fill: { flex: 1 },
  page: {
    paddingHorizontal: Layout.screenX,
    paddingTop: Space.lg,
    paddingBottom: Space.xxl,
    gap: Space.lg,
    width: '100%',
    maxWidth: Layout.maxWidth,
    alignSelf: 'center',
  },
  context: { paddingVertical: Space.lg, gap: Space.xxs },
  head: { gap: Space.xxs },
  list: { gap: Space.xs },
  card: {
    flexDirection: 'row',
    gap: Space.sm,
    padding: Space.md,
    borderRadius: Radius.card,
    borderWidth: 2,
    alignItems: 'flex-start',
  },
  circle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  cardText: { flex: 1, minWidth: 0, gap: Space.xxs },
  center: { alignItems: 'center', gap: Space.md, paddingVertical: Space.xxl },
  centerText: { textAlign: 'center' },
  actions: { alignSelf: 'stretch', gap: Space.xxs },
  retry: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Space.xs, minHeight: 44 },
});
