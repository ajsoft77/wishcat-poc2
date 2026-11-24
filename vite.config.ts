import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // 상대 경로 빌드: 어떤 주소·하위 경로에 올려도 동작
  base: './',
  plugins: [react()],
  server: { host: true },
  preview: { host: true, allowedHosts: true },
  test: { include: ['tests/**/*.test.ts'] },
});
