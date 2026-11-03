const { chromium } = require('playwright');
const out = process.argv[2];
// 디자인: 새벽 하늘 그라데이션 + 지평선 위로 떠오르는 반원 해
const sky = `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#1D4FBF"/><stop offset="0.48" stop-color="#5A8DE8"/>
  <stop offset="0.76" stop-color="#E9A7A6"/><stop offset="1" stop-color="#FFD4A3"/></linearGradient>`;
// 해와 지평선 (cx, 지평선 y, 반지름, 선 두께)
// 해 하나: 새벽 하늘 아래쪽, 따뜻한 빛 바로 위에 낮게 뜬 원
const mark = (color, cy=600, r=190) => `<circle cx="512" cy="${cy}" r="${r}" fill="${color}"/>`;
const files = {
  // iOS·기본 아이콘: 꽉 찬 정사각형 (모서리는 OS가 깎는다)
  'icon.png': `<rect width="1024" height="1024" fill="url(#sky)"/>${mark('#FFFFFF')}`,
  // 안드로이드 적응형: 배경 / 전경(안전 영역 안쪽으로 작게) / 단색
  'android-icon-background.png': `<rect width="1024" height="1024" fill="url(#sky)"/>`,
  'android-icon-foreground.png': mark('#FFFFFF', 560, 140),
  'android-icon-monochrome.png': mark('#FFFFFF', 560, 140),
  // 시작 화면 로고: 파란 해
  'splash-icon.png': `<rect width="1024" height="1024" rx="230" fill="url(#sky)"/>${mark('#FFFFFF')}`,
  'favicon.png': `<rect width="1024" height="1024" rx="230" fill="url(#sky)"/>${mark('#FFFFFF')}`,
  'preview-rounded.png': `<rect width="1024" height="1024" rx="230" fill="url(#sky)"/>${mark('#FFFFFF')}`,
};
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1024, height: 1024 } });
  for (const [name, body] of Object.entries(files)) {
    const size = name === 'favicon.png' ? 48 : 1024;
    await p.setViewportSize({ width: size, height: size });
    await p.setContent(`<html><body style="margin:0;background:transparent"><svg width="${size}" height="${size}" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><defs>${sky}</defs>${body}</svg></body></html>`);
    await p.screenshot({ path: `${out}/${name}`, omitBackground: true });
  }
  await b.close();
})();
