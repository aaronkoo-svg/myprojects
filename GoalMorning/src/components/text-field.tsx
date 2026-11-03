import { useState } from 'react';
import { Platform, StyleSheet, TextInput, type TextInputProps, type TextStyle } from 'react-native';

import { Radius, Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// 웹 기본 검은 테두리 대신, 포커스 때 파란 테두리
const noOutline = Platform.select({ web: { outlineStyle: 'none' } as unknown as TextStyle, default: undefined });

// 한 줄 입력은 알약, 여러 줄 입력은 카드 반경
export function TextField({ style, multiline, onFocus, onBlur, ...rest }: TextInputProps) {
  const c = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      placeholderTextColor={c.textDisabled}
      selectionColor={c.accent}
      cursorColor={c.accent}
      multiline={multiline}
      maxFontSizeMultiplier={1.3}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
      style={[
        styles.base,
        Type.body,
        noOutline,
        {
          backgroundColor: c.surface,
          color: c.textStrong,
          borderColor: focused ? c.accentFocus : c.line,
          borderWidth: focused ? 2 : 1,
          paddingHorizontal: focused ? 19 : 20,
        },
        multiline && styles.multi,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: { minHeight: 50, borderRadius: Radius.pill, paddingVertical: 12 },
  multi: { minHeight: 96, borderRadius: Radius.card, textAlignVertical: 'top', paddingTop: 14 },
});
