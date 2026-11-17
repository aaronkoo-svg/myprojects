/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_AD_GROUP_ID?: string;
}
interface Window {
  ReactNativeWebView?: unknown;
}
