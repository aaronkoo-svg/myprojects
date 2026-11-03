// 시간대별 하늘색. 앱의 유일한 그라데이션이며, 비전 타일과 온보딩 무대에만 쓴다.
// 위쪽은 어둡게 두어 흰 글자가 읽히고, 아래 25%에만 따뜻한 빛이 든다.

export type SkyPeriod = 'dawn' | 'morning' | 'day' | 'evening' | 'night';

type Sky = { stops: [number, string][]; sun: number; label: string };

export const Skies: Record<SkyPeriod, Sky> = {
  dawn: {
    stops: [[0, '#1B2B5E'], [0.55, '#3F57A6'], [0.82, '#C98E9E'], [1, '#F2BE98']],
    sun: 0.85,
    label: '새벽',
  },
  morning: {
    stops: [[0, '#1D4FBF'], [0.55, '#4A80E0'], [0.82, '#DFA0A8'], [1, '#FFD4A3']],
    sun: 1,
    label: '아침',
  },
  day: {
    stops: [[0, '#1556C4'], [0.6, '#2F7AE0'], [1, '#7FB2EE']],
    sun: 1,
    label: '낮',
  },
  evening: {
    stops: [[0, '#26296A'], [0.55, '#5E4A92'], [0.82, '#D27C72'], [1, '#F0A877']],
    sun: 0.9,
    label: '저녁',
  },
  night: {
    stops: [[0, '#0A0F24'], [0.6, '#15204A'], [1, '#24346A']],
    sun: 0.35, // 달처럼 옅게
    label: '밤',
  },
};

export function skyPeriod(d: Date = new Date()): SkyPeriod {
  const h = d.getHours();
  if (h >= 4 && h < 7) return 'dawn';
  if (h >= 7 && h < 11) return 'morning';
  if (h >= 11 && h < 17) return 'day';
  if (h >= 17 && h < 20) return 'evening';
  return 'night';
}

// 하늘 위 글자색
export const OnSky = { strong: '#FFFFFF', muted: 'rgba(255,255,255,0.86)' };
