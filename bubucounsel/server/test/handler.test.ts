import { describe, expect, it } from 'vitest';
import type { Analysis, AnalyzeEvent } from '../../shared/analysis';
import type { Analyzer, Chatter } from '../src/analyze';
import { createHandler, type Deps } from '../src/handler';
import { admit, kstDate, MemoryUsageStore } from '../src/limits';
import { normalize } from '../src/schema';

const ORIGIN = 'http://localhost:5173';
const IMAGE = { mediaType: 'image/jpeg' as const, data: 'AAAA' };

const sample: Analysis = {
  kind: 'analysis',
  summary: '요약',
  shareA: 40,
  shareB: 60,
  reason: '이유',
  topic: 'time',
  suggestionsForA: [],
  suggestionsForB: [],
  utterances: [],
  guideForA: [],
  guideForB: [],
};

const okAnalyzer: Analyzer = async ({ onSnapshot }) => {
  onSnapshot({ kind: 'analysis', summary: '요' });
  return { ok: true, analysis: sample, usage: { inputTokens: 1, outputTokens: 1, model: 'test' } };
};

const okChatter: Chatter = async ({ onSnapshot }) => {
  onSnapshot({ reply: '그랬' });
  return { ok: true, reply: { reply: '그랬군요.', suggestion: '' }, usage: { inputTokens: 1, outputTokens: 1, model: 'test' } };
};

function setup(overrides: Partial<Deps> = {}) {
  const usage = new MemoryUsageStore();
  const handle = createHandler({
    analyzer: okAnalyzer,
    chatter: okChatter,
    usage,
    auth: { allowDevAuth: true },
    allowedOrigins: [ORIGIN],
    ...overrides,
  });
  const post = (body: unknown, origin = ORIGIN) =>
    handle(
      new Request('http://localhost/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: origin },
        body: JSON.stringify(body),
      }),
    );
  return { handle, post, usage };
}

