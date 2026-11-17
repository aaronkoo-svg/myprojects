import { useSyncExternalStore } from 'react';
import type { AnalyzeErrorCode, PartialAnalysis, Quota } from '../../../shared/analysis';
import { analyze } from './api';
import { addHistory } from './history';
import { toUploadImages } from './image';
import { DIRECT_MODE } from './directSettings';
import { getIdentity } from './toss';

/** 화면을 옮겨 다녀도 유지되는, 지금 진행 중인 분석 하나. */
export type Job =
  | { status: 'idle' }
  | { status: 'running'; partial: PartialAnalysis }
  | { status: 'done'; historyId: string }
  | { status: 'error'; code: AnalyzeErrorCode | 'image_failed' | 'no_key' | 'bad_key'; quota?: Quota };

/** 미리보기 화면에서 고른 캡처와 상황 설명 */
export interface Draft {
  photos: string[];
  context: string;
}

let job: Job = { status: 'idle' };
let draft: Draft = { photos: [], context: '' };
let controller: AbortController | null = null;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

function setJob(next: Job) {
  job = next;
  emit();
}

export function setDraft(next: Draft) {
  draft = next;
  emit();
}

export function resetJob() {
  controller?.abort();
  controller = null;
  setJob({ status: 'idle' });
}

export async function startAnalysis(options: { adWatched?: boolean } = {}): Promise<void> {
  controller?.abort();
  const current = new AbortController();
  controller = current;
  setJob({ status: 'running', partial: {} });

  let images;
  try {
    images = (await Promise.all(draft.photos.map(toUploadImages))).flat();
  } catch {
    setJob({ status: 'error', code: 'image_failed' });
    return;
  }

  if (DIRECT_MODE) {
    const { analyzeDirect } = await import('./direct');
    const outcome = await analyzeDirect(
      images,
      draft.context.trim() || undefined,
      (partial) => {
        if (!current.signal.aborted) setJob({ status: 'running', partial });
      },
      current.signal,
    );
    if (current.signal.aborted) return;
    if (outcome.ok) {
      const item = addHistory(outcome.analysis);
      setDraft({ photos: [], context: '' });
      setJob({ status: 'done', historyId: item.id });
    } else setJob({ status: 'error', code: outcome.code });
    return;
  }

  const identity = await getIdentity();
  if (current.signal.aborted) return;
  if (!identity) {
    setJob({ status: 'error', code: 'unauthorized' });
    return;
  }

  await analyze(
    { images, context: draft.context.trim() || undefined, adWatched: options.adWatched, ...identity },
    (event) => {
      if (current.signal.aborted) return;
      if (event.type === 'snapshot') setJob({ status: 'running', partial: event.analysis });
      else if (event.type === 'done') {
        const item = addHistory(event.analysis);
        setDraft({ photos: [], context: '' });
        setJob({ status: 'done', historyId: item.id });
      } else setJob({ status: 'error', code: event.code, quota: event.quota });
    },
    current.signal,
  );
}

export const useJob = () => useSyncExternalStore(subscribe, () => job);
export const useDraft = () => useSyncExternalStore(subscribe, () => draft);
