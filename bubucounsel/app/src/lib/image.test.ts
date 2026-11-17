import { describe, expect, it } from 'vitest';
import { planTiles, SINGLE_MAX_HEIGHT, TILE_HEIGHT, TILE_OVERLAP } from './image';
import { personalize } from './labels';

describe('planTiles', () => {
  it('일반 캡처는 자르지 않는다', () => {
    expect(planTiles(2218)).toEqual([{ y: 0, height: 2218 }]);
    expect(planTiles(SINGLE_MAX_HEIGHT)).toHaveLength(1);
  });

  it('긴 캡처는 겹치게 잘라 전체를 빠짐없이 덮는다', () => {
    for (const height of [2401, 3000, 5000, 9999, 20000]) {
      const tiles = planTiles(height);
      expect(tiles[0]!.y).toBe(0);
      const last = tiles.at(-1)!;
      expect(last.y + last.height).toBe(height);
      for (let i = 1; i < tiles.length; i++) {
        const prev = tiles[i - 1]!;
        // 앞 조각과 겹쳐야 경계의 말풍선을 놓치지 않는다
        expect(prev.y + prev.height - tiles[i]!.y).toBeGreaterThanOrEqual(TILE_OVERLAP);
      }
      for (const tile of tiles) expect(tile.height).toBeLessThanOrEqual(TILE_HEIGHT + TILE_OVERLAP * 2);
    }
  });

  it('끝에 아주 짧은 조각을 남기지 않는다', () => {
    const tiles = planTiles(TILE_HEIGHT * 2 - TILE_OVERLAP + 50);
    expect(tiles.at(-1)!.height).toBeGreaterThan(TILE_OVERLAP * 2);
  });
});

describe('personalize', () => {
  it('A/B를 나/상대로 바꾸고 조사를 맞춘다', () => {
    expect(personalize('A가 약속을 잊었고 B는 서운했어요', true)).toBe('내가 약속을 잊었고 상대는 서운했어요');
    expect(personalize('A가 약속을 잊었고 B는 서운했어요', false)).toBe('상대가 약속을 잊었고 나는 서운했어요');
    expect(personalize('B의 말이 A에게 상처가 됐어요', true)).toBe('상대의 말이 나에게 상처가 됐어요');
    expect(personalize('B의 말', false)).toBe('내 말');
  });

  it('영어 단어 속 글자는 건드리지 않는다', () => {
    expect(personalize('ABC 마트에서 BTS 얘기', true)).toBe('ABC 마트에서 BTS 얘기');
  });
});
