/**
 * 테스트 APK 전용: 기기에 저장한 본인 API 키로 Claude를 직접 부른다.
 * 토스 출시용 빌드에는 들어가지 않는다 (VITE_DIRECT_MODE=1일 때만 불러온다).
 */
import Anthropic from '@anthropic-ai/sdk';
import { parse as parsePartial } from 'partial-json';
import type { Analysis, PartialAnalysis, UploadImage } from '../../../shared/analysis';
import { ANALYSIS_JSON_SCHEMA } from '../../../shared/jsonSchema';
import { normalize } from '../../../shared/normalize';
import { CHAT_SYSTEM_PROMPT, chatUserText, SYSTEM_PROMPT, userText } from '../../../shared/prompt';
import { CHAT_JSON_SCHEMA, type ChatReply, type ChatRequest } from '../../../shared/chat';
import { getDirectSettings } from './directSettings';

export type DirectError = 'no_key' | 'bad_key' | 'refused' | 'ai_failed';

export async function analyzeDirect(
  images: UploadImage[],
  context: string | undefined,
  onSnapshot: (partial: PartialAnalysis) => void,
  signal: AbortSignal,
): Promise<{ ok: true; analysis: Analysis } | { ok: false; code: DirectError }> {
  const { apiKey, model } = getDirectSettings();
  if (!apiKey) return { ok: false, code: 'no_key' };

  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  const content: Anthropic.Beta.BetaContentBlockParam[] = [
    ...images.map(
      (image): Anthropic.Beta.BetaImageBlockParam => ({
        type: 'image',
        source: { type: 'base64', media_type: image.mediaType, data: image.data },
      }),
    ),
    { type: 'text', text: userText(context) },
  ];

  try {
    const stream = client.beta.messages.stream(
      {
        model,
        max_tokens: 16000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content }],
        output_config: { format: { type: 'json_schema', schema: ANALYSIS_JSON_SCHEMA } },
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
      },
      { signal },
    );

    let text = '';
    let lastSent = 0;
    stream.on('text', (delta) => {
      text += delta;
      const now = Date.now();
      if (now - lastSent < 120) return;
      lastSent = now;
      try {
        const value: unknown = parsePartial(text);
        if (value && typeof value === 'object' && !Array.isArray(value)) onSnapshot(value as PartialAnalysis);
      } catch {
        /* 아직 읽을 수 없는 조각이면 다음 조각을 기다린다 */
      }
    });

    const message = await stream.finalMessage();
    if (message.stop_reason === 'refusal') return { ok: false, code: 'refused' };
    if (message.stop_reason !== 'end_turn') return { ok: false, code: 'ai_failed' };
    const finalText = message.content
      .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');
    const parsed: unknown = JSON.parse(finalText);
    if (!isAnalysis(parsed)) return { ok: false, code: 'ai_failed' };
    return { ok: true, analysis: normalize(parsed) };
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
      return { ok: false, code: 'bad_key' };
    }
    return { ok: false, code: 'ai_failed' };
  }
}

function isAnalysis(value: unknown): value is Analysis {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    ['analysis', 'not_chat', 'safety'].includes(v.kind as string) &&
    typeof v.summary === 'string' &&
    typeof v.reason === 'string' &&
    typeof v.shareA === 'number' &&
    typeof v.shareB === 'number' &&
    typeof v.topic === 'string' &&
    ['suggestionsForA', 'suggestionsForB', 'utterances', 'guideForA', 'guideForB'].every((key) => Array.isArray(v[key]))
  );
}

/** 테스트 APK: 글로 이어지는 대화를 기기에서 바로 Claude에 보낸다. */
export async function chatDirect(
  request: Omit<ChatRequest, 'authCode' | 'devUser'>,
  onSnapshot: (partial: Partial<ChatReply>) => void,
  signal: AbortSignal,
): Promise<{ ok: true; reply: ChatReply } | { ok: false; code: DirectError }> {
  const { apiKey, model } = getDirectSettings();
  if (!apiKey) return { ok: false, code: 'no_key' };
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  try {
    const stream = client.beta.messages.stream(
      {
        model,
        max_tokens: 4000,
        system: CHAT_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: chatUserText(request) }],
        output_config: { format: { type: 'json_schema', schema: CHAT_JSON_SCHEMA } },
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
      },
      { signal },
    );
    let text = '';
    let lastSent = 0;
    stream.on('text', (delta) => {
      text += delta;
      const now = Date.now();
      if (now - lastSent < 80) return;
      lastSent = now;
      try {
        const value: unknown = parsePartial(text);
        if (value && typeof value === 'object') onSnapshot(value as Partial<ChatReply>);
      } catch {
        /* 다음 조각을 기다린다 */
      }
    });
    const message = await stream.finalMessage();
    if (message.stop_reason === 'refusal') return { ok: false, code: 'refused' };
    if (message.stop_reason !== 'end_turn') return { ok: false, code: 'ai_failed' };
    const parsed = JSON.parse(
      message.content
        .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === 'text')
        .map((block) => block.text)
        .join(''),
    ) as Partial<ChatReply>;
    if (typeof parsed.reply !== 'string') return { ok: false, code: 'ai_failed' };
    return { ok: true, reply: { reply: parsed.reply, suggestion: typeof parsed.suggestion === 'string' ? parsed.suggestion : '' } };
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
      return { ok: false, code: 'bad_key' };
    }
    return { ok: false, code: 'ai_failed' };
  }
}
