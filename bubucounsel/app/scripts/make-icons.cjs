/**
 * 투닥 앱 아이콘을 만든다. (Playwright가 설치된 환경에서 실행)
 *   node scripts/make-icons.cjs
 * 결과: 안드로이드 런처 아이콘·스플래시, 웹 아이콘, 토스 콘솔용 600×600 로고
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const APP = path.resolve(__dirname, '..');
const RES = path.join(APP, 'android/app/src/main/res');
const BRAND = path.resolve(APP, '../docs/brand');

// 펠트 질감 말풍선 캐릭터 (components/Mascot.tsx의 blue와 같은 모양)
const mascot = (id) => `
<svg viewBox="0 0 220 206" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="${id}b" cx="36%" cy="28%" r="80%">
      <stop offset="0" stop-color="#b9e0ff"/><stop offset="0.48" stop-color="#5cb2f7"/><stop offset="1" stop-color="#2a78d4"/>
    </radialGradient>
    <filter id="${id}f" x="-15%" y="-15%" width="130%" height="130%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G" result="fuzzy"/>
      <feColorMatrix in="noise" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.3 0" result="speck"/>
      <feComposite in="speck" in2="fuzzy" operator="in" result="speckIn"/>
      <feBlend in="speckIn" in2="fuzzy" mode="screen"/>
    </filter>
  </defs>
  <path filter="url(#${id}f)" fill="url(#${id}b)" d="M110 26c50 0 82 30 82 70 0 40-32 66-80 66h-14l-26 22 5-26c-31-9-49-33-49-62 0-40 32-70 82-70z"/>
  <ellipse cx="62" cy="112" rx="11" ry="7" fill="#ff9ec4" opacity="0.5"/>
  <ellipse cx="156" cy="110" rx="11" ry="7" fill="#ff9ec4" opacity="0.5"/>
  <circle cx="86" cy="88" r="20" fill="#fff" stroke="#dfe6f0" stroke-width="1.5"/>
  <circle cx="132" cy="86" r="20" fill="#fff" stroke="#dfe6f0" stroke-width="1.5"/>
  <circle cx="90" cy="92" r="9.5" fill="#17181c"/><circle cx="136" cy="90" r="9.5" fill="#17181c"/>
  <circle cx="93" cy="88" r="2.8" fill="#fff"/><circle cx="139" cy="86" r="2.8" fill="#fff"/>
  <path d="M100 120q10 8 20 0" stroke="#163f7a" stroke-width="5" stroke-linecap="round" fill="none"/>
</svg>`;

const BG = 'radial-gradient(120% 100% at 50% 0%, #cfe4ff 0%, #e3eeff 50%, #f4f8ff 100%)';

/** kind: full(바탕+캐릭터), round(원), fg(투명 바탕, 적응형 아이콘 안전 영역), bg(바탕만), splash */
function page(size, kind, w = size, h = size) {
  const art = { full: 0.74, round: 0.68, fg: 0.56, splash: 0.26 }[kind] ?? 0;
  const bg = kind === 'fg' ? 'transparent' : kind === 'splash' ? '#ffffff' : BG;
  const radius = kind === 'round' ? '50%' : '0';
  const box = Math.round(Math.min(w, h) * art);
  return `<!doctype html><html><head><style>
    html,body{margin:0;background:transparent}
    .c{width:${w}px;height:${h}px;background:${bg};border-radius:${radius};display:flex;align-items:center;justify-content:center;overflow:hidden}
    .m{width:${box}px;height:${box}px;transform:translateY(${Math.round(box * 0.03)}px)}
  </style></head><body><div class="c">${art ? `<div class="m">${mascot('i')}</div>` : ''}</div></body></html>`;
}

async function shot(browser, file, size, kind, w, h) {
  const p = await browser.newPage({ viewport: { width: w ?? size, height: h ?? size }, deviceScaleFactor: 1 });
  await p.setContent(page(size, kind, w, h));
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await p.screenshot({ path: file, omitBackground: true, clip: { x: 0, y: 0, width: w ?? size, height: h ?? size } });
  await p.close();
}

(async () => {
  const browser = await chromium.launch();
  const densities = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
  for (const [name, scale] of Object.entries(densities)) {
    const dir = path.join(RES, `mipmap-${name}`);
    await shot(browser, path.join(dir, 'ic_launcher.png'), 48 * scale, 'full');
    await shot(browser, path.join(dir, 'ic_launcher_round.png'), 48 * scale, 'round');
    await shot(browser, path.join(dir, 'ic_launcher_foreground.png'), 108 * scale, 'fg');
    await shot(browser, path.join(dir, 'ic_launcher_background.png'), 108 * scale, 'bg');
  }
  // 스플래시: 기존 파일과 같은 크기로 다시 만든다.
  for (const entry of fs.readdirSync(RES)) {
    const file = path.join(RES, entry, 'splash.png');
    if (!entry.startsWith('drawable') || !fs.existsSync(file)) continue;
    const buf = fs.readFileSync(file);
    const w = buf.readUInt32BE(16);
    const h = buf.readUInt32BE(20);
    await shot(browser, file, Math.min(w, h), 'splash', w, h);
  }
  await shot(browser, path.join(APP, 'public/icon-192.png'), 192, 'full');
  await shot(browser, path.join(APP, 'public/apple-touch-icon.png'), 180, 'full');
  await shot(browser, path.join(APP, 'public/favicon.png'), 64, 'full');
  // 토스 콘솔 로고: 600×600, 각진 정사각형, 바탕 있음
  await shot(browser, path.join(BRAND, 'logo-600.png'), 600, 'full');
  await browser.close();
  console.log('아이콘을 만들었어요.');
})();
