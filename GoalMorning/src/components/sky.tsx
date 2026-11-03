import { useId, type ReactNode } from 'react';
import { Animated, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Skies, skyPeriod, type SkyPeriod } from '@/constants/sky';

type Props = {
  children?: ReactNode;
  period?: SkyPeriod;
  style?: StyleProp<ViewStyle>;
  // 해의 위치와 크기 (앱 아이콘의 해와 같은 모양)
  sun?: { size: number; right?: number; bottom: number; centered?: boolean };
  sunStyle?: Animated.WithAnimatedValue<StyleProp<ViewStyle>>; // 해를 움직일 때
};

// 시간대에 맞는 하늘 그라데이션 + 낮게 뜬 해 하나
export function Sky({ children, period, style, sun, sunStyle }: Props) {
  const sky = Skies[period ?? skyPeriod()];
  const id = `sky${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <View style={[styles.wrap, style]}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 1 1" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            {sky.stops.map(([o, c]) => (
              <Stop key={o} offset={o} stopColor={c} />
            ))}
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="1" height="1" fill={`url(#${id})`} />
      </Svg>
      {sun && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.sun,
            {
              width: sun.size,
              height: sun.size,
              borderRadius: sun.size / 2,
              bottom: sun.bottom,
              opacity: sky.sun,
            },
            sun.centered ? { left: '50%', marginLeft: -sun.size / 2 } : { right: sun.right ?? 0 },
            sunStyle,
          ]}
        />
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden' },
  sun: { position: 'absolute', backgroundColor: '#FFFFFF' },
});
