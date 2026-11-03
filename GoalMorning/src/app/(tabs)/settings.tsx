import { router } from 'expo-router';
import { BellSimple } from '@/components/icons';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';
import { Section } from '@/components/section';
import { useStore } from '@/data/store';
import { useConfirm } from '@/components/confirm-dialog';

export default function SettingsScreen() {
  const { resetAll } = useStore();
  const confirm = useConfirm();

  const reset = async () => {
    const ok = await confirm({
      title: '처음부터 다시 시작',
      message: '모든 목표와 기록이 지워지고 첫 화면으로 돌아가요. 되돌릴 수 없어요.',
      okLabel: '모두 지우기',
    });
    if (ok) {
      resetAll();
      router.replace('/onboarding');
    }
  };

  return (
    <Screen>
      <AppText variant="title">설정</AppText>
      <EmptyState
        icon={BellSimple}
        title="알림과 백업은 다음 단계에서 열려요"
        body="아침·저녁 알림 시간과 데이터 백업을 여기서 정할 수 있게 될 거예요."
      />
      <Section title="데이터" hint="이 폰에만 저장돼요.">
        <Button label="처음부터 다시 시작" kind="quiet" onPress={reset} />
      </Section>
    </Screen>
  );
}
