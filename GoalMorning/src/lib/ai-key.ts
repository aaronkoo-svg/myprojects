import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// 사용자의 Anthropic API 키 보관.
// 폰에서는 보안 저장소(iOS 키체인 / 안드로이드 암호화 저장소), 웹 미리보기에서는 브라우저 저장소.
const KEY = 'goalmorning.anthropicApiKey';

export async function getApiKey(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') return await AsyncStorage.getItem(KEY);
    return await SecureStore.getItemAsync(KEY);
  } catch {
    return null;
  }
}

export async function setApiKey(value: string) {
  const v = value.trim();
  if (Platform.OS === 'web') await AsyncStorage.setItem(KEY, v);
  else await SecureStore.setItemAsync(KEY, v);
}

export async function clearApiKey() {
  if (Platform.OS === 'web') await AsyncStorage.removeItem(KEY);
  else await SecureStore.deleteItemAsync(KEY);
}

// 화면에 보여줄 때는 앞뒤 일부만
export function maskKey(k: string) {
  return k.length <= 12 ? '••••' : `${k.slice(0, 7)}••••${k.slice(-4)}`;
}
