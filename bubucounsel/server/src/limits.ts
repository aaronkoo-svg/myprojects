import type { Quota } from '../../shared/analysis';

export const FREE_PER_DAY = 1;
export const MAX_PER_DAY = 3;
/** 글로만 주고받는 대화는 훨씬 싸서 따로 센다. */
export const CHAT_PER_DAY = 20;

/**
 * 사용자별 하루 사용 횟수 저장소.
 * 서버에는 이 숫자만 남기고, 대화 내용이나 분석 결과는 저장하지 않는다.
 */
export interface UsageStore {
  get(key: string): Promise<number>;
  increment(key: string): Promise<number>;
  decrement(key: string): Promise<void>;
}

/**
 * 메모리 저장소. 서버가 한 대이고 재시작이 드문 동안에만 맞다.
 * 서버를 여러 대로 늘리면 Redis 같은 공용 저장소로 바꿔야 한다.
 */
export class MemoryUsageStore implements UsageStore {
  private counts = new Map<string, number>();

  async get(key: string) {
    return this.counts.get(key) ?? 0;
  }

  async increment(key: string) {
    const next = (this.counts.get(key) ?? 0) + 1;
    this.counts.set(key, next);
    return next;
  }

  async decrement(key: string) {
    const current = this.counts.get(key) ?? 0;
    if (current <= 1) this.counts.delete(key);
    else this.counts.set(key, current - 1);
  }

  /** 지난 날짜의 기록을 지운다. */
  prune(today: string) {
    for (const key of this.counts.keys()) {
      if (!key.startsWith(`${today}:`)) this.counts.delete(key);
    }
  }
}

/** 한국 시간 기준 날짜 (YYYY-MM-DD). 자정에 횟수가 초기화된다. */
export function kstDate(now: Date = new Date()): string {
  return new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function usageKey(userId: string, now?: Date, kind: 'analyze' | 'chat' = 'analyze'): string {
  return kind === 'chat' ? `${kstDate(now)}:chat:${userId}` : `${kstDate(now)}:${userId}`;
}

export function chatQuotaOf(used: number): Quota {
  return { used, free: CHAT_PER_DAY, max: CHAT_PER_DAY };
}

export function quotaOf(used: number): Quota {
  return { used, free: FREE_PER_DAY, max: MAX_PER_DAY };
}

export type Admission =
  | { ok: true }
  | { ok: false; code: 'limit_free_used' | 'limit_daily_max' };

/** 이번 요청을 받아도 되는지 판단한다. */
export function admit(used: number, adWatched: boolean): Admission {
  if (used >= MAX_PER_DAY) return { ok: false, code: 'limit_daily_max' };
  if (used >= FREE_PER_DAY && !adWatched) return { ok: false, code: 'limit_free_used' };
  return { ok: true };
}
