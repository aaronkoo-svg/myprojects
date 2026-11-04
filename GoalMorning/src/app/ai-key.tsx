import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { SheetHeader } from '@/components/sheet-header';
import { TextField } from '@/components/text-field';
import { Layout, Space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { AiError, checkApiKey } from '@/lib/ai';
import { clearApiKey, getApiKey, maskKey, setApiKey } from '@/lib/ai-key';
import { tap } from '@/lib/feedback';

const STEPS = [
  'console.anthropic.com 에 로그인해요 (처음이면 가입).',
  '결제 정보(Billing)에 카드를 등록하고 소액을 충전해요.',
  'API Keys 메뉴에서 "Create Key"를 눌러 키를 만들어요.',
  'sk-ant- 로 시작하는 키를 복사해 아래에 붙여넣어요.',
];

export default function AiKeyScreen() {
  const c = useTheme();
  const [saved, setSaved] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    getApiKey().then(setSaved);
  }, []);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/settings'));

  const save = async () => {
    const k = draft.trim();
    if (!k) return;
    setBusy(true);
    setMessage(null);
    try {
      await checkApiKey(k);
      await setApiKey(k);
      setSaved(k);
      setDraft('');
      tap('success');
      setMessage({ ok: true, text: '연결됐어요. 이제 AI가 목표를 제안해 드릴 수 있어요.' });
    } catch (e) {
      setMessage({ ok: false, text: e instanceof AiError ? e.message : '키를 확인하지 못했어요.' });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    await clearApiKey();
    setSaved(null);
    setMessage({ ok: true, text: '키를 지웠어요.' });
  };

  return (
    <SafeAreaView style={[styles.fill, { backgroundColor: c.canvas }]}>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SheetHeader title="AI 도우미" left={{ label: '닫기', onPress: close }} />
        <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
          <View style={styles.head}>
            <AppText variant="title">윗단계만 적으면,{'\n'}나머지는 AI가 제안해요</AppText>
            <AppText variant="body" tone="textFaint">
              비전을 적으면 장기 목표를, 장기 목표를 적으면 이번 주 계획을 제안해 드려요. 고른 것만 저장돼요.
            </AppText>
          </View>

          <Card style={styles.status}>
            <AppText variant="captionStrong" tone="textFaint">
              지금 상태
            </AppText>
            <AppText variant="bodyStrong">{saved ? `연결됨 · ${maskKey(saved)}` : '아직 연결되지 않았어요'}</AppText>
          </Card>

          <View style={styles.section}>
            <AppText variant="tagline">API 키 받는 법</AppText>
            <Card style={styles.steps}>
              {STEPS.map((s, i) => (
                <View key={s} style={styles.step}>
                  <AppText variant="captionStrong" tone="accent" style={styles.stepNum}>
                    {i + 1}
                  </AppText>
                  <AppText variant="body" style={styles.flex}>
                    {s}
                  </AppText>
                </View>
              ))}
            </Card>
            <AppText variant="caption">
              AI 제안을 받을 때만 비전과 목표 문장이 Anthropic으로 전송돼요. 요금은 사용한 만큼 내 계정에 청구되고, 제안 한 번에 아주 적은 금액이에요. 키는 이 폰의 보안 저장소에만 보관돼요.
            </AppText>
          </View>

          <View style={styles.section}>
            <AppText variant="tagline">{saved ? '키 바꾸기' : '키 넣기'}</AppText>
            <TextField
              value={draft}
              onChangeText={setDraft}
              placeholder="sk-ant-..."
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              onSubmitEditing={save}
            />
            {message && (
              <AppText variant="caption" tone={message.ok ? 'accent' : 'textStrong'}>
                {message.text}
              </AppText>
            )}
            {busy ? (
              <View style={styles.busy}>
                <ActivityIndicator color={c.accent} />
                <AppText variant="caption">키를 확인하고 있어요…</AppText>
              </View>
            ) : (
              <Button label="확인하고 저장" disabled={!draft.trim()} onPress={save} />
            )}
            {saved && !busy && <Button label="키 지우기" kind="text" onPress={remove} />}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  flex: { flex: 1, minWidth: 0 },
  page: {
    paddingHorizontal: Layout.screenX,
    paddingTop: Space.lg,
    paddingBottom: Space.xxl,
    gap: Space.xl,
    width: '100%',
    maxWidth: Layout.maxWidth,
    alignSelf: 'center',
  },
  head: { gap: Space.xs },
  status: { gap: Space.xxs },
  section: { gap: Space.sm },
  steps: { gap: Space.sm, paddingVertical: Space.md },
  step: { flexDirection: 'row', gap: Space.sm, alignItems: 'flex-start' },
  stepNum: { width: 16, marginTop: 3 },
  busy: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Space.xs, minHeight: 50 },
});
