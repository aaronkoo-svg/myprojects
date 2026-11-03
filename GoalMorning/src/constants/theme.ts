// 디자인 토큰. 값의 근거는 GoalMorning/DESIGN.md 참고.

export const Colors = {
  light: {
    canvas: '#F7F3EC',
    surface: '#FFFDF9',
    raised: '#FFFFFF',
    line: '#E8E1D6',
    textStrong: '#1F1B16',
    text: '#4A4339',
    textFaint: '#8C8274',
    accent: '#B8742A',
    accentSoft: '#F3E6D3',
    onAccent: '#FFFDF9',
    success: '#5E8B6A',
  },
  dark: {
    canvas: '#14120F',
    surface: '#1E1B17',
    raised: '#2A2621',
    line: '#38332C',
    textStrong: '#F4EFE7',
    text: '#CFC7BB',
    textFaint: '#8F8678',
    accent: '#E0A15A',
    accentSoft: '#3A2C1C',
    onAccent: '#14120F',
    success: '#86B592',
  },
} as const;

export type Palette = { [K in keyof typeof Colors.light]: string };

// expo-font로 불러올 때 쓰는 이름 (src/app/_layout.tsx)
export const FontFiles = {
  'MaruBuri-Regular': require('@/assets/fonts/MaruBuri-Regular.ttf'),
  'MaruBuri-SemiBold': require('@/assets/fonts/MaruBuri-SemiBold.ttf'),
  'Pretendard-Regular': require('@/assets/fonts/Pretendard-Regular.ttf'),
  'Pretendard-Medium': require('@/assets/fonts/Pretendard-Medium.ttf'),
  'Pretendard-SemiBold': require('@/assets/fonts/Pretendard-SemiBold.ttf'),
};

// 글자 스타일. 명조(마루 부리)는 마음에 닿는 문장에만 쓴다.
export const Type = {
  display: { fontFamily: 'MaruBuri-SemiBold', fontSize: 30, lineHeight: 39, letterSpacing: -0.15 },
  title: { fontFamily: 'MaruBuri-SemiBold', fontSize: 22, lineHeight: 30, letterSpacing: -0.1 },
  quote: { fontFamily: 'MaruBuri-Regular', fontSize: 17, lineHeight: 27 },
  body: { fontFamily: 'Pretendard-Regular', fontSize: 16, lineHeight: 24 },
  bodyStrong: { fontFamily: 'Pretendard-SemiBold', fontSize: 16, lineHeight: 24 },
  label: { fontFamily: 'Pretendard-Medium', fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: 'Pretendard-Regular', fontSize: 12, lineHeight: 17 },
} as const;

export type TypeVariant = keyof typeof Type;

export const Space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;

export const Radius = { card: 20, control: 14, pill: 999 } as const;

// 화면 좌우 여백, 카드 안쪽 여백
export const Layout = { screenX: 24, cardPadding: 20, minTouch: 44, maxWidth: 560 } as const;
