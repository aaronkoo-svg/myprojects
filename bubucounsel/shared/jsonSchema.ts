/**
 * 분석 결과의 JSON 스키마. 앱의 직접 분석 모드(테스트 APK)에서 쓴다.
 * 서버의 zod 스키마(server/src/schema.ts)와 같은 모양이어야 한다.
 */
const str = { type: 'string' } as const;
const strArray = { type: 'array', items: str } as const;
const suggestionArray = {
  type: 'array',
  items: {
    type: 'object',
    properties: { style: { type: 'string', enum: ['soft', 'honest', 'short'] }, text: str },
    required: ['style', 'text'],
    additionalProperties: false,
  },
} as const;

export const ANALYSIS_JSON_SCHEMA = {
  type: 'object',
  properties: {
    kind: { type: 'string', enum: ['analysis', 'not_chat', 'safety'] },
    summary: str,
    shareA: { type: 'number' },
    shareB: { type: 'number' },
    reason: str,
    topic: { type: 'string', enum: ['money', 'chores', 'tone', 'family', 'contact', 'time', 'trust', 'other'] },
    suggestionsForA: suggestionArray,
    suggestionsForB: suggestionArray,
    utterances: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          speaker: { type: 'string', enum: ['A', 'B'] },
          quote: str,
          tone: { type: 'string', enum: ['good', 'care', 'hurt'] },
          note: str,
        },
        required: ['speaker', 'quote', 'tone', 'note'],
        additionalProperties: false,
      },
    },
    guideForA: strArray,
    guideForB: strArray,
  },
  required: [
    'kind', 'summary', 'shareA', 'shareB', 'reason', 'topic',
    'suggestionsForA', 'suggestionsForB', 'utterances', 'guideForA', 'guideForB',
  ],
  additionalProperties: false,
} as const;
