import { CalendarBlank } from 'phosphor-react-native';

import { AppText } from '@/components/app-text';
import { EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';

export default function RecordsScreen() {
  return (
    <Screen>
      <AppText variant="title">기록</AppText>
      <EmptyState
        icon={CalendarBlank}
        title="첫 아침을 기다리고 있어요"
        body="체크인한 날과 이뤄낸 일들이 여기에 차곡차곡 쌓여요."
      />
    </Screen>
  );
}
