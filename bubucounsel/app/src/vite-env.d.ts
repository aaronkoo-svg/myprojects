/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_AD_GROUP_ID?: string;
}
interface Window {
  ReactNativeWebView?: unknown;
}
interface ImportMetaEnv {
  /** 1이면 테스트 APK용 직접 분석 모드 */
  readonly VITE_DIRECT_MODE?: string;
}
