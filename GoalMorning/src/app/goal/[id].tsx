import { router, useLocalSearchParams } from 'expo-router';
import { X } from '@/components/icons';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { useConfirm } from '@/components/confirm-dialog';
import { Section } from '@/components/section';
import { TextField } from '@/components/text-field';
import { Layout, Space } from '@/constants/theme';
import { activeGoals, useStore } from '@/data/store';
import { LevelLabel, StatusLabel, type GoalLevel, type GoalStatus } from '@/data/types';
import { useTheme } from '@/hooks/use-theme';
import { tap } from '@/lib/feedback';

const PARENT_LEVEL: Record<GoalLevel, GoalLevel | null> = { vision: null, long: 'vision', short: 'long' };

const PLACEHOLDER: Record<GoalLevel, { title: string; why: string }> = {
  vision: { title: '예) 좋아하는 일로 인정받으며 여유롭게 사는 사람', why: '왜 그런 삶을 원하나요?' },
  long: { title: '예) 영어로 업무 미팅하기', why: '이 목표가 중요한 이유는?' },
  short: { title: '예) 매일 영어 표현 5개 외우기', why: '한 줄 메모' },
};

const STATUSES: GoalStatus[] = ['active', 'done', 'paused', 'archived'];

export default function GoalEditor() {
  const c = useTheme();
  const params = useLocalSearchParams<{ id: string; level?: string; parentId?: string }>();
  const { data, addGoal, updateGoal, deleteGoal } = useStore();
  const confirm = useConfirm();

  const isNew = params.id === 'new';
  const existing = isNew ? undefined : data.goals.find((g) => g.id === params.id);
  const level: GoalLevel =
    existing?.level ?? (['vision', 'long', 'short'].includes(params.level ?? '') ? (params.level as GoalLevel) : 'short');

  const [title, setTitle] = useState(existing?.title ?? '');
  const [why, setWhy] = useState(existing?.why ?? '');
  const [parentId, setParentId] = useState<string | null>(existing?.parentId ?? params.parentId ?? null);
  const [status, setStatus] = useState<GoalStatus>(existing?.status ?? 'active');

  const parentLevel = PARENT_LEVEL[level];
  const parents = parentLevel ? activeGoals(data.goals, parentLevel) : [];

  const close = () => (router.canGoBack() ? router.back() : router.replace('/goals'));

  if (!isNew && !existing) {
    return (
      <SafeAreaView style={[styles.fill, styles.page, { backgroundColor: c.canvas }]}>
        <AppText variant="body">이 목표를 찾을 수 없어요.</AppText>
        <Button label="닫기" kind="quiet" onPress={close} />
      </SafeAreaView>
    );
  }

  const save = () => {
    if (!title.trim()) return;
    if (existing) updateGoal(existing.id, { title: title.trim(), why: why.trim(), parentId, status });
    else addGoal({ level, title, why, parentId });
    tap('success');
    close();
  };

  const remove = async () => {
    if (!existing) return;
    const ok = await confirm({
      title: '목표 지우기',
      message: '지우면 되돌릴 수 없어요. 아래에 이어진 목표는 남아 있어요. 기록을 남기고 싶다면 ‘보관’을 선택해 주세요.',
      okLabel: '지우기',
    });
    if (ok) {
      deleteGoal(existing.id);
      close();
    }
  };

  return (
    <SafeAreaView style={[styles.fill, { backgroundColor: c.canvas }]}>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.topBar}>
          <AppText variant="label" tone="textFaint">
            {LevelLabel[level]} {isNew ? '더하기' : '다듬기'}
          </AppText>
          <Pressable accessibilityLabel="닫기" hitSlop={12} onPress={close} style={styles.close}>
            <X size={22} color={c.textStrong} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
          <Section title={LevelLabel[level]}>
            <TextField
              value={title}
              onChangeText={setTitle}
              placeholder={PLACEHOLDER[level].title}
              autoFocus={isNew && Platform.OS !== 'web'}
            />
          </Section>

          <Section title="왜 중요한가요?" hint="아침마다 이 문장을 다시 보여드려요.">
            <TextField value={why} onChangeText={setWhy} placeholder={PLACEHOLDER[level].why} multiline />
          </Section>

          {parentLevel && (
            <Section title={`어떤 ${LevelLabel[parentLevel]}로 이어지나요?`}>
              <View style={styles.chips}>
                {parents.map((p) => (
                  <Chip key={p.id} label={p.title} selected={parentId === p.id} onPress={() => setParentId(p.id)} />
                ))}
                <Chip label="연결 안 함" selected={!parentId} onPress={() => setParentId(null)} />
              </View>
            </Section>
          )}

          {!isNew && (
            <Section title="상태" hint="보관하면 지도에서 숨겨지지만 기록은 남아요.">
              <View style={styles.chips}>
                {STATUSES.map((s) => (
                  <Chip key={s} label={StatusLabel[s]} selected={status === s} onPress={() => setStatus(s)} />
                ))}
              </View>
            </Section>
          )}

          <Button label={isNew ? '더하기' : '저장'} disabled={!title.trim()} onPress={save} />
          {!isNew && <Button label="이 목표 지우기" kind="text" onPress={remove} />}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenX,
    paddingTop: Space.sm,
    minHeight: 52,
  },
  close: { width: 44, height: 44, alignItems: 'flex-end', justifyContent: 'center' },
  page: {
    paddingHorizontal: Layout.screenX,
    paddingVertical: Space.lg,
    gap: Space.xl,
    width: '100%',
    maxWidth: Layout.maxWidth,
    alignSelf: 'center',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm },
});
