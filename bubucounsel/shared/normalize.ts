import type { Analysis } from './analysis';

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
