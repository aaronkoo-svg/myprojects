import { z } from 'zod';
import type { Analysis } from '../../shared/analysis';

const suggestion = z.object({
  style: z.enum(['soft', 'honest', 'short']),
  text: z.string(),
});

/**
 * AI 응답 형식. 필드 순서가 곧 생성 순서이고, 화면에 채워지는 순서다.
 * (요약 → 비율 → 이유 → 보낼 문장 → 짚어 볼 말 → 가이드)
 */
export const analysisSchema = z.object({
  kind: z.enum(['analysis', 'not_chat', 'safety']),
  summary: z.string(),
  shareA: z.number(),
  shareB: z.number(),
  reason: z.string(),
  topic: z.enum(['money', 'chores', 'tone', 'family', 'contact', 'time', 'trust', 'other']),
  suggestionsForA: z.array(suggestion),
  suggestionsForB: z.array(suggestion),
  utterances: z.array(
    z.object({
      speaker: z.enum(['A', 'B']),
      quote: z.string(),
      tone: z.enum(['good', 'care', 'hurt']),
      note: z.string(),
    }),
  ),
  guideForA: z.array(z.string()),
  guideForB: z.array(z.string()),
}) satisfies z.ZodType<Analysis>;

export { normalize } from '../../shared/normalize';
