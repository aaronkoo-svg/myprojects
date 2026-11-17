import type { PartialAnalysis } from '../../shared/analysis';
import { SAMPLE_ANALYSIS } from '../../shared/sample';
import type { Analyzer } from './analyze';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 개발용 가짜 분석기. AI를 부르지 않고 예시 결과를 조금씩 흘려보낸다.
 * 화면 개발과 자동 테스트에만 쓴다. (FAKE_ANALYZER=1)
 */
export const fakeAnalyzer: Analyzer = async ({ onSnapshot, context }) => {
  if (context?.includes('#refused')) return { ok: false, code: 'refused' };
  if (context?.includes('#safety')) {
    return {
      ok: true,
      analysis: {
        ...SAMPLE_ANALYSIS,
        kind: 'safety',
        summary: '대화에 위협으로 느껴질 수 있는 말이 있어요.',
        suggestionsForA: [],
        suggestionsForB: [],
        utterances: [],
        guideForA: [],
        guideForB: [],
      },
      usage: { inputTokens: 0, outputTokens: 0, model: 'fake' },
    };
  }
  const partial: PartialAnalysis = {};
  const keys = Object.keys(SAMPLE_ANALYSIS) as (keyof typeof SAMPLE_ANALYSIS)[];
  for (const key of keys) {
    Object.assign(partial, { [key]: SAMPLE_ANALYSIS[key] });
    onSnapshot({ ...partial });
    await wait(350);
  }
  return { ok: true, analysis: SAMPLE_ANALYSIS, usage: { inputTokens: 0, outputTokens: 0, model: 'fake' } };
};
