import { useState } from 'react';
import { Platform, StyleSheet, TextInput, type TextInputProps, type TextStyle } from 'react-native';

import { Radius, Space, Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// 웹 기본 검은 테두리 대신, 포커스 때 강조색 테두리
const noOutline = Platform.select({ web: { outlineStyle: 'none' } as unknown as TextStyle, default: undefined });

export function TextField({ style, multiline, onFocus, onBlur, ...rest }: TextInputProps) {
  const c = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      placeholderTextColor={c.textFaint}
      selectionColor={c.accent}
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
          borderColor: focused ? c.accent : c.line,
          borderWidth: focused ? 1.5 : StyleSheet.hairlineWidth,
        },
        multiline && styles.multi,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: Radius.control,
    paddingHorizontal: Space.lg,
    paddingVertical: Space.md,
  },
  multi: { minHeight: 88, textAlignVertical: 'top' },
});
