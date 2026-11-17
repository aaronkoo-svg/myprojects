import https from 'node:https';

export interface AuthConfig {
  /** 토스 콘솔에서 발급한 mTLS 인증서 (PEM 본문) */
  tossCert?: string;
  tossKey?: string;
  /** 브라우저 개발용. 운영에서는 반드시 꺼 둔다. */
  allowDevAuth: boolean;
}

export type AuthResult = { ok: true; userId: string } | { ok: false };

const EXCHANGE_HOST = 'apps-in-toss-api.toss.im';
const EXCHANGE_PATH = '/api-partner/v1/apps-in-toss/users/anon-key/exchange';

interface ExchangeResponse {
  resultType: 'SUCCESS' | 'FAIL';
  success?: { anonKey: string };
}

/** 일회용 인증 코드를 토스 서버에서 사용자 식별키로 바꾼다. (mTLS) */
export function exchangeAuthCode(code: string, cert: string, key: string): Promise<string | null> {
  const body = JSON.stringify({ code });
  return new Promise((resolve) => {
    const req = https.request(
      {
        host: EXCHANGE_HOST,
        path: EXCHANGE_PATH,
        method: 'POST',
        cert,
        key,
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
        timeout: 10_000,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8')) as ExchangeResponse;
            resolve(parsed.resultType === 'SUCCESS' ? (parsed.success?.anonKey ?? null) : null);
          } catch {
            resolve(null);
          }
        });
      },
    );
    req.on('timeout', () => req.destroy());
    req.on('error', () => resolve(null));
    req.end(body);
  });
}

export async function authenticate(
  input: { authCode?: string; devUser?: string },
  config: AuthConfig,
  exchange: typeof exchangeAuthCode = exchangeAuthCode,
): Promise<AuthResult> {
  if (input.authCode && config.tossCert && config.tossKey) {
    const anonKey = await exchange(input.authCode, config.tossCert, config.tossKey);
    return anonKey ? { ok: true, userId: `toss:${anonKey}` } : { ok: false };
  }
  if (config.allowDevAuth && input.devUser && /^[\w-]{1,64}$/.test(input.devUser)) {
    return { ok: true, userId: `dev:${input.devUser}` };
  }
  return { ok: false };
}
