import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Animated, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

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
  return (
    <View style={[styles.wrap, style]}>
      {/* 폰이 직접 그리는 그라데이션 + 디더링: 안드로이드에서 줄무늬(밴딩) 없이 부드럽게 */}
      <LinearGradient
        style={StyleSheet.absoluteFill}
        colors={sky.stops.map(([, c]) => c) as unknown as readonly [string, string, ...string[]]}
        locations={sky.stops.map(([o]) => o) as unknown as readonly [number, number, ...number[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        dither
      />
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
