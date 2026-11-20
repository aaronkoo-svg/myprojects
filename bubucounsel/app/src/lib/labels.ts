import type { Speaker, SuggestionStyle, Tone, Topic } from '../../../shared/analysis';

export const TOPIC_LABEL: Record<Topic, string> = {
  money: '돈',
  chores: '집안일',
  tone: '말투',
  family: '가족',
  contact: '연락',
  time: '약속',
  trust: '신뢰',
  other: '기타',
};

export const STYLE_LABEL: Record<SuggestionStyle, string> = {
  soft: '부드럽게',
  honest: '솔직하게',
  short: '짧게',
};

export const TONE_LABEL: Record<Tone, string> = {
  good: '잘한 말',
  care: '아쉬운 말',
  hurt: '상처 주는 말',
};

/**
 * AI는 화자를 A/B로만 쓴다. 화면에서는 "나"/"상대"로 바꿔 보여 준다.
 * 한글 조사는 받침에 따라 달라지므로 함께 고친다. (A는 → 나는 / 상대는)
 */
export function personalize(text: string, meIsA: boolean): string {
  const name = (speaker: Speaker) => ((speaker === 'A') === meIsA ? '나' : '상대');
  return text.replace(/\b([AB])(은|는|이|가|을|를|와|과|의|에게|도|만|한테)?(?![A-Za-z])/g, (_m, s: Speaker, josa?: string) => {
    const word = name(s);
    if (!josa) return word;
    // "나"와 "상대" 모두 받침이 없어 같은 조사를 쓴다.
    const fixed: Record<string, string> = { 은: '는', 이: '가', 을: '를', 과: '와' };
    if (word === '나' && (josa === '이' || josa === '가')) return '내가';
    if (word === '나' && josa === '의') return '내';
    return word + (fixed[josa] ?? josa);
  });
}

export function formatDate(timestamp: number, now = new Date()): string {
  const date = new Date(timestamp);
  const days = Math.round((new Date(now).setHours(0, 0, 0, 0) - new Date(timestamp).setHours(0, 0, 0, 0)) / 86_400_000);
  if (days === 0) return '오늘';
  if (days === 1) return '어제';
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}
