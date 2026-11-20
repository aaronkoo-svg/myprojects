import { useId } from 'react';

/**
 * 토닥이와 친구들. 보송한 펠트 질감의 캐릭터를 SVG로 그린다.
 * blue(토닥이·말풍선), purple(동그라미), orange(네모), green(콩)
 */
export type MascotVariant = 'blue' | 'purple' | 'orange' | 'green';

const COLORS: Record<MascotVariant, [string, string, string, string]> = {
  // 밝은 쪽, 가운데, 어두운 쪽, 입
  blue: ['#b9e0ff', '#5cb2f7', '#2a78d4', '#163f7a'],
  purple: ['#e2d2ff', '#a77ef2', '#6c3fd1', '#3a1f7a'],
  orange: ['#ffd9a8', '#ff9f43', '#e06a12', '#8a3a06'],
  green: ['#d9ffb8', '#6fd34a', '#2f9a1e', '#1f5a12'],
};

const BODY: Record<MascotVariant, string> = {
  blue: 'M110 26c50 0 82 30 82 70 0 40-32 66-80 66h-14l-26 22 5-26c-31-9-49-33-49-62 0-40 32-70 82-70z',
  purple:
    'M58 54c-6-22 8-34 22-24 6 4 9 11 10 17 6-1 13-1 20-1 7 0 14 0 20 1 1-6 4-13 10-17 14-10 28 2 22 24 18 12 28 34 28 60 0 38-26 64-70 64s-70-26-70-64c0-26 10-48 28-60z',
  orange: 'M76 44h68c23 0 42 19 42 42v36c0 23-19 42-42 42H76c-23 0-42-19-42-42V86c0-23 19-42 42-42z',
  green: 'M70 40c30-12 64 4 80 28 22 32 18 76-14 92-30 16-76 8-96-22-20-32-4-86 30-98z',
};

/** 눈 두 개의 가운데 위치와 입 위치 */
const FACE: Record<MascotVariant, { eyes: [number, number][]; mouth: string; cheeks?: [number, number][] }> = {
  blue: { eyes: [[86, 88], [132, 86]], mouth: 'M100 120q10 8 20 0', cheeks: [[62, 112], [156, 110]] },
  purple: { eyes: [[80, 104], [120, 104]], mouth: 'M92 135q8 7 16 0', cheeks: [[62, 128], [138, 128]] },
  orange: { eyes: [[80, 96], [120, 96]], mouth: 'M90 130q10 10 20 0' },
  green: { eyes: [[84, 88], [122, 84]], mouth: 'M94 124q12 10 24 0' },
};

interface Props {
  variant?: MascotVariant;
  size?: number;
  /** 작은 아바타에서는 질감과 그림자를 끈다 */
  plain?: boolean;
  /** 장식이면 비워 둔다 */
  label?: string;
  className?: string;
}

export function Mascot({ variant = 'blue', size = 120, plain = false, label, className }: Props) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [light, mid, dark, mouth] = COLORS[variant];
  const face = FACE[variant];
  const body = BODY[variant];
  const viewBox = variant === 'blue' ? '0 0 220 206' : '0 0 200 200';
  const shadowY = variant === 'blue' ? 190 : 184;
  const cx = variant === 'blue' ? 110 : 100;

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox={viewBox}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    >
      <defs>
        <radialGradient id={`${id}-b`} cx="36%" cy="28%" r="80%">
          <stop offset="0" stopColor={light} />
          <stop offset="0.48" stopColor={mid} />
          <stop offset="1" stopColor={dark} />
        </radialGradient>
        {!plain && (
          <>
            <filter id={`${id}-f`} x="-15%" y="-15%" width="130%" height="130%">
              <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={7} result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale={6} xChannelSelector="R" yChannelSelector="G" result="fuzzy" />
              <feColorMatrix in="noise" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.35 0" result="speck" />
              <feComposite in="speck" in2="fuzzy" operator="in" result="speckIn" />
              <feBlend in="speckIn" in2="fuzzy" mode="screen" />
            </filter>
            <radialGradient id={`${id}-s`}>
              <stop offset="0" stopColor={dark} stopOpacity="0.28" />
              <stop offset="1" stopColor={dark} stopOpacity="0" />
            </radialGradient>
          </>
        )}
      </defs>
      {!plain && <ellipse cx={cx} cy={shadowY} rx="60" ry="9" fill={`url(#${id}-s)`} />}
      <path d={body} fill={`url(#${id}-b)`} filter={plain ? undefined : `url(#${id}-f)`} />
      {!plain && face.cheeks?.map(([x, y]) => <ellipse key={x} cx={x} cy={y} rx="11" ry="7" fill="#ff9ec4" opacity="0.45" />)}
      {face.eyes.map(([x, y]) => (
        <g key={x}>
          <circle cx={x} cy={y} r={plain ? 21 : 18} fill="#ffffff" stroke={plain ? 'none' : '#dfe6f0'} strokeWidth="1.5" />
          <circle cx={x + 4} cy={y + 4} r={plain ? 10 : 8.5} fill="#17181c" />
          {!plain && <circle cx={x + 7} cy={y} r="2.5" fill="#ffffff" />}
        </g>
      ))}
      {!plain && <path d={face.mouth} stroke={mouth} strokeWidth="4.5" strokeLinecap="round" fill="none" />}
    </svg>
  );
}
