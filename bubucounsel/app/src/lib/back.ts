/**
 * 뒤로가기를 화면 이동보다 먼저 가로챌 것들(크게 보기 같은 겹친 화면).
 * 가장 나중에 등록한 것이 먼저 처리된다.
 */
const handlers: (() => void)[] = [];

export function pushBackHandler(handler: () => void): () => void {
  handlers.push(handler);
  return () => {
    const index = handlers.lastIndexOf(handler);
    if (index !== -1) handlers.splice(index, 1);
  };
}

/** 처리할 것이 있으면 처리하고 true */
export function runBackHandler(): boolean {
  const handler = handlers.pop();
  if (!handler) return false;
  handler();
  return true;
}
