import { Platform, Text, type TextProps, type TextStyle } from 'react-native';

import { Type, type Palette, type TypeVariant } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// 웹 미리보기에서도 한글을 어절 단위로 줄바꿈
const keepAll = Platform.select({ web: { wordBreak: 'keep-all' } as TextStyle, default: undefined });

type Tone = keyof Pick<
  Palette,
  'textStrong' | 'text' | 'textFaint' | 'textDisabled' | 'accent' | 'onAccent' | 'onTile' | 'onTileMuted' | 'accentOnTile'
>;

type Props = TextProps & { variant?: TypeVariant; tone?: Tone };

const defaultTone: Record<TypeVariant, Tone> = {
  hero: 'textStrong',
  title: 'textStrong',
  tagline: 'textStrong',
  lead: 'text',
  body: 'text',
  bodyStrong: 'textStrong',
  caption: 'textFaint',
  captionStrong: 'textStrong',
  fine: 'textFaint',
};

export function AppText({ variant = 'body', tone, style, ...rest }: Props) {
  const c = useTheme();
  return (
    <Text
      maxFontSizeMultiplier={1.3}
      // 한글을 단어(어절) 단위로 줄바꿈해 "적 / 어봐요"처럼 끊기지 않게 한다
      lineBreakStrategyIOS="hangul-word"
      style={[Type[variant], { color: c[tone ?? defaultTone[variant]] }, keepAll, style]}
      {...rest}
    />
  );
}
