import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { Layout, Radius, Space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Options = { title: string; message: string; okLabel?: string };
type Ask = (o: Options) => Promise<boolean>;

const ConfirmContext = createContext<Ask | null>(null);

// 앱 디자인에 맞춘 확인 창 (시스템 알림창 대신 사용)
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

  return (
    <ConfirmContext.Provider value={ask}>
      {children}
      <Modal transparent visible={!!opts} animationType="fade" onRequestClose={() => finish(false)}>
        <Pressable style={[styles.backdrop, { backgroundColor: 'rgba(20,18,15,0.45)' }]} onPress={() => finish(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: c.raised }]} onPress={() => {}}>
            <AppText variant="bodyStrong">{opts?.title}</AppText>
            <AppText variant="body" tone="textFaint">
              {opts?.message}
            </AppText>
            <View style={styles.actions}>
              <View style={styles.flex}>
                <Button label="취소" kind="quiet" onPress={() => finish(false)} />
              </View>
              <View style={styles.flex}>
                <Button label={opts?.okLabel ?? '확인'} onPress={() => finish(true)} />
              </View>
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
  backdrop: { flex: 1, justifyContent: 'center', padding: Layout.screenX },
  sheet: {
    borderRadius: Radius.card,
    padding: Space.xl,
    gap: Space.md,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  actions: { flexDirection: 'row', gap: Space.sm, marginTop: Space.sm },
  flex: { flex: 1 },
});
