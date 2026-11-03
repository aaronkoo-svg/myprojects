const pad = (n: number) => String(n).padStart(2, '0');

export function dateKey(d: Date = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addDays(key: string, days: number) {
  const [y, m, d] = key.split('-').map(Number);
  return dateKey(new Date(y, m - 1, d + days));
}

export function daysBetween(a: string, b: string) {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000);
}

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

export function longDateLabel(d: Date = new Date()) {
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${DAYS[d.getDay()]}요일`;
}

export function greeting(d: Date = new Date()) {
  const h = d.getHours();
  if (h < 5) return '고요한 새벽이에요';
  if (h < 11) return '좋은 아침이에요';
  if (h < 17) return '오늘도 잘 지내고 있나요';
  return '오늘 하루 수고했어요';
}
