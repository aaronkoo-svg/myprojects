import type { Analysis } from './analysis';

/** 예시 대화. 캡처 없이도 결과 화면을 볼 수 있게 한다. */
export const SAMPLE_CHAT: { speaker: 'A' | 'B'; text: string }[] = [
  { speaker: 'B', text: '오늘 저녁 7시 예약한 거 알지?' },
  { speaker: 'A', text: '아 맞다... 나 오늘 회식 잡혔는데' },
  { speaker: 'B', text: '뭐? 2주 전에 말했잖아' },
  { speaker: 'A', text: '갑자기 잡힌 걸 어떡해. 다음에 가면 되지' },
  { speaker: 'B', text: '넌 맨날 그런 식이야. 내 말은 하나도 안 중요하지' },
  { speaker: 'A', text: '또 시작이네. 일 때문인데 왜 그렇게까지 말해' },
  { speaker: 'B', text: '됐어. 말을 말자' },
];

export const SAMPLE_ANALYSIS: Analysis = {
  kind: 'analysis',
  summary: '약속을 잊은 것보다 그 뒤의 말이 일을 키웠어요',
  shareA: 60,
  shareB: 40,
  reason:
    '시작은 A가 약속을 잊은 것이었어요. 다만 다툼이 커진 지점은 "다음에 가면 되지"라는 말이에요. 사과 없이 넘어가려는 것처럼 들렸고, B는 "맨날"이라는 말로 받아치면서 이번 일이 아니라 사람 전체를 탓하는 대화가 됐어요.',
  topic: 'time',
  suggestionsForA: [
    {
      style: 'soft',
      text: '2주 전부터 얘기한 건데 내가 잊어버려서 미안해. 기대하고 있었을 텐데 많이 속상했겠다. 이번 주 토요일에 내가 다시 예약할게.',
    },
    {
      style: 'honest',
      text: '약속 잊은 건 내 잘못이야, 미안해. 다만 "맨날 그런 식"이라는 말은 나도 좀 아팠어. 이번 일은 내가 제대로 만회할게.',
    },
    { style: 'short', text: '약속 잊어서 미안해. 내가 다시 예약할게.' },
  ],
  suggestionsForB: [
    {
      style: 'soft',
      text: '아까는 속상해서 말이 심하게 나갔어. 회식이 갑자기 잡힌 건 알겠는데, 미안하다는 말을 먼저 듣고 싶었어.',
    },
    {
      style: 'honest',
      text: '"맨날 그런 식"이라고 한 건 미안해. 근데 오래 기다린 약속이라 "다음에 가면 되지"라는 말이 많이 서운했어.',
    },
    { style: 'short', text: '말이 심했어, 미안. 그래도 서운했던 건 알아줘.' },
  ],
  utterances: [
    {
      speaker: 'A',
      quote: '아 맞다... 나 오늘 회식 잡혔는데',
      tone: 'care',
      note: '잊었다는 사실만 전하고 미안하다는 말이 없어서, 약속이 가볍게 여겨진 것처럼 들려요.',
    },
    {
      speaker: 'A',
      quote: '갑자기 잡힌 걸 어떡해. 다음에 가면 되지',
      tone: 'hurt',
      note: '상대가 기다려 온 시간을 없던 일처럼 넘기는 말로 들려요.',
    },
    {
      speaker: 'B',
      quote: '넌 맨날 그런 식이야',
      tone: 'hurt',
      note: '이번 일이 아니라 사람 전체를 탓하는 말이라, 듣는 쪽은 방어하게 돼요.',
    },
    {
      speaker: 'A',
      quote: '또 시작이네',
      tone: 'hurt',
      note: '상대의 서운함을 늘 하는 불평으로 치부하는 것처럼 들려요.',
    },
    {
      speaker: 'B',
      quote: '됐어. 말을 말자',
      tone: 'care',
      note: '대화를 닫아 버려서 풀 기회가 사라져요. 잠깐 쉬자고 말하는 편이 나아요.',
    },
  ],
  guideForA: [
    '변명보다 먼저, 약속을 잊은 것에 대해 사과해요.',
    '상대가 얼마나 기다렸는지 알고 있다고 말해 줘요.',
    '언제 다시 갈지 날짜를 정해서 먼저 제안해요.',
  ],
  guideForB: [
    '"맨날" 대신 이번 일에서 서운했던 점만 말해요.',
    '듣고 싶었던 말이 무엇이었는지 알려 줘요.',
    '대화를 끊고 싶을 때는 "조금 있다 얘기하자"고 말해요.',
  ],
};
