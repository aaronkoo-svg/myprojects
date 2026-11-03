import { Compass } from 'phosphor-react-native';

import { AppText } from '@/components/app-text';
import { EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';

export default function GoalsScreen() {
  return (
    <Screen>
      <AppText variant="title">목표 지도</AppText>
      <EmptyState
        icon={Compass}
        title="비전에서 오늘까지, 한눈에"
        body="미래 비전, 장기 목표, 단기 계획이 이곳에 나무처럼 이어져요."
      />
    </Screen>
  );
}
