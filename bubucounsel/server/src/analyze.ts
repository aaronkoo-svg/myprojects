import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { parse as parsePartial } from 'partial-json';
import type { Analysis, PartialAnalysis, UploadImage } from '../../shared/analysis';
import { SYSTEM_PROMPT, userText } from './prompt';
import { analysisSchema, normalize } from './schema';

export type Effort = 'low' | 'medium' | 'high' | 'xhigh' | 'max';

export interface AnalyzeInput {
  images: UploadImage[];
  context?: string;
  onSnapshot: (partial: PartialAnalysis) => void;
  signal?: AbortSignal;
}

export type AnalyzeOutcome =
  | { ok: true; analysis: Analysis; usage: { inputTokens: number; outputTokens: number; model: string } }
  | { ok: false; code: 'refused' | 'ai_failed' };

export type Analyzer = (input: AnalyzeInput) => Promise<AnalyzeOutcome>;

export interface ClaudeConfig {
  model: string;
  /** 지정하지 않으면 모델의 기본값을 쓴다. */
  effort?: Effort;
  /** 안전 분류기가 요청을 거절했을 때 다른 모델로 이어서 처리할지 */
  useFallbacks: boolean;
}

const SNAPSHOT_INTERVAL_MS = 120;

/** Claude에 이미지를 보내 분석하고, 생성되는 대로 부분 결과를 흘려보낸다. */
export function createClaudeAnalyzer(config: ClaudeConfig, client = new Anthropic()): Analyzer {
  return async ({ images, context, onSnapshot, signal }) => {
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
          model: config.model,
          max_tokens: 16000,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content }],
          output_config: {
            format: zodOutputFormat(analysisSchema),
            ...(config.effort ? { effort: config.effort } : {}),
          },
          ...(config.useFallbacks
            ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const }
            : {}),
        },
        { signal },
      );

      let text = '';
      let lastSent = 0;
      stream.on('text', (delta) => {
        text += delta;
        const now = Date.now();
        if (now - lastSent < SNAPSHOT_INTERVAL_MS) return;
        lastSent = now;
        const partial = tryParsePartial(text);
        if (partial) onSnapshot(partial);
      });

      const message = await stream.finalMessage();
      if (message.stop_reason === 'refusal') return { ok: false, code: 'refused' };
      if (message.stop_reason !== 'end_turn') return { ok: false, code: 'ai_failed' };

      const finalText = message.content
        .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === 'text')
        .map((block) => block.text)
        .join('');
      const parsed = analysisSchema.safeParse(JSON.parse(finalText));
      if (!parsed.success) return { ok: false, code: 'ai_failed' };

      return {
        ok: true,
        analysis: normalize(parsed.data),
        usage: {
          inputTokens: message.usage.input_tokens,
          outputTokens: message.usage.output_tokens,
          model: message.model,
        },
      };
    } catch (error) {
      // 대화 내용이 로그에 남지 않도록 오류 종류만 기록한다.
      const name = error instanceof Anthropic.APIError ? `${error.name} ${error.status ?? ''}` : (error as Error).name;
      console.error('[analyze] failed:', name);
      return { ok: false, code: 'ai_failed' };
    }
  };
}

function tryParsePartial(text: string): PartialAnalysis | null {
  try {
    const value: unknown = parsePartial(text);
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as PartialAnalysis) : null;
  } catch {
    return null;
  }
}
