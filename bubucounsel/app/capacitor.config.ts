import type { CapacitorConfig } from '@capacitor/cli';

/**
 * 안드로이드 테스트 APK 설정. 토스 미니앱 출시와는 별개다.
 * 빌드: npm run apk
 */
const config: CapacitorConfig = {
  appId: 'com.bubucounsel.test',
  appName: '투닥',
  webDir: 'dist',
  plugins: {
    // 흰 바탕이므로 상태 표시줄 글자를 어둡게. 여백은 CSS의 safe-area 값으로 맞춘다.
    SystemBars: { style: 'LIGHT' },
  },
};

export default config;
