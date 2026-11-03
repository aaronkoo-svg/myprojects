import { BellSimple } from 'phosphor-react-native';

import { AppText } from '@/components/app-text';
import { EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';

export default function SettingsScreen() {
  return (
    <Screen>
      <AppText variant="title">설정</AppText>
      <EmptyState
        icon={BellSimple}
        title="알림과 백업은 곧 열려요"
        body="아침·저녁 알림 시간과 데이터 백업을 여기서 정할 수 있게 될 거예요."
      />
    </Screen>
  );
}
