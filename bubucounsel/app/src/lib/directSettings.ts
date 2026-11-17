/** 테스트 APK 전용 설정. 이 기기의 저장소에만 둔다. */
export const DIRECT_MODE = import.meta.env.VITE_DIRECT_MODE === '1';

export const DIRECT_MODELS = [
  { id: 'claude-opus-5-5', label: 'Opus 5.5', note: '가장 정확해요 · 1회 약 200원' },
  { id: 'claude-sonnet-5-5', label: 'Sonnet 5.5', note: '빠르고 균형 잡혀요 · 1회 약 100원' },
  { id: 'claude-haiku-5-5', label: 'Haiku 5.5', note: '가장 저렴해요 · 1회 10원 미만' },
] as const;

const KEY_STORAGE = 'direct.apiKey';
const MODEL_STORAGE = 'direct.model';

function read(key: string): string {
  try {
    return window.localStorage.getItem(key) ?? '';
  } catch {
    return '';
  }
}

export function getDirectSettings(): { apiKey: string; model: string } {
  const model = read(MODEL_STORAGE);
  return {
    apiKey: read(KEY_STORAGE),
    model: DIRECT_MODELS.some((m) => m.id === model) ? model : DIRECT_MODELS[0].id,
  };
}

export function saveDirectSettings(settings: { apiKey: string; model: string }): void {
  try {
    if (settings.apiKey) window.localStorage.setItem(KEY_STORAGE, settings.apiKey.trim());
    else window.localStorage.removeItem(KEY_STORAGE);
    window.localStorage.setItem(MODEL_STORAGE, settings.model);
  } catch {
    /* 저장소를 쓸 수 없는 환경이면 저장하지 않는다 */
  }
}
