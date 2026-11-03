import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Radius, Space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Options = { title: string; message: string; okLabel?: string };
type Ask = (o: Options) => Promise<boolean>;

const ConfirmContext = createContext<Ask | null>(null);

// iOS 알림창 형식의 확인 창: 가운데 정렬 글, 아래에 나란한 두 버튼
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const c = useTheme();
  const [opts, setOpts] = useState<Options | null>(null);
  const resolver = useRef<((ok: boolean) => void) | null>(null);

  const ask = useCallback<Ask>(
    (o) =>
      new Promise((resolve) => {
        resolver.current = resolve;
        setOpts(o);
      }),
    [],
  );

  const finish = (ok: boolean) => {
    resolver.current?.(ok);
    resolver.current = null;
    setOpts(null);
  };

  const line = { borderColor: c.hairline };

  return (
    <ConfirmContext.Provider value={ask}>
      {children}
      <Modal transparent visible={!!opts} animationType="fade" onRequestClose={() => finish(false)}>
        <Pressable style={[styles.backdrop, { backgroundColor: c.scrim }]} onPress={() => finish(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: c.raised }]} onPress={() => {}}>
            <View style={styles.body}>
              <AppText variant="bodyStrong" style={styles.center}>
                {opts?.title}
              </AppText>
              <AppText variant="caption" tone="text" style={styles.center}>
                {opts?.message}
              </AppText>
            </View>
            <View style={[styles.actions, line]}>
              <Pressable
                accessibilityRole="button"
                onPress={() => finish(false)}
                style={({ pressed }) => [styles.action, line, styles.divider, pressed && { backgroundColor: c.canvas }]}>
                <AppText variant="body" tone="accent">
                  취소
                </AppText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => finish(true)}
                style={({ pressed }) => [styles.action, pressed && { backgroundColor: c.canvas }]}>
                <AppText variant="bodyStrong" tone="accent">
                  {opts?.okLabel ?? '확인'}
                </AppText>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ask = useContext(ConfirmContext);
  if (!ask) throw new Error('useConfirm must be used inside ConfirmProvider');
  return ask;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Space.xxl },
  sheet: { borderRadius: Radius.card, width: '100%', maxWidth: 300, overflow: 'hidden' },
  body: { paddingHorizontal: Space.md, paddingTop: Space.md + 2, paddingBottom: Space.md, gap: Space.xxs },
  center: { textAlign: 'center' },
  actions: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth },
  action: { flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center' },
  divider: { borderRightWidth: StyleSheet.hairlineWidth },
});
