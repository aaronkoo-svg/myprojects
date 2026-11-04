import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';

import { getApiKey } from '@/lib/ai-key';

// AI 목표 도우미: 사용자가 쓴 윗단계 목표를 바탕으로 아랫단계 후보를 제안한다.
// 제안만 하고 저장은 사용자가 고른 것만 한다.

const MODEL = 'claude-opus-5-5';

export type Suggestion = { title: string; why: string };

const SuggestionList = z.object({
  suggestions: z.array(
    z.object({
      title: z.string().describe('목표 문장. 한국어, 25자 안팎, 명사형이나 "~하기"로 끝남'),
      why: z.string().describe('이 목표가 위 목표에 어떻게 이어지는지 한 문장, 존댓말'),
    }),
  ),
});

const SYSTEM = `당신은 GoalMorning 앱의 목표 코치입니다. 사용자가 적은 비전과 목표를 존중하며, 그 아래 단계의 구체적인 목표를 제안합니다.

원칙:
- 한국어로, 따뜻하지만 군더더기 없이 씁니다.
- 사용자의 표현과 맥락을 살리고, 일반론이나 뻔한 자기계발 문구는 피합니다.
- 서로 다른 방향의 후보를 제안해 사용자가 고를 수 있게 합니다.
- 이미 있는 목표와 겹치는 것은 제안하지 않습니다.
- 사용자가 실제로 해낼 수 있는 크기로 제안합니다.`;

type Request =
  | { level: 'long'; vision: { title: string; why: string }; existing: string[] }
  | {
      level: 'short';
      vision?: { title: string; why: string };
      long: { title: string; why: string };
      existing: string[];
    };

function buildPrompt(r: Request) {
  const lines: string[] = [];
  const goal = (label: string, g: { title: string; why: string }) => {
    lines.push(`${label}: ${g.title}`);
    if (g.why) lines.push(`왜: ${g.why}`);
  };
  if (r.vision) goal('나의 미래 비전 (5~10년)', r.vision);
  if (r.level === 'long') {
    lines.push(
      '',
      '이 비전으로 가기 위한 장기 목표(1~3년 안에 이룰 수 있고, 이뤘는지 판단할 수 있는 것)를 3개 제안해 주세요.',
    );
  } else {
    goal('장기 목표 (1~3년)', r.long);
    lines.push(
      '',
      '이 장기 목표를 향해 이번 주에 할 수 있는 단기 계획 3개를 제안해 주세요. 하루 30분~1시간 안팎으로 시작할 수 있을 만큼 작고 구체적으로.',
    );
  }
  if (r.existing.length) lines.push('', `이미 있는 목표 (겹치지 않게): ${r.existing.join(' / ')}`);
  return lines.join('\n');
}

export class AiError extends Error {
  constructor(
    public kind: 'no-key' | 'bad-key' | 'network' | 'busy' | 'declined' | 'unknown',
    message: string,
  ) {
    super(message);
  }
}

export function makeClient(apiKey: string) {
  // 이 앱은 사용자 본인의 키를 본인 폰에서만 쓴다. 웹 미리보기도 같은 이유로 허용.
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true, maxRetries: 2, timeout: 60_000 });
}

export async function suggestGoals(r: Request): Promise<Suggestion[]> {
  const apiKey = await getApiKey();
  if (!apiKey) throw new AiError('no-key', 'AI 도우미를 쓰려면 설정에서 API 키를 먼저 넣어주세요.');

  try {
    const res = await makeClient(apiKey).beta.messages.parse({
      model: MODEL,
      max_tokens: 4000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default', // 안전 필터가 거절하면 서버가 다른 모델로 이어서 답한다
      system: SYSTEM,
      output_config: { effort: 'low', format: betaZodOutputFormat(SuggestionList) },
      messages: [{ role: 'user', content: buildPrompt(r) }],
    });

    if (res.stop_reason === 'refusal') {
      throw new AiError('declined', '이 내용으로는 제안을 만들 수 없었어요. 문장을 조금 바꿔서 다시 시도해 주세요.');
    }
    const list = res.parsed_output?.suggestions ?? [];
    if (list.length === 0) throw new AiError('unknown', '제안을 받지 못했어요. 다시 시도해 주세요.');
    return list.slice(0, 5).map((s) => ({ title: s.title.trim(), why: s.why.trim() }));
  } catch (e) {
    throw toAiError(e);
  }
}

// API 키가 맞는지 확인 (토큰을 쓰지 않는 모델 정보 조회)
export async function checkApiKey(apiKey: string) {
  try {
    await makeClient(apiKey).models.retrieve(MODEL);
  } catch (e) {
    throw toAiError(e);
  }
}

function toAiError(e: unknown): AiError {
  if (e instanceof AiError) return e;
  if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError)
    return new AiError('bad-key', 'API 키가 올바르지 않아요. 설정에서 키를 다시 확인해 주세요.');
  if (e instanceof Anthropic.RateLimitError)
    return new AiError('busy', '요청이 많아 잠시 쉬어야 해요. 조금 뒤에 다시 시도해 주세요.');
  if (e instanceof Anthropic.APIConnectionError)
    return new AiError('network', '인터넷에 연결되지 않았어요. 연결을 확인하고 다시 시도해 주세요.');
  if (e instanceof Anthropic.APIError && (e.status ?? 0) >= 500)
    return new AiError('busy', 'AI 서비스가 잠시 바빠요. 조금 뒤에 다시 시도해 주세요.');
  if (e instanceof Anthropic.APIError)
    return new AiError('unknown', `요청을 처리하지 못했어요 (${e.status ?? '오류'}). 다시 시도해 주세요.`);
  return new AiError('unknown', '알 수 없는 문제가 생겼어요. 다시 시도해 주세요.');
}
