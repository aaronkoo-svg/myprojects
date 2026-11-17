/**
 * 토스 SDK 호출을 한 곳에 모은다.
 * 토스앱 밖(브라우저 개발)에서는 웹 표준 기능으로 대신한다.
 */
import {
  fetchAlbumItems,
  getTossShareLink,
  loadFullScreenAd,
  setClipboardText,
  share,
  showFullScreenAd,
  Storage,
  User,
} from '@apps-in-toss/web-framework';

export const APP_NAME = 'bubucounsel';
export const MAX_PHOTOS = 10;

/** 토스앱 WebView 안에서 실행 중인지 */
export const inToss = typeof window !== 'undefined' && typeof window.ReactNativeWebView !== 'undefined';

const AD_GROUP_ID = import.meta.env.VITE_AD_GROUP_ID ?? '';

export type PickResult =
  | { ok: true; dataUrls: string[] }
  | { ok: false; reason: 'permission' | 'unsupported' | 'failed' };

/** 앨범에서 사진을 고른다. 취소하면 빈 배열. */
export async function pickPhotos(maxCount: number): Promise<PickResult> {
  if (!inToss) return pickFromFileInput(maxCount);
  if (!fetchAlbumItems.isSupported()) return { ok: false, reason: 'unsupported' };
  try {
    const items = await fetchAlbumItems({ types: ['PHOTO'], maxCount, maxWidth: 1024, base64: true });
    return { ok: true, dataUrls: items.map((item) => toDataUrl(item.dataUri)) };
  } catch (error) {
    const code = (error as { code?: string }).code;
    const denied = code === 'NOT_ALLOWED' || (error as Error).name?.includes('Permission');
    return { ok: false, reason: denied ? 'permission' : code === 'UNSUPPORTED_APP_VERSION' ? 'unsupported' : 'failed' };
  }
}

function toDataUrl(value: string): string {
  return value.startsWith('data:') ? value : `data:image/jpeg;base64,${value}`;
}

function pickFromFileInput(maxCount: number): Promise<PickResult> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = async () => {
      const files = Array.from(input.files ?? []).slice(0, maxCount);
      try {
        resolve({ ok: true, dataUrls: await Promise.all(files.map(readAsDataUrl)) });
      } catch {
        resolve({ ok: false, reason: 'failed' });
      }
    };
    input.oncancel = () => resolve({ ok: true, dataUrls: [] });
    input.click();
  });
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** 기기 저장소. 토스앱을 지우면 함께 지워진다. */
export const storage = {
  async get(key: string): Promise<string | null> {
    try {
      return inToss ? await Storage.getItem(key) : window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  async set(key: string, value: string): Promise<boolean> {
    try {
      if (inToss) await Storage.setItem(key, value);
      else window.localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },
  async remove(key: string): Promise<void> {
    try {
      if (inToss) await Storage.removeItem(key);
      else window.localStorage.removeItem(key);
    } catch {
      /* 지울 것이 없으면 그대로 둔다 */
    }
  },
};

export async function copyText(text: string): Promise<boolean> {
  try {
    if (inToss) await setClipboardText(text);
    else await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return inToss ? false : legacyCopy(text);
  }
}

/** 일부 안드로이드 WebView는 Clipboard API를 막는다. 옛 방식으로 한 번 더 시도한다. */
function legacyCopy(text: string): boolean {
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  try {
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    area.remove();
  }
}

/** 대화 내용 없이 앱 링크만 공유한다. */
export async function shareApp(): Promise<boolean> {
  const message = '다툰 대화를 올리면 어떻게 풀면 좋을지 알려 줘요.';
  try {
    if (inToss) {
      const link = await getTossShareLink(`intoss://${APP_NAME}`);
      await share({ message: `${message}\n${link}` });
      return true;
    }
    if (navigator.share) {
      await navigator.share({ text: message, url: window.location.origin });
      return true;
    }
    return copyText(`${message}\n${window.location.origin}`);
  } catch {
    return false;
  }
}

export type Identity = { authCode: string } | { devUser: string };

/** 분석 요청마다 새 일회용 코드를 받는다. (코드는 한 번만 쓸 수 있다) */
export async function getIdentity(): Promise<Identity | null> {
  if (!inToss) {
    const key = 'dev-user';
    let id = window.localStorage.getItem(key);
    if (!id) {
      id = `web-${crypto.randomUUID()}`;
      window.localStorage.setItem(key, id);
    }
    return { devUser: id };
  }
  try {
    const { code } = await User.createAnonymousKeyAuthCode();
    return { authCode: code };
  } catch {
    return null;
  }
}

/* ── 보상형 광고 ───────────────────────────────────────────── */

let adLoaded = false;
let adLoading = false;

export function adAvailable(): boolean {
  return inToss && AD_GROUP_ID !== '' && loadFullScreenAd.isSupported();
}

/** 광고는 보여 주기 전에 미리 불러 둔다. (출시 요건) */
export function preloadAd(): void {
  if (!adAvailable() || adLoaded || adLoading) return;
  adLoading = true;
  loadFullScreenAd({
    options: { adGroupId: AD_GROUP_ID },
    onEvent: (event) => {
      if (event.type === 'loaded') {
        adLoaded = true;
        adLoading = false;
      }
    },
    onError: () => {
      adLoading = false;
    },
  });
}

/** 광고를 끝까지 봤으면 true */
export function showRewardedAd(): Promise<boolean> {
  if (!adAvailable() || !adLoaded) return Promise.resolve(false);
  return new Promise((resolve) => {
    let earned = false;
    const finish = (value: boolean) => {
      adLoaded = false;
      preloadAd();
      resolve(value);
    };
    showFullScreenAd({
      options: { adGroupId: AD_GROUP_ID },
      onEvent: (event) => {
        if (event.type === 'userEarnedReward') earned = true;
        if (event.type === 'dismissed') finish(earned);
        if (event.type === 'failedToShow') finish(false);
      },
      onError: () => finish(false),
    });
  });
}

export function isAdReady(): boolean {
  return adLoaded;
}
