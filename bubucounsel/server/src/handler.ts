import { z } from 'zod';
import { LIMITS, type AnalyzeErrorCode, type AnalyzeEvent, type Quota } from '../../shared/analysis';
import type { Analyzer } from './analyze';
import { authenticate, type AuthConfig, type exchangeAuthCode } from './auth';
import { admit, quotaOf, usageKey, type UsageStore } from './limits';

export interface Deps {
  analyzer: Analyzer;
  usage: UsageStore;
  auth: AuthConfig;
  allowedOrigins: string[];
  exchange?: typeof exchangeAuthCode;
  now?: () => Date;
}

const requestSchema = z.object({
  images: z
    .array(
      z.object({
        mediaType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
        data: z.string().min(1).max(LIMITS.maxImageBase64Chars).regex(/^[A-Za-z0-9+/]+={0,2}$/),
      }),
    )
    .min(1)
    .max(LIMITS.maxImages),
  context: z.string().max(LIMITS.maxContextChars).optional(),
  authCode: z.string().max(2048).optional(),
  devUser: z.string().max(64).optional(),
  adWatched: z.boolean().optional(),
});

const feedbackSchema = z.object({
  reason: z.enum(['biased', 'misread', 'awkward', 'other']),
  swapped: z.boolean().optional(),
});

const STATUS: Record<AnalyzeErrorCode, number> = {
  bad_request: 400,
  unauthorized: 401,
  limit_free_used: 429,
  limit_daily_max: 429,
  refused: 422,
  ai_failed: 502,
};

export function createHandler(deps: Deps) {
  const now = deps.now ?? (() => new Date());

  return async function handle(request: Request): Promise<Response> {
    const origin = request.headers.get('Origin');
    const cors = corsHeaders(origin, deps.allowedOrigins);
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (origin && !cors['Access-Control-Allow-Origin']) return new Response(null, { status: 403 });

    if (request.method === 'GET' && url.pathname === '/health') {
      return Response.json({ ok: true }, { headers: cors });
    }
    if (request.method === 'POST' && url.pathname === '/feedback') {
      const parsed = feedbackSchema.safeParse(await readJson(request));
      if (!parsed.success) return fail('bad_request', cors);
      // 대화 내용 없이 사유만 센다.
      console.log('[feedback]', parsed.data.reason, parsed.data.swapped ? 'swapped' : '');
      return Response.json({ ok: true }, { headers: cors });
    }
    if (request.method === 'POST' && url.pathname === '/analyze') {
      return analyze(request, cors);
    }
    return new Response('Not found', { status: 404, headers: cors });
  };

  async function analyze(request: Request, cors: Record<string, string>): Promise<Response> {
    const parsed = requestSchema.safeParse(await readJson(request));
    if (!parsed.success) return fail('bad_request', cors);
    const body = parsed.data;
    const totalChars = body.images.reduce((sum, image) => sum + image.data.length, 0);
    if (totalChars > LIMITS.maxTotalBase64Chars) return fail('bad_request', cors);

    const auth = await authenticate(body, deps.auth, deps.exchange);
    if (!auth.ok) return fail('unauthorized', cors);

    const key = usageKey(auth.userId, now());
    const admission = admit(await deps.usage.get(key), body.adWatched === true);
    if (!admission.ok) return fail(admission.code, cors, quotaOf(await deps.usage.get(key)));

    // 동시에 여러 번 눌러 한도를 넘기지 못하게, 분석 전에 먼저 센다.
    const used = await deps.usage.increment(key);
    if (used > quotaOf(used).max) {
      await deps.usage.decrement(key);
      return fail('limit_daily_max', cors, quotaOf(used - 1));
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start: async (controller) => {
        let closed = false;
        const send = (event: AnalyzeEvent) => {
          if (closed) return;
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
          } catch {
            closed = true;
          }
        };

        const outcome = await deps.analyzer({
          images: body.images,
          context: body.context,
          onSnapshot: (analysis) => send({ type: 'snapshot', analysis }),
          signal: request.signal,
        });

        if (outcome.ok) {
          console.log(
            `[analyze] ok model=${outcome.usage.model} images=${body.images.length} in=${outcome.usage.inputTokens} out=${outcome.usage.outputTokens}`,
          );
          send({ type: 'done', analysis: outcome.analysis, quota: quotaOf(used) });
        } else {
          // 실패한 분석은 횟수에서 뺀다.
          await deps.usage.decrement(key);
          send({ type: 'error', code: outcome.code, quota: quotaOf(used - 1) });
        }
        closed = true;
        controller.close();
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        ...cors,
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Accel-Buffering': 'no',
      },
    });
  }
}

function fail(code: AnalyzeErrorCode, cors: Record<string, string>, quota?: Quota): Response {
  const event: AnalyzeEvent = { type: 'error', code, ...(quota ? { quota } : {}) };
  return Response.json(event, { status: STATUS[code], headers: cors });
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function corsHeaders(origin: string | null, allowed: string[]): Record<string, string> {
  if (!origin || !allowed.includes(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}
