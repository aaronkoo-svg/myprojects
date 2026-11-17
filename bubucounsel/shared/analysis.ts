/**
 * 앱과 서버가 함께 쓰는 분석 결과 형식.
 * 화자는 A/B로만 구분한다. A = 화면 오른쪽 말풍선(보통 캡처한 사람), B = 왼쪽.
 * 누가 "나"인지는 앱 화면에서 정하므로, 양쪽 입장의 문장과 가이드를 모두 담는다.
 */
export type Speaker = 'A' | 'B';

/** good: 잘한 말, care: 아쉬운 말, hurt: 상처 주는 말 */
export type Tone = 'good' | 'care' | 'hurt';

export type Topic = 'money' | 'chores' | 'tone' | 'family' | 'contact' | 'time' | 'trust' | 'other';

export type SuggestionStyle = 'soft' | 'honest' | 'short';

export interface Suggestion {
  style: SuggestionStyle;
  text: string;
}

export interface Utterance {
  speaker: Speaker;
  /** 대화에서 옮긴 말. 욕설은 순화해서 옮긴다. */
  quote: string;
  tone: Tone;
  /** 그렇게 본 이유 한 줄 */
  note: string;
}

export interface Analysis {
  /**
   * analysis: 정상 분석
   * not_chat: 메신저 대화가 아니거나 읽을 수 없음
   * safety: 폭력·협박·자해 신호가 있어 판정 대신 안전 안내를 보여 줌
   */
  kind: 'analysis' | 'not_chat' | 'safety';
  /** 한 줄 요약 (not_chat·safety일 때는 안내 문장) */
  summary: string;
  /** 이 대화 안에서의 책임 비율. A + B = 100 */
  shareA: number;
  shareB: number;
  /** 그렇게 본 이유 두세 문장 */
  reason: string;
  topic: Topic;
  /** A가 지금 보낼 수 있는 문장 */
  suggestionsForA: Suggestion[];
  /** B가 지금 보낼 수 있는 문장 */
  suggestionsForB: Suggestion[];
  /** 짚어 볼 말들 (대화 순서대로, 최대 8개) */
  utterances: Utterance[];
  /** A가 다음에 해 볼 일 3단계 */
  guideForA: string[];
  guideForB: string[];
}

/** 스트리밍 중에는 일부 필드만 채워진 상태로 온다. */
export type PartialAnalysis = Partial<Analysis>;

export interface UploadImage {
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp';
  /** 접두사 없는 base64 */
  data: string;
}

export interface AnalyzeRequest {
  images: UploadImage[];
  /** 사용자가 적은 상황 한 줄 (선택) */
  context?: string;
  /** 토스에서 발급한 일회용 인증 코드 */
  authCode?: string;
  /** 브라우저 개발용 사용자 이름 (서버가 개발 모드일 때만 허용) */
  devUser?: string;
  /** 보상형 광고를 끝까지 보고 요청한 경우 */
  adWatched?: boolean;
}

export type AnalyzeErrorCode =
  | 'bad_request'
  | 'unauthorized'
  | 'limit_free_used'
  | 'limit_daily_max'
  | 'refused'
  | 'ai_failed';

export interface Quota {
  /** 오늘 쓴 횟수 */
  used: number;
  /** 광고 없이 쓸 수 있는 횟수 */
  free: number;
  /** 광고를 봐도 넘을 수 없는 하루 상한 */
  max: number;
}

/** 서버가 보내는 SSE 이벤트 */
export type AnalyzeEvent =
  | { type: 'snapshot'; analysis: PartialAnalysis }
  | { type: 'done'; analysis: Analysis; quota: Quota }
  | { type: 'error'; code: AnalyzeErrorCode; quota?: Quota };

export const LIMITS = {
  maxImages: 24,
  maxImageBase64Chars: 2_000_000,
  maxTotalBase64Chars: 14_000_000,
  maxContextChars: 200,
} as const;
