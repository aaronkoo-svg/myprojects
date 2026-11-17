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

/** 모델이 낸 숫자를 화면에 쓸 수 있게 다듬는다. 합이 100인 정수 두 개로 맞춘다. */
export function normalize(a: Analysis): Analysis {
  const rawA = Number.isFinite(a.shareA) ? Math.max(0, a.shareA) : 50;
  const rawB = Number.isFinite(a.shareB) ? Math.max(0, a.shareB) : 50;
  const total = rawA + rawB;
  const shareA = total > 0 ? Math.round((rawA / total) * 100) : 50;
  return {
    ...a,
    shareA,
    shareB: 100 - shareA,
    utterances: a.utterances.slice(0, 8),
    suggestionsForA: a.suggestionsForA.slice(0, 3),
    suggestionsForB: a.suggestionsForB.slice(0, 3),
    guideForA: a.guideForA.slice(0, 3),
    guideForB: a.guideForB.slice(0, 3),
  };
}
