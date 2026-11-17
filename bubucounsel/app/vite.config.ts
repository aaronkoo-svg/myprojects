import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // 정적 번들을 어디에 올려도 동작하도록 상대 경로로 빌드한다.
  base: './',
  plugins: [react()],
  build: { outDir: 'dist' },
  test: { environment: 'node' },
});
