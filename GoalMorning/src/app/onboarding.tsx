import { router } from 'expo-router';
import { ArrowLeft } from '@/components/icons';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { TextField } from '@/components/text-field';
import { Layout, Space } from '@/constants/theme';
import { useStore } from '@/data/store';
import type { GoalLevel } from '@/data/types';
import { useTheme } from '@/hooks/use-theme';
import { tap } from '@/lib/feedback';

type Question = {
  level: GoalLevel;
  step: string;
  question: string;
  hint: string;
  examples: string[];
  whyPlaceholder: string;
};

const QUESTIONS: Question[] = [
  {
    level: 'vision',
    step: '미래 비전',
    question: '5년 후,\n어떤 하루를 보내고 싶나요?',
    hint: '거창하지 않아도 괜찮아요. 떠오르는 장면을 한 문장으로 적어봐요.',
    examples: [
      '좋아하는 일로 인정받으며 여유롭게 사는 사람',
      '건강한 몸과 마음으로 가족과 시간을 보내는 사람',
      '내 이름을 건 작은 가게를 운영하는 사람',
    ],
    whyPlaceholder: '왜 그런 삶을 원하나요? (선택)',
  },
  {
    level: 'long',
    step: '장기 목표',
    question: '그 모습을 위해\n올해 꼭 이루고 싶은 것은?',
    hint: '1~3년 안에 이룰 수 있는 구체적인 목표 하나면 충분해요.',
    examples: ['영어로 업무 미팅하기', '체지방 5kg 줄이기', '사이드 프로젝트 출시하기'],
    whyPlaceholder: '이 목표가 중요한 이유 (선택)',
  },
  {
    level: 'short',
    step: '단기 계획',
    question: '이번 주에 할 수 있는\n첫 걸음은 무엇일까요?',
    hint: '작을수록 좋아요. 아침마다 여기서 오늘 할 일을 골라요.',
    examples: ['매일 영어 표현 5개 외우기', '주 3회 30분 걷기', '앱 기획서 완성하기'],
    whyPlaceholder: '한 줄 메모 (선택)',
  },
];

