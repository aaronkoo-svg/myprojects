/**
 * 안드로이드 테스트 APK(Capacitor) 전용 설정.
 * 토스 출시 빌드에서는 불러오지 않는다.
 */
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { runBackHandler } from './back';

export function setupNative(): void {
  if (!Capacitor.isNativePlatform()) return;

  // 안드로이드 뒤로가기: 겹친 화면 닫기 → 이전 화면 → 첫 화면이면 앱 종료
  void App.addListener('backButton', ({ canGoBack }) => {
    if (runBackHandler()) return;
    if (canGoBack) window.history.back();
    else void App.exitApp();
  });
}
