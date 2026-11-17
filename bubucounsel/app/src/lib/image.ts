import type { UploadImage } from '../../../shared/analysis';

/**
 * AI는 이미지의 긴 변을 약 2,576px로 줄여서 읽는다.
 * 길게 이어 붙인 캡처를 그대로 보내면 글자가 뭉개지므로 세로로 잘라 보낸다.
 */
export const MAX_WIDTH = 1024;
export const TILE_HEIGHT = 2000;
/** 잘린 경계에 걸친 말풍선을 놓치지 않도록 겹치는 높이 */
export const TILE_OVERLAP = 120;
/** 이보다 짧으면 자르지 않는다 (일반 휴대폰 캡처) */
export const SINGLE_MAX_HEIGHT = 2400;

export interface Tile {
  y: number;
  height: number;
}

/** 높이 height인 이미지를 어떻게 자를지 계산한다. */
export function planTiles(height: number): Tile[] {
  if (height <= SINGLE_MAX_HEIGHT) return [{ y: 0, height }];
  const tiles: Tile[] = [];
  const step = TILE_HEIGHT - TILE_OVERLAP;
  for (let y = 0; y < height; y += step) {
    const tileHeight = Math.min(TILE_HEIGHT, height - y);
    tiles.push({ y, height: tileHeight });
    if (y + tileHeight >= height) break;
  }
  // 마지막 조각이 너무 짧으면 앞 조각에 합친다.
  const last = tiles[tiles.length - 1];
  const prev = tiles[tiles.length - 2];
  if (last && prev && last.height < TILE_OVERLAP * 2) {
    prev.height = last.y + last.height - prev.y;
    tiles.pop();
  }
  return tiles;
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('image load failed'));
    image.src = dataUrl;
  });
}

/** 캡처 한 장을 폭 1024px 이하의 JPEG 조각들로 바꾼다. */
export async function toUploadImages(dataUrl: string): Promise<UploadImage[]> {
  const image = await loadImage(dataUrl);
  const scale = Math.min(1, MAX_WIDTH / image.naturalWidth);
  const width = Math.round(image.naturalWidth * scale);
  const height = Math.round(image.naturalHeight * scale);

  return planTiles(height).map((tile) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = tile.height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('canvas unavailable');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, tile.height);
    context.drawImage(image, 0, tile.y / scale, image.naturalWidth, tile.height / scale, 0, 0, width, tile.height);
    const encoded = canvas.toDataURL('image/jpeg', 0.85);
    return { mediaType: 'image/jpeg', data: encoded.slice(encoded.indexOf(',') + 1) };
  });
}
