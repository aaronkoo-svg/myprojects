import { Mountains } from 'phosphor-react-native';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';
import { Space } from '@/constants/theme';

function greeting(date: Date) {
  const h = date.getHours();
  if (h < 5) return '고요한 새벽이에요';
  if (h < 11) return '좋은 아침이에요';
  if (h < 17) return '오늘도 잘 지내고 있나요';
  return '오늘 하루 수고했어요';
}

function todayLabel(date: Date) {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${days[date.getDay()]}요일`;
}

// 0단계: 디자인 확인용 오늘 화면. 체크인 기능은 1단계에서 연결한다.
export default function TodayScreen() {
  const now = new Date();
  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="caption">{todayLabel(now)}</AppText>
        <AppText variant="display">{greeting(now)}</AppText>
      </View>

      <EmptyState
        icon={Mountains}
        title="아직 그려둔 꿈이 없어요"
        body="5년 후 어떤 하루를 보내고 싶은지부터 천천히 적어봐요. 세 가지 질문이면 충분해요."
      />

      <Button label="내 비전 그려보기" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: Space.xs, marginBottom: Space.sm },
});
