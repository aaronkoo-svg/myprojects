// 디자인 토큰. 기준: GoalMorning/DESIGN.md (애플 디자인 언어를 앱에 맞게 옮김)
// 원칙: 강조색은 Action Blue 하나, 그림자 없음, 면 색 차이로 구분, 버튼은 알약형.

export const Colors = {
  light: {
    canvas: '#F5F5F7', // parchment: 화면 바탕
    surface: '#FFFFFF', // 카드
    raised: '#FFFFFF', // 시트, 확인창
    tile: '#1D1D1F', // 비전 타일 (어두운 면)
    line: 'rgba(0,0,0,0.08)', // 아주 옅은 경계
    hairline: '#E0E0E0', // 구분선, 칩 테두리
    textStrong: '#1D1D1F', // ink: 제목과 본문
    text: '#1D1D1F',
    textFaint: '#6E6E73', // 보조 글자
    textDisabled: '#A1A1A6',
    accent: '#0066CC', // Action Blue: 누를 수 있는 모든 것
    accentFill: '#0066CC', // 파란 알약 버튼 바탕
    accentFocus: '#0071E3', // 포커스·선택 테두리
    accentSoft: '#E8F1FB',
    onAccent: '#FFFFFF',
    onTile: '#FFFFFF',
    onTileMuted: '#CCCCCC',
    accentOnTile: '#2997FF', // 어두운 면 위의 링크
    scrim: 'rgba(0,0,0,0.32)',
  },
  dark: {
    canvas: '#000000',
    surface: '#1C1C1E',
    raised: '#2C2C2E',
    tile: '#272729',
    line: 'rgba(255,255,255,0.10)',
    hairline: '#38383A',
    textStrong: '#F5F5F7',
    text: '#F5F5F7',
    textFaint: '#A1A1A6',
    textDisabled: '#6E6E73',
    accent: '#2997FF',
    accentFill: '#0071E3', // 어두운 화면에서는 흰 글자가 잘 읽히도록 한 단계 진하게
    accentFocus: '#2997FF',
    accentSoft: '#0B2A4A',
    onAccent: '#FFFFFF',
    onTile: '#FFFFFF',
    onTileMuted: '#CCCCCC',
    accentOnTile: '#2997FF',
    scrim: 'rgba(0,0,0,0.6)',
  },
} as const;

export type Palette = { [K in keyof typeof Colors.light]: string };

// Pretendard: SF Pro와 Apple SD Gothic Neo에 가장 가까운 무료 한글 글꼴.
// 애플처럼 300 / 400 / 600 / 700 네 가지 굵기만 쓴다 (500은 쓰지 않음).
export const FontFiles = {
  'Pretendard-Light': require('@/assets/fonts/Pretendard-Light.ttf'),
  'Pretendard-Regular': require('@/assets/fonts/Pretendard-Regular.ttf'),
  'Pretendard-SemiBold': require('@/assets/fonts/Pretendard-SemiBold.ttf'),
  'Pretendard-Bold': require('@/assets/fonts/Pretendard-Bold.ttf'),
};

// 큰 글자일수록 자간을 좁혀 단단한 인상 ("Apple tight"). 본문은 17px.
export const Type = {
  hero: { fontFamily: 'Pretendard-Bold', fontSize: 34, lineHeight: 41, letterSpacing: -0.9 },
  title: { fontFamily: 'Pretendard-SemiBold', fontSize: 28, lineHeight: 34, letterSpacing: -0.6 },
  tagline: { fontFamily: 'Pretendard-SemiBold', fontSize: 21, lineHeight: 27, letterSpacing: -0.4 },
  lead: { fontFamily: 'Pretendard-Light', fontSize: 21, lineHeight: 31, letterSpacing: -0.3 },
  body: { fontFamily: 'Pretendard-Regular', fontSize: 17, lineHeight: 25, letterSpacing: -0.374 },
  bodyStrong: { fontFamily: 'Pretendard-SemiBold', fontSize: 17, lineHeight: 22, letterSpacing: -0.374 },
  caption: { fontFamily: 'Pretendard-Regular', fontSize: 14, lineHeight: 20, letterSpacing: -0.224 },
  captionStrong: { fontFamily: 'Pretendard-SemiBold', fontSize: 14, lineHeight: 18, letterSpacing: -0.224 },
  fine: { fontFamily: 'Pretendard-Regular', fontSize: 12, lineHeight: 16, letterSpacing: -0.12 },
} as const;

export type TypeVariant = keyof typeof Type;

export const Space = { xxs: 4, xs: 8, sm: 12, md: 17, lg: 24, xl: 32, xxl: 48, section: 64 } as const;

// 반경 문법: 작은 도구 8, 카드 18, 누르는 것(버튼·칩·입력칸)은 알약
export const Radius = { sm: 8, md: 11, card: 18, pill: 999 } as const;

export const Layout = { screenX: 20, cardPadding: 20, minTouch: 44, maxWidth: 560 } as const;

// 누를 때 살짝 작아지는 애플식 반응
export const pressScale = (pressed: boolean) => ({ transform: [{ scale: pressed ? 0.97 : 1 }] });
