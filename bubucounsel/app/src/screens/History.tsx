import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Topic } from '../../../shared/analysis';
import { Mascot } from '../components/Mascot';
import { Button, Icon, TabBar } from '../components/ui';
import { formatDate, personalize, TOPIC_LABEL } from '../lib/labels';
import { clearThreads, latestAnalysis, threadTitle, useThreads, type Thread } from '../lib/threads';

/** 이번 달 분석한 대화에서 가장 많이 나온 주제 */
function topTopic(threads: Thread[], now = new Date()) {
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const counts = new Map<Topic, { count: number; latest: Thread }>();
  let total = 0;
  for (const thread of threads) {
    if (thread.createdAt < monthStart) continue;
    const found = latestAnalysis(thread);
    if (found?.analysis.kind !== 'analysis') continue;
    total += 1;
    const entry = counts.get(found.analysis.topic);
    counts.set(found.analysis.topic, { count: (entry?.count ?? 0) + 1, latest: entry?.latest ?? thread });
  }
  let best: { topic: Topic; count: number; latest: Thread } | null = null;
  for (const [topic, entry] of counts) if (!best || entry.count > best.count) best = { topic, ...entry };
  return best ? { ...best, total } : null;
}

export function History() {
  const { threads, loaded } = useThreads();
  const [confirming, setConfirming] = useState(false);
  const top = topTopic(threads);

  return (
    <main className="screen with-tabbar">
      <h1 className="title-1 page-title">우리 대화 돌아보기</h1>

      {top && (
        <section className="feature-card purple">
          <div className="feature-art">
            <span className="feature-chip">이번 달 가장 많이 부딪힌 주제</span>
            <Mascot variant="purple" size={150} />
          </div>
          <Link to={`/chat/${top.latest.id}`} className="feature-foot">
            <span className="feature-text">
              <span className="feature-title">
                {TOPIC_LABEL[top.topic]} {top.count}번
              </span>
              <span className="caption muted">
                이번 달 분석한 대화 {top.total}번 중 {top.count}번이에요
              </span>
            </span>
            <span className="round-arrow" aria-hidden="true">
              <Icon.chevron size={20} />
            </span>
          </Link>
        </section>
      )}

      {loaded && threads.length === 0 && (
        <div className="empty">
          <Mascot variant="purple" size={110} />
          <p className="body-strong">아직 나눈 대화가 없어요</p>
          <p className="caption muted">투닥이와 대화하면 여기에 쌓여요. 이 기기에만 저장돼요.</p>
          <Link to="/" className="btn btn-secondary">
            대화 시작하기
          </Link>
        </div>
      )}

      {threads.length > 0 && (
        <section className="section">
          <h2 className="title-2">지난 대화</h2>
          <ul className="record-list">
            {threads.map((thread) => {
              const found = latestAnalysis(thread);
              const topic = found?.analysis.kind === 'analysis' ? TOPIC_LABEL[found.analysis.topic] : '대화';
              return (
                <li key={thread.id}>
                  <Link to={`/chat/${thread.id}`} className="recent">
                    <span className="recent-text">
                      <span className="recent-title">{personalize(threadTitle(thread), thread.meIsA)}</span>
                      <span className="caption muted">
                        {formatDate(thread.updatedAt)} · {topic}
                      </span>
                    </span>
                    <Icon.chevron size={18} />
                  </Link>
                </li>
              );
            })}
          </ul>
          <p className="fine-print">대화는 이 기기에만 저장되고, 토스 앱을 지우면 함께 사라져요.</p>
          <div className="danger-zone">
            {confirming ? (
              <div className="confirm">
                <p className="caption">대화를 모두 지울까요? 되돌릴 수 없어요.</p>
                <div className="confirm-actions">
                  <Button variant="secondary" onClick={() => setConfirming(false)}>
                    그대로 두기
                  </Button>
                  <Button
                    variant="secondary"
                    className="danger"
                    onClick={() => {
                      clearThreads();
                      setConfirming(false);
                    }}
                  >
                    모두 지우기
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="text" className="subtle" onClick={() => setConfirming(true)}>
                대화 모두 지우기
              </Button>
            )}
          </div>
        </section>
      )}

      <TabBar />
    </main>
  );
}
