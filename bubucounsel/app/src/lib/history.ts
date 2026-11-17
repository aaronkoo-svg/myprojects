import { useSyncExternalStore } from 'react';
import type { Analysis } from '../../../shared/analysis';
import { storage } from './toss';

/** 기기에만 저장하는 분석 기록. 원본 캡처는 저장하지 않는다. */
export interface HistoryItem {
  id: string;
  createdAt: number;
  /** true면 A(오른쪽 말풍선)가 나 */
  meIsA: boolean;
  analysis: Analysis;
}

const KEY = 'history.v1';
const MAX_ITEMS = 50;

let items: HistoryItem[] = [];
let loaded = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

async function persist() {
  await storage.set(KEY, JSON.stringify(items));
}

export async function loadHistory(): Promise<void> {
  if (loaded) return;
  const raw = await storage.get(KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as HistoryItem[];
      if (Array.isArray(parsed)) items = parsed;
    } catch {
      items = [];
    }
  }
  loaded = true;
  emit();
}

export function addHistory(analysis: Analysis): HistoryItem {
  const item: HistoryItem = {
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    createdAt: Date.now(),
    meIsA: true,
    analysis,
  };
  items = [item, ...items].slice(0, MAX_ITEMS);
  emit();
  void persist();
  return item;
}

export function updateHistory(id: string, patch: Partial<Pick<HistoryItem, 'meIsA'>>): void {
  items = items.map((item) => (item.id === id ? { ...item, ...patch } : item));
  emit();
  void persist();
}

export function removeHistory(id: string): void {
  items = items.filter((item) => item.id !== id);
  emit();
  void persist();
}

export function clearHistory(): void {
  items = [];
  emit();
  void storage.remove(KEY);
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function useHistory(): { items: HistoryItem[]; loaded: boolean } {
  const list = useSyncExternalStore(subscribe, () => items);
  const ready = useSyncExternalStore(subscribe, () => loaded);
  return { items: list, loaded: ready };
}
