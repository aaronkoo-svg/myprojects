import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { Readable } from 'node:stream';
import { createClaudeAnalyzer, type Effort } from './analyze';
import { fakeAnalyzer } from './fake';
import { createHandler } from './handler';
import { kstDate, MemoryUsageStore } from './limits';

const env = process.env;
const port = Number(env.PORT ?? 8787);
const MAX_BODY_BYTES = 16 * 1024 * 1024;

const readPem = (inline?: string, path?: string) => inline ?? (path ? readFileSync(path, 'utf8') : undefined);

const usage = new MemoryUsageStore();
setInterval(() => usage.prune(kstDate()), 60 * 60 * 1000).unref();

const model = env.ANALYSIS_MODEL ?? 'claude-opus-5-5';
const fake = env.FAKE_ANALYZER === '1';
const handle = createHandler({
  analyzer: fake
    ? fakeAnalyzer
    : createClaudeAnalyzer({
        model,
        effort: (env.ANALYSIS_EFFORT || undefined) as Effort | undefined,
        useFallbacks: env.ANALYSIS_FALLBACKS !== '0',
      }),
  usage,
  auth: {
    tossCert: readPem(env.TOSS_MTLS_CERT, env.TOSS_MTLS_CERT_FILE),
    tossKey: readPem(env.TOSS_MTLS_KEY, env.TOSS_MTLS_KEY_FILE),
    allowDevAuth: env.ALLOW_DEV_AUTH === '1',
  },
  allowedOrigins: (env.ALLOWED_ORIGINS ?? 'http://localhost:5173').split(',').map((s) => s.trim()),
});

createServer(async (req, res) => {
  try {
    const length = Number(req.headers['content-length'] ?? 0);
    if (length > MAX_BODY_BYTES) {
      res.writeHead(413).end();
      return;
    }
    const controller = new AbortController();
    res.on('close', () => controller.abort());

    const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
    const request = new Request(`http://${req.headers.host ?? 'localhost'}${req.url ?? '/'}`, {
      method: req.method,
      headers: req.headers as Record<string, string>,
      body: hasBody ? (Readable.toWeb(req) as ReadableStream<Uint8Array>) : undefined,
      duplex: 'half',
      signal: controller.signal,
    } as RequestInit);

    const response = await handle(request);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    if (!response.body) {
      res.end();
      return;
    }
    for await (const chunk of response.body) res.write(chunk);
    res.end();
  } catch (error) {
    console.error('[server] error:', (error as Error).name);
    if (!res.headersSent) res.writeHead(500);
    res.end();
  }
}).listen(port, () => {
  console.log(`분석 서버: http://localhost:${port} (model=${fake ? '가짜 분석기' : model}, devAuth=${env.ALLOW_DEV_AUTH === '1'})`);
  if (fake) console.warn('FAKE_ANALYZER=1: AI를 부르지 않고 예시 결과만 돌려줍니다. 운영에서는 쓰지 마세요.');
});