async function events(response: Response): Promise<AnalyzeEvent[]> {
  const text = await response.text();
  if (response.headers.get('Content-Type')?.includes('application/json')) return [JSON.parse(text)];
  return text
    .split('\n\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line.replace(/^data: /, '')));
}

describe('POST /analyze', () => {
  it('부분 결과를 흘려보낸 뒤 최종 결과와 남은 횟수를 보낸다', async () => {
    const { post } = setup();
    const response = await post({ images: [IMAGE], devUser: 'u1' });
    expect(response.status).toBe(200);
    const list = await events(response);
    expect(list.map((e) => e.type)).toEqual(['snapshot', 'done']);
    expect(list[1]).toMatchObject({ type: 'done', quota: { used: 1, free: 1, max: 3 } });
  });

  it('이미지가 없거나 형식이 틀리면 거절한다', async () => {
    const { post } = setup();
    expect((await post({ images: [], devUser: 'u1' })).status).toBe(400);
    expect((await post({ images: [{ mediaType: 'image/gif', data: 'AAAA' }], devUser: 'u1' })).status).toBe(400);
    expect((await post({ images: [{ ...IMAGE, data: '<script>' }], devUser: 'u1' })).status).toBe(400);
    expect((await post({ images: [IMAGE], devUser: 'u1', context: 'x'.repeat(201) })).status).toBe(400);
  });

  it('인증 정보가 없으면 거절하고, 개발 로그인이 꺼져 있으면 devUser를 받지 않는다', async () => {
    expect((await setup().post({ images: [IMAGE] })).status).toBe(401);
    const strict = setup({ auth: { allowDevAuth: false } });
    expect((await strict.post({ images: [IMAGE], devUser: 'u1' })).status).toBe(401);
  });

  it('토스 인증 코드를 교환해 받은 키로 사용자를 구분한다', async () => {
    const seen: string[] = [];
    const { post, usage } = setup({
      auth: { allowDevAuth: false, tossCert: 'cert', tossKey: 'key' },
      exchange: async (code) => {
        seen.push(code);
        return code === 'good' ? 'anon-1' : null;
      },
    });
    expect((await post({ images: [IMAGE], authCode: 'bad' })).status).toBe(401);
    const ok = await post({ images: [IMAGE], authCode: 'good' });
    await ok.text();
    expect(ok.status).toBe(200);
    expect(seen).toEqual(['bad', 'good']);
    expect(await usage.get(`${kstDate()}:toss:anon-1`)).toBe(1);
  });

  it('무료 1회 뒤에는 광고를 봐야 하고, 하루 3회를 넘을 수 없다', async () => {
    const { post } = setup();
    const run = async (adWatched?: boolean) => {
      const response = await post({ images: [IMAGE], devUser: 'u1', adWatched });
      return { status: response.status, last: (await events(response)).at(-1)! };
    };
    expect((await run()).status).toBe(200);
    expect(await run()).toMatchObject({ status: 429, last: { code: 'limit_free_used', quota: { used: 1 } } });
    expect((await run(true)).status).toBe(200);
    expect((await run(true)).status).toBe(200);
    expect(await run(true)).toMatchObject({ status: 429, last: { code: 'limit_daily_max', quota: { used: 3 } } });
  });

  it('분석이 실패하면 횟수를 돌려준다', async () => {
    const { post, usage } = setup({ analyzer: async () => ({ ok: false, code: 'refused' }) });
    const response = await post({ images: [IMAGE], devUser: 'u1' });
    expect((await events(response)).at(-1)).toMatchObject({ type: 'error', code: 'refused', quota: { used: 0 } });
    expect(await usage.get(`${kstDate()}:dev:u1`)).toBe(0);
  });

  it('허용하지 않은 Origin은 막는다', async () => {
    const { post } = setup();
    expect((await post({ images: [IMAGE], devUser: 'u1' }, 'https://evil.example')).status).toBe(403);
  });
});

describe('한도 판단', () => {
  it('admit', () => {
    expect(admit(0, false)).toEqual({ ok: true });
    expect(admit(1, false)).toEqual({ ok: false, code: 'limit_free_used' });
    expect(admit(2, true)).toEqual({ ok: true });
    expect(admit(3, true)).toEqual({ ok: false, code: 'limit_daily_max' });
  });

  it('한국 시간 자정에 날짜가 바뀐다', () => {
    expect(kstDate(new Date('2026-11-17T14:59:00Z'))).toBe('2026-11-17');
    expect(kstDate(new Date('2026-11-17T15:00:00Z'))).toBe('2026-11-18');
  });
});

describe('normalize', () => {
  it('책임 비율을 합이 100인 정수로 맞춘다', () => {
    expect(normalize({ ...sample, shareA: 1, shareB: 2 })).toMatchObject({ shareA: 33, shareB: 67 });
    expect(normalize({ ...sample, shareA: 0, shareB: 0 })).toMatchObject({ shareA: 50, shareB: 50 });
    expect(normalize({ ...sample, shareA: -5, shareB: 80 })).toMatchObject({ shareA: 0, shareB: 100 });
  });
});

describe('JSON 스키마', () => {
  it('앱용 JSON 스키마가 서버 zod 스키마와 같은 필드를 가진다', async () => {
    const { ANALYSIS_JSON_SCHEMA } = await import('../../shared/jsonSchema');
    const { analysisSchema } = await import('../src/schema');
    expect([...ANALYSIS_JSON_SCHEMA.required].sort()).toEqual(Object.keys(analysisSchema.shape).sort());
    expect(analysisSchema.safeParse(sample).success).toBe(true);
  });
});

describe('POST /chat', () => {
  const chatPost = (handle: (r: Request) => Promise<Response>, body: unknown) =>
    handle(
      new Request('http://localhost/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
        body: JSON.stringify(body),
      }),
    );

  it('답을 흘려보내고 대화 횟수를 분석 횟수와 따로 센다', async () => {
    const { handle, usage } = setup();
    const response = await chatPost(handle, { message: '서운했어', history: [], meIsA: true, devUser: 'u1', analysis: sample });
    const list = await events(response);
    expect(list.map((e) => e.type)).toEqual(['snapshot', 'done']);
    expect(await usage.get(`${kstDate()}:chat:dev:u1`)).toBe(1);
    expect(await usage.get(`${kstDate()}:dev:u1`)).toBe(0);
  });

  it('빈 메시지, 너무 긴 기록, 형식이 틀린 분석은 거절한다', async () => {
    const { handle } = setup();
    expect((await chatPost(handle, { message: '  ', history: [], meIsA: true, devUser: 'u1' })).status).toBe(400);
    const long = Array.from({ length: 13 }, () => ({ role: 'user', text: 'a' }));
    expect((await chatPost(handle, { message: 'a', history: long, meIsA: true, devUser: 'u1' })).status).toBe(400);
    expect((await chatPost(handle, { message: 'a', history: [], meIsA: true, devUser: 'u1', analysis: { kind: 'x' } })).status).toBe(400);
  });

  it('하루 20번을 넘으면 막는다', async () => {
    const { handle } = setup();
    for (let i = 0; i < 20; i++) {
      const r = await chatPost(handle, { message: 'a', history: [], meIsA: true, devUser: 'u2' });
      await r.text();
      expect(r.status).toBe(200);
    }
    const blocked = await chatPost(handle, { message: 'a', history: [], meIsA: true, devUser: 'u2' });
    expect(blocked.status).toBe(429);
  });
});
