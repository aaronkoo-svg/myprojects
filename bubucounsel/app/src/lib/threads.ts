import { useSyncExternalStore } from 'react';
import type { Analysis } from '../../../shared/analysis';
import { SAMPLE_ANALYSIS } from '../../../shared/sample';
import { storage } from './toss';

/**
 * 토닥이와 나눈 대화(스레드). 이 기기에만 저장한다.
 * 원본 캡처 이미지는 저장하지 않고, 몇 장 보냈는지만 남긴다.
 */
export type Message =
  | { id: string; at: number; role: 'user'; kind: 'text'; text: string; /** 버튼으로 보낸 말 (AI 대화 기록에서 뺀다) */ local?: boolean }
  | { id: string; at: number; role: 'user'; kind: 'captures'; count: number; context?: string }
  | { id: string; at: number; role: 'agent'; kind: 'analysis'; analysis: Analysis }
  | { id: string; at: number; role: 'agent'; kind: 'reply'; text: string; suggestion: string }
  | { id: string; at: number; role: 'agent'; kind: 'why' | 'guide'; analysisId: string }
  | { id: string; at: number; role: 'agent'; kind: 'note'; text: string };

export interface Thread {
  id: string;
  createdAt: number;
  updatedAt: number;
  /** true면 A(오른쪽 말풍선)가 나 */
  meIsA: boolean;
  messages: Message[];
}

export const SAMPLE_ID = 'sample';
const KEY = 'threads.v1';
const LEGACY_KEY = 'history.v1';
const MAX_THREADS = 50;

let threads: Thread[] = [];
let sample: Thread = makeSample();
let loaded = false;
const listeners = new Set<() => void>();

export const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

function makeSample(): Thread {
  const at = Date.now();
  return {
    id: SAMPLE_ID,
    createdAt: at,
    updatedAt: at,
    meIsA: true,
    messages: [
      { id: 's1', at, role: 'user', kind: 'captures', count: 1, context: '저녁 약속을 깜빡한 일로 다퉜어요' },
      { id: 's2', at, role: 'agent', kind: 'analysis', analysis: SAMPLE_ANALYSIS },
    ],
  };
}

function emit() {
  for (const listener of listeners) listener();
}

/** 사용자가 아무것도 보내지 않은 대화는 기록에 남기지 않는다. */
const hasUserMessage = (thread: Thread) => thread.messages.some((m) => m.role === 'user');

async function persist() {
  await storage.set(KEY, JSON.stringify(threads.filter(hasUserMessage)));
}

interface LegacyItem {
  id: string;
  createdAt: number;
  meIsA: boolean;
  analysis: Analysis;
}

export async function loadThreads(): Promise<void> {
  if (loaded) return;
  const raw = await storage.get(KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Thread[];
      if (Array.isArray(parsed)) threads = parsed.filter(hasUserMessage);
    } catch {
      threads = [];
    }
  } else {
    // 채팅형 이전 버전의 기록을 대화로 옮긴다.
    const legacy = await storage.get(LEGACY_KEY);
    if (legacy) {
      try {
        const items = JSON.parse(legacy) as LegacyItem[];
        threads = items.map((item) => ({
          id: item.id,
          createdAt: item.createdAt,
          updatedAt: item.createdAt,
          meIsA: item.meIsA,
          messages: [
            { id: `${item.id}-c`, at: item.createdAt, role: 'user', kind: 'captures', count: 1 },
            { id: `${item.id}-a`, at: item.createdAt, role: 'agent', kind: 'analysis', analysis: item.analysis },
          ],
        }));
        await persist();
        await storage.remove(LEGACY_KEY);
      } catch {
        threads = [];
      }
    }
  }
  loaded = true;
  emit();
}

export function createThread(first?: Message): Thread {
  const at = Date.now();
  const thread: Thread = { id: newId(), createdAt: at, updatedAt: at, meIsA: true, messages: first ? [first] : [] };
  threads = [thread, ...threads].slice(0, MAX_THREADS);
  emit();
  return thread;
}

export function getThread(id: string): Thread | undefined {
  return id === SAMPLE_ID ? sample : threads.find((t) => t.id === id);
}

function update(id: string, change: (thread: Thread) => Thread) {
  if (id === SAMPLE_ID) {
    sample = change(sample);
    emit();
    return;
  }
  threads = threads.map((t) => (t.id === id ? change(t) : t));
  // 최근에 이어간 대화가 위로 오게 한다.
  threads.sort((a, b) => b.updatedAt - a.updatedAt);
  emit();
  void persist();
}

export function addMessage(threadId: string, message: Message): void {
  update(threadId, (t) => ({ ...t, updatedAt: message.at, messages: [...t.messages, message] }));
}

export function setMeIsA(threadId: string, meIsA: boolean): void {
  update(threadId, (t) => ({ ...t, meIsA }));
}

export function removeThread(id: string): void {
  if (id === SAMPLE_ID) return;
  threads = threads.filter((t) => t.id !== id);
  emit();
  void persist();
}

export function clearThreads(): void {
  threads = [];
  emit();
  void storage.remove(KEY);
}

/** 예시 대화를 처음 상태로 되돌린다. */
export function resetSample(): void {
  sample = makeSample();
  emit();
}

export function latestAnalysis(thread: Thread): { id: string; analysis: Analysis } | null {
  for (let i = thread.messages.length - 1; i >= 0; i--) {
    const m = thread.messages[i];
    if (m?.kind === 'analysis') return { id: m.id, analysis: m.analysis };
  }
  return null;
}

/** 목록에 보여 줄 한 줄 */
export function threadTitle(thread: Thread): string {
  const found = latestAnalysis(thread);
  if (found?.analysis.kind === 'analysis') return found.analysis.summary;
  const text = thread.messages.find((m) => m.role === 'user' && m.kind === 'text');
  if (text?.kind === 'text') return text.text;
  return '캡처를 보낸 대화';
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function useThreads(): { threads: Thread[]; loaded: boolean } {
  const list = useSyncExternalStore(subscribe, () => threads);
  const ready = useSyncExternalStore(subscribe, () => loaded);
  return { threads: list.filter(hasUserMessage), loaded: ready };
}

export function useThread(id: string): Thread | undefined {
  return useSyncExternalStore(subscribe, () => getThread(id));
}
