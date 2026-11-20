import type { PartialAnalysis } from '../../shared/analysis';
import { SAMPLE_ANALYSIS } from '../../shared/sample';
import type { Analyzer, Chatter } from './analyze';

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

/** 개발용 가짜 대화. 받은 말에 따라 정해진 답을 조금씩 흘려보낸다. */
export const fakeChatter: Chatter = async ({ message, onSnapshot }) => {
  const draft = message.length > 20;
  const reply = draft
    ? '보내려는 마음은 잘 전해져요. 다만 "근데"로 시작하는 뒷부분은 변명처럼 들릴 수 있어요. 사과를 먼저 하고 바라는 점은 한 가지만 말해 보세요.'
    : '그랬군요. 그 상황이면 서운한 마음이 먼저 들었을 것 같아요. 상대가 어떤 말을 했는지 조금 더 알려 주면, 지금 보낼 말을 같이 골라 볼게요.';
  const suggestion = draft ? '아까는 내가 너무 날카롭게 말했어, 미안해. 나는 그냥 같이 정한 약속이 지켜졌으면 했어.' : '';
  for (let i = 10; i < reply.length; i += 12) {
    onSnapshot({ reply: reply.slice(0, i) });
    await wait(60);
  }
  return { ok: true, reply: { reply, suggestion }, usage: { inputTokens: 0, outputTokens: 0, model: 'fake' } };
};