// 0: 소개, 1~3: 질문, 4: 완료
export default function Onboarding() {
  const c = useTheme();
  const { addGoal, updateGoal, finishOnboarding } = useStore();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState(QUESTIONS.map(() => ({ title: '', why: '' })));
  const [savedIds, setSavedIds] = useState<(string | null)[]>([null, null, null]);

  const done = () => {
    finishOnboarding();
    router.replace('/');
  };

  const saveAndNext = (qi: number, skip: boolean) => {
    const a = answers[qi];
    if (!skip && a.title.trim()) {
      const existing = savedIds[qi];
      if (existing) {
        // 뒤로 갔다가 다시 온 경우: 새로 만들지 않고 고친다
        updateGoal(existing, { title: a.title.trim(), why: a.why.trim() });
      } else {
        // 바로 앞 단계에서 저장한 목표에 연결
        const parentId = qi > 0 ? savedIds[qi - 1] : null;
        const g = addGoal({ level: QUESTIONS[qi].level, title: a.title, why: a.why, parentId });
        setSavedIds((ids) => ids.map((id, i) => (i === qi ? g.id : id)));
      }
      tap();
    }
    setStep(qi + 2);
  };

  const setAnswer = (qi: number, patch: Partial<{ title: string; why: string }>) =>
    setAnswers((as) => as.map((a, i) => (i === qi ? { ...a, ...patch } : a)));

  return (
    <SafeAreaView style={[styles.fill, { backgroundColor: c.canvas }]}>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {step === 0 && (
          <View style={[styles.page, styles.center]}>
            <View style={styles.introText}>
              <AppText variant="caption" tone="accent">
                GoalMorning
              </AppText>
              <AppText variant="display">
                매일 아침 1분,{'\n'}내 꿈을 다시{'\n'}떠올려요
              </AppText>
              <AppText variant="quote" tone="textFaint">
                세 가지 질문에 답하면 준비가 끝나요.
              </AppText>
            </View>
            <View style={styles.actions}>
              <Button label="시작하기" onPress={() => setStep(1)} />
              <Button label="일단 둘러볼게요" kind="text" onPress={done} />
            </View>
          </View>
        )}

        {step >= 1 && step <= 3 && (
          <QuestionStep
            key={step}
            index={step - 1}
            q={QUESTIONS[step - 1]}
            value={answers[step - 1]}
            onChange={(p) => setAnswer(step - 1, p)}
            onBack={() => setStep(step - 1)}
            onNext={() => saveAndNext(step - 1, false)}
            onSkip={() => saveAndNext(step - 1, true)}
          />
        )}

        {step === 4 && (
          <View style={[styles.page, styles.center]}>
            <View style={styles.introText}>
              <AppText variant="caption" tone="accent">
                준비 완료
              </AppText>
              <AppText variant="display">
                좋아요,{'\n'}이제 첫 아침을{'\n'}시작해봐요
              </AppText>
              {answers[0].title.trim() ? (
                <AppText variant="quote">“{answers[0].title.trim()}”</AppText>
              ) : (
                <AppText variant="quote" tone="textFaint">
                  목표는 언제든 ‘목표’ 탭에서 채울 수 있어요.
                </AppText>
              )}
            </View>
            <View style={styles.actions}>
              <Button
                label="첫 체크인 하러 가기"
                onPress={() => {
                  tap('success');
                  done();
                }}
              />
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function QuestionStep(props: {
  index: number;
  q: Question;
  value: { title: string; why: string };
  onChange: (p: Partial<{ title: string; why: string }>) => void;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
}) {
  const { index, q, value, onChange, onBack, onNext, onSkip } = props;
  const c = useTheme();
  return (
    <View style={styles.fill}>
      <View style={styles.topBar}>
        <Pressable accessibilityLabel="뒤로" hitSlop={12} onPress={onBack} style={styles.back}>
          <ArrowLeft size={22} color={c.textStrong} />
        </Pressable>
        <View style={styles.dots}>
          {QUESTIONS.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, { backgroundColor: i <= index ? c.accent : c.line, width: i === index ? 20 : 8 }]}
            />
          ))}
        </View>
        <Pressable hitSlop={12} onPress={onSkip}>
          <AppText variant="label" tone="textFaint">
            건너뛰기
          </AppText>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <View style={styles.qHead}>
          <AppText variant="caption" tone="accent">
            {index + 1} / 3 · {q.step}
          </AppText>
          <AppText variant="title">{q.question}</AppText>
          <AppText variant="body" tone="textFaint">
            {q.hint}
          </AppText>
        </View>

        <TextField
          value={value.title}
          onChangeText={(t) => onChange({ title: t })}
          placeholder="여기에 적어주세요"
          returnKeyType="next"
          autoFocus={Platform.OS !== 'web'}
        />

        <View style={styles.examples}>
          <AppText variant="caption">이런 건 어때요?</AppText>
          <View style={styles.chips}>
            {q.examples.map((ex) => (
              <Chip key={ex} label={ex} selected={value.title === ex} onPress={() => onChange({ title: ex })} />
            ))}
          </View>
        </View>

        <TextField
          value={value.why}
          onChangeText={(t) => onChange({ why: t })}
          placeholder={q.whyPlaceholder}
          multiline
        />

        <Button label={index === 2 ? '완료' : '다음'} disabled={!value.title.trim()} onPress={onNext} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  page: {
    paddingHorizontal: Layout.screenX,
    paddingVertical: Space.xl,
    gap: Space.xl,
    width: '100%',
    maxWidth: Layout.maxWidth,
    alignSelf: 'center',
  },
  center: { flex: 1, justifyContent: 'space-between', paddingTop: Space.xxxl * 2 },
  introText: { gap: Space.lg },
  actions: { gap: Space.sm },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenX,
    paddingTop: Space.sm,
    minHeight: 48,
  },
  back: { width: 44, height: 44, justifyContent: 'center' },
  dots: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: { height: 8, borderRadius: 4 },
  qHead: { gap: Space.sm },
  examples: { gap: Space.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm },
});
