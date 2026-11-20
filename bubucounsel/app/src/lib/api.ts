import type { AnalyzeEvent, AnalyzeRequest } from '../../../shared/analysis';
import type { ChatEvent, ChatRequest } from '../../../shared/chat';

const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

/** 분석 서버가 연결돼 있는지. 없으면 예시 체험만 가능하다. */
export const apiConfigured = API_URL !== '';

type StreamEvent = { type: string };

/** 서버가 보내는 이벤트를 순서대로 넘겨준다. 끝나지 않고 끊기면 실패로 알린다. */
async function streamPost<E extends StreamEvent>(
  path: string,
  body: unknown,
  onEvent: (event: E) => void,
  failed: E,
  signal?: AbortSignal,
): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
  } catch {
    if (!signal?.aborted) onEvent(failed);
    return;
  }

  if (!response.headers.get('Content-Type')?.includes('text/event-stream')) {
    try {
      onEvent((await response.json()) as E);
    } catch {
      onEvent(failed);
    }
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    onEvent(failed);
    return;
  }
  const decoder = new TextDecoder();
  let buffer = '';
  let finished = false;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let boundary = buffer.indexOf('\n\n');
      while (boundary !== -1) {
        const chunk = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        if (chunk.startsWith('data: ')) {
          const event = JSON.parse(chunk.slice(6)) as E;
          if (event.type !== 'snapshot') finished = true;
          onEvent(event);
        }
        boundary = buffer.indexOf('\n\n');
      }
    }
  } catch {
    /* 연결이 끊기면 아래에서 실패로 알린다 */
  }
  if (!finished && !signal?.aborted) onEvent(failed);
}

export function analyze(body: AnalyzeRequest, onEvent: (event: AnalyzeEvent) => void, signal?: AbortSignal) {
  return streamPost<AnalyzeEvent>('/analyze', body, onEvent, { type: 'error', code: 'ai_failed' }, signal);
}

export function chat(body: ChatRequest, onEvent: (event: ChatEvent) => void, signal?: AbortSignal) {
  return streamPost<ChatEvent>('/chat', body, onEvent, { type: 'error', code: 'ai_failed' }, signal);
}

export type FeedbackReason = 'biased' | 'misread' | 'awkward' | 'other';

/** 대화 내용 없이 사유만 보낸다. */
export async function sendFeedback(reason: FeedbackReason, swapped: boolean): Promise<void> {
  if (!apiConfigured) return;
  try {
    await fetch(`${API_URL}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, swapped }),
    });
  } catch {
    /* 피드백 전송 실패는 사용자에게 알리지 않는다 */
  }
}
