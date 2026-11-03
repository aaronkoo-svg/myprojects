import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// 가벼운 진동 (웹에서는 무시)
export function tap(kind: 'light' | 'success' = 'light') {
  if (Platform.OS === 'web') return;
  if (kind === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}
