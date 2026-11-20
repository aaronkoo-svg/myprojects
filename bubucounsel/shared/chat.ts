import type { Analysis, AnalyzeErrorCode, Quota } from './analysis';

/** 대화(채팅)로 이어지는 질문과 답 */
export interface ChatTurn {
  role: 'user' | 'agent';
  text: string;
}

export interface ChatReply {
  /** 투닥이의 답 (해요체, 짧게) */
  reply: string;
  /** 바로 복사해 보낼 문장. 없으면 빈 문자열 */
  suggestion: string;
}

export interface ChatRequest {
  message: string;
  /** 이 대화에서 앞서 오간 말 (최근 것만) */
  history: ChatTurn[];
  /** 이 대화에서 분석한 캡처 결과가 있으면 함께 보낸다 */
  analysis?: Analysis;
  /** true면 A(오른쪽 말풍선)가 사용자 */
  meIsA: boolean;
  authCode?: string;
  devUser?: string;
}

export type ChatEvent =
  | { type: 'snapshot'; reply: Partial<ChatReply> }
  | { type: 'done'; reply: ChatReply; quota: Quota }
  | { type: 'error'; code: AnalyzeErrorCode; quota?: Quota };

export const CHAT_LIMITS = {
  maxMessageChars: 1000,
  maxHistory: 12,
  maxHistoryChars: 1200,
} as const;

export const CHAT_JSON_SCHEMA = {
  type: 'object',
  properties: { reply: { type: 'string' }, suggestion: { type: 'string' } },
  required: ['reply', 'suggestion'],
  additionalProperties: false,
} as const;
