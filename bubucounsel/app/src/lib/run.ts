import { useSyncExternalStore } from 'react';
import type { Analysis, AnalyzeErrorCode, PartialAnalysis, Quota } from '../../../shared/analysis';
import { CHAT_LIMITS, type ChatReply, type ChatTurn } from '../../../shared/chat';
import { analyze, chat } from './api';
import { DIRECT_MODE } from './directSettings';
import { toUploadImages } from './image';
import { addMessage, getThread, latestAnalysis, newId, type Thread } from './threads';
import { getIdentity } from './toss';

export type RunErrorCode = AnalyzeErrorCode | 'image_failed' | 'no_key' | 'bad_key';

/** 대화 하나에서 지금 진행 중인 AI 응답. 한 번에 하나만 돈다. */
export type Run =
  | { status: 'idle' }
  | { status: 'analyzing'; threadId: string; partial: PartialAnalysis }
  | { status: 'replying'; threadId: string; partial: Partial<ChatReply> }
  | { status: 'error'; threadId: string; from: 'analysis' | 'chat'; code: RunErrorCode; quota?: Quota; retry: (options?: { adWatched?: boolean }) => void };

let run: Run = { status: 'idle' };
let controller: AbortController | null = null;
const listeners = new Set<() => void>();

/** 이번 실행 동안만 보여 줄 캡처 썸네일. 기기에도 저장하지 않는다. */
const thumbnails = new Map<string, string[]>();

function set(next: Run) {
  run = next;
  for (const listener of listeners) listener();
}

export function dismissError(): void {
  if (run.status === 'error') set({ status: 'idle' });
}

export function cancelRun(): void {
  controller?.abort();
  controller = null;
  set({ status: 'idle' });
}

export function thumbnailsOf(messageId: string): string[] | undefined {
  return thumbnails.get(messageId);
}

function begin(): AbortController {
  controller?.abort();
  const current = new AbortController();
  controller = current;
  return current;
}

/** 캡처를 보내 분석한다. */
export function sendCaptures(threadId: string, photos: string[], context: string): void {
  const message = { id: newId(), at: Date.now(), role: 'user' as const, kind: 'captures' as const, count: photos.length, context: context.trim() || undefined };
  thumbnails.set(message.id, photos);
  addMessage(threadId, message);
  void runAnalysis(threadId, photos, message.context);
}

async function runAnalysis(threadId: string, photos: string[], context: string | undefined, options: { adWatched?: boolean } = {}) {
  const current = begin();
  const retry = (next?: { adWatched?: boolean }) => void runAnalysis(threadId, photos, context, next);
  set({ status: 'analyzing', threadId, partial: {} });

  let images;
  try {
    images = (await Promise.all(photos.map(toUploadImages))).flat();
  } catch {
    set({ status: 'error', threadId, from: 'analysis', code: 'image_failed', retry });
    return;
  }

  const finish = (analysis: Analysis) => {
    addAnalysis(threadId, analysis);
    set({ status: 'idle' });
  };

  if (DIRECT_MODE) {
    const { analyzeDirect } = await import('./direct');
    const outcome = await analyzeDirect(
      images,
      context,
      (partial) => {
        if (!current.signal.aborted) set({ status: 'analyzing', threadId, partial });
      },
      current.signal,
    );
    if (current.signal.aborted) return;
    if (outcome.ok) finish(outcome.analysis);
    else set({ status: 'error', threadId, from: 'analysis', code: outcome.code, retry });
    return;
  }

  const identity = await getIdentity();
  if (current.signal.aborted) return;
  if (!identity) {
    set({ status: 'error', threadId, from: 'analysis', code: 'unauthorized', retry });
    return;
  }
  await analyze(
    { images, context, adWatched: options.adWatched, ...identity },
    (event) => {
      if (current.signal.aborted) return;
      if (event.type === 'snapshot') set({ status: 'analyzing', threadId, partial: event.analysis });
      else if (event.type === 'done') finish(event.analysis);
      else set({ status: 'error', threadId, from: 'analysis', code: event.code, quota: event.quota, retry });
    },
    current.signal,
  );
}

function addAnalysis(threadId: string, analysis: Analysis) {
  addMessage(threadId, { id: newId(), at: Date.now(), role: 'agent', kind: 'analysis', analysis });
}

/** 지금까지 오간 글을 AI에 넘길 모양으로 만든다. */
export function historyOf(thread: Thread): ChatTurn[] {
  const turns: ChatTurn[] = [];
  for (const m of thread.messages) {
    if (m.role === 'user' && m.kind === 'text' && !m.local) turns.push({ role: 'user', text: m.text });
    else if (m.role === 'agent' && m.kind === 'reply') {
      turns.push({ role: 'agent', text: m.suggestion ? `${m.text}\n(보낼 문장 제안: ${m.suggestion})` : m.text });
    } else if (m.role === 'agent' && m.kind === 'note') turns.push({ role: 'agent', text: m.text });
  }
  return turns.slice(-CHAT_LIMITS.maxHistory).map((t) => ({ ...t, text: t.text.slice(0, CHAT_LIMITS.maxHistoryChars) }));
}

/** 글로 묻고 답을 받는다. */
export function sendText(threadId: string, text: string): void {
  const thread = getThread(threadId);
  if (!thread) return;
  const history = historyOf(thread);
  addMessage(threadId, { id: newId(), at: Date.now(), role: 'user', kind: 'text', text });
  void runChat(threadId, text, history);
}

async function runChat(threadId: string, message: string, history: ChatTurn[]) {
  const current = begin();
  const retry = () => void runChat(threadId, message, history);
  set({ status: 'replying', threadId, partial: {} });

  const thread = getThread(threadId);
  const found = thread ? latestAnalysis(thread) : null;
  const request = {
    message: message.slice(0, CHAT_LIMITS.maxMessageChars),
    history,
    analysis: found?.analysis.kind === 'analysis' ? found.analysis : undefined,
    meIsA: thread?.meIsA ?? true,
  };
  const finish = (reply: ChatReply) => {
    addMessage(threadId, { id: newId(), at: Date.now(), role: 'agent', kind: 'reply', text: reply.reply, suggestion: reply.suggestion });
    set({ status: 'idle' });
  };

  if (DIRECT_MODE) {
    const { chatDirect } = await import('./direct');
    const outcome = await chatDirect(
      request,
      (partial) => {
        if (!current.signal.aborted) set({ status: 'replying', threadId, partial });
      },
      current.signal,
    );
    if (current.signal.aborted) return;
    if (outcome.ok) finish(outcome.reply);
    else set({ status: 'error', threadId, from: 'chat', code: outcome.code, retry });
    return;
  }

  const identity = await getIdentity();
  if (current.signal.aborted) return;
  if (!identity) {
    set({ status: 'error', threadId, from: 'chat', code: 'unauthorized', retry });
    return;
  }
  await chat(
    { ...request, ...identity },
    (event) => {
      if (current.signal.aborted) return;
      if (event.type === 'snapshot') set({ status: 'replying', threadId, partial: event.reply });
      else if (event.type === 'done') finish(event.reply);
      else set({ status: 'error', threadId, from: 'chat', code: event.code, quota: event.quota, retry });
    },
    current.signal,
  );
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useRun = () => useSyncExternalStore(subscribe, () => run);
