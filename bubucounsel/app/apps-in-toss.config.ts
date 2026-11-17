import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  // 앱인토스 콘솔에 등록한 앱 이름과 같아야 업로드할 수 있다.
  appName: 'bubucounsel',
  permissions: [
    { name: 'photos', access: 'read' },
    { name: 'clipboard', access: 'write' },
  ],
  navigationBar: {
    withBackButton: true,
    withHomeButton: false,
    withTitle: true,
    theme: 'light',
  },
  webView: {
    bounces: true,
    pullToRefreshEnabled: false,
    overScrollMode: 'never',
  },
  webBundleDir: 'dist',
});
