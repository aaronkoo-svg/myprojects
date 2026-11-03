import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { CaretLeft } from '@/components/icons';
import { Sky } from '@/components/sky';
import { TextField } from '@/components/text-field';
import { OnSky, type SkyPeriod } from '@/constants/sky';
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

// 0: 소개(새벽 하늘), 1~3: 질문(밝은 화면), 4: 완료(아침 하늘)
export default function Onboarding() {
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

  if (step === 0) {
    return (
      <Stage
        period="dawn"
        eyebrow="GoalMorning"
        headline={'매일 아침 1분,\n내 꿈을 다시\n떠올려요'}
        lead="세 가지 질문에 답하면 준비가 끝나요."
        primary={{ label: '시작하기', onPress: () => setStep(1) }}
        secondary={{ label: '일단 둘러볼게요', onPress: done }}
      />
    );
  }

  if (step === 4) {
    const vision = answers[0].title.trim();
    return (
      <Stage
        period="morning"
        eyebrow="준비 완료"
        headline={'이제 첫 아침을\n시작해봐요'}
        lead={vision ? `“${vision}”` : '목표는 언제든 ‘목표’ 탭에서 채울 수 있어요.'}
        primary={{
          label: '첫 체크인 하기',
          onPress: () => {
            tap('success');
            done();
          },
        }}
      />
    );
  }

  return (
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
  );
}

// 애플 제품 타일처럼 가운데 정렬된 큰 제목과 알약 버튼. 무대는 하늘, 가운데에 해가 떠오른다
function Stage(props: {
  period: SkyPeriod;
  eyebrow: string;
  headline: string;
  lead: string;
  primary: { label: string; onPress: () => void };
  secondary?: { label: string; onPress: () => void };
}) {
  // 화면이 열리면 해가 한 번 천천히 떠오른다 (동작 줄이기 설정이면 바로 제자리)
  const rise = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduce) => {
        if (cancelled) return;
        if (reduce) rise.setValue(1);
        else
          Animated.timing(rise, {
            toValue: 1,
            duration: 1600,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: Platform.OS !== 'web',
          }).start();
      });
    return () => {
      cancelled = true;
    };
  }, [rise]);

  const sunMotion = {
    opacity: rise,
    transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [90, 0] }) }],
  };

  return (
    <Sky period={props.period} style={styles.fill} sun={{ size: 168, bottom: 210, centered: true }} sunStyle={sunMotion}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.fill}>
        <View style={styles.stage}>
          <View style={styles.stageText}>
            <AppText variant="captionStrong" style={[styles.center, styles.onSkyMuted]}>
              {props.eyebrow}
            </AppText>
            <AppText variant="hero" tone="onTile" style={[styles.center, styles.stageHeadline]}>
              {props.headline}
            </AppText>
            <AppText variant="lead" style={[styles.center, styles.onSkyMuted]}>
              {props.lead}
            </AppText>
          </View>
          <View style={styles.stageActions}>
            <Button label={props.primary.label} onPress={props.primary.onPress} />
            {props.secondary && (
              <Button label={props.secondary.label} kind="text" onTile onPress={props.secondary.onPress} />
            )}
          </View>
        </View>
      </SafeAreaView>
    </Sky>
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
    <SafeAreaView style={[styles.fill, { backgroundColor: c.canvas }]}>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.topBar}>
          <Pressable accessibilityLabel="뒤로" hitSlop={12} onPress={onBack} style={styles.back}>
            <CaretLeft size={22} color={c.accent} weight="bold" />
          </Pressable>
          <View style={styles.progress}>
            {QUESTIONS.map((_, i) => (
              <View key={i} style={[styles.segment, { backgroundColor: i <= index ? c.accent : c.hairline }]} />
            ))}
          </View>
          <Pressable hitSlop={12} onPress={onSkip} style={styles.skip}>
            <AppText variant="body" tone="accent">
              건너뛰기
            </AppText>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
          <View style={styles.qHead}>
            <AppText variant="captionStrong" tone="textFaint">
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { textAlign: 'center' },
  onSkyMuted: { color: OnSky.muted },
  stage: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenX,
    paddingTop: Space.section * 1.5,
    paddingBottom: Space.lg,
    width: '100%',
    maxWidth: Layout.maxWidth,
    alignSelf: 'center',
  },
  stageText: { gap: Space.sm, alignItems: 'center' },
  stageHeadline: { fontSize: 40, lineHeight: 46, letterSpacing: -1.2 },
  stageActions: { gap: Space.xxs },
  page: {
    paddingHorizontal: Layout.screenX,
    paddingTop: Space.lg,
    paddingBottom: Space.xxl,
    gap: Space.lg,
    width: '100%',
    maxWidth: Layout.maxWidth,
    alignSelf: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.screenX - 8,
    minHeight: 52,
    gap: Space.sm,
  },
  back: { width: 44, height: 44, justifyContent: 'center', paddingLeft: 8 },
  progress: { flex: 1, flexDirection: 'row', gap: 4 },
  segment: { flex: 1, height: 3, borderRadius: 2 },
  skip: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 },
  qHead: { gap: Space.xs },
  examples: { gap: Space.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.xs },
});
