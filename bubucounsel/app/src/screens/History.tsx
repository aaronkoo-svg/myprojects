import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, TabBar } from '../components/ui';
import { clearHistory, useHistory } from '../lib/history';
import { formatDate, personalize, TOPIC_LABEL } from '../lib/labels';

export function History() {
  const { items, loaded } = useHistory();
  const [confirming, setConfirming] = useState(false);

  return (
    <main className="screen with-tabbar">
      <header className="hero compact">
        <h1 className="title-1">기록</h1>
        <p className="body muted">지난 분석은 이 기기에만 보관돼요. 토스 앱을 지우면 함께 사라져요.</p>
      </header>

      {loaded && items.length === 0 && (
        <div className="card empty">
          <p className="body-strong">아직 분석한 대화가 없어요</p>
          <p className="caption muted">홈에서 대화 캡처를 올리면 여기에 쌓여요.</p>
          <Link to="/" className="btn btn-secondary">
            홈으로 가기
          </Link>
        </div>
      )}

      {items.length > 0 && (
        <>
          <ul className="record-list">
            {items.map((item) => (
              <li key={item.id}>
                <Link to={`/result/${item.id}`} className="record">
                  <span className="record-summary">{personalize(item.analysis.summary, item.meIsA)}</span>
                  <span className="caption muted">
                    {formatDate(item.createdAt)} · {TOPIC_LABEL[item.analysis.topic]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="center danger-zone">
            {confirming ? (
              <div className="confirm">
                <p className="caption">기록을 모두 지울까요? 되돌릴 수 없어요.</p>
                <div className="confirm-actions">
                  <Button variant="secondary" onClick={() => setConfirming(false)}>
                    그대로 두기
                  </Button>
                  <Button
                    variant="secondary"
                    className="danger"
                    onClick={() => {
                      clearHistory();
                      setConfirming(false);
                    }}
                  >
                    모두 지우기
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="text" className="subtle" onClick={() => setConfirming(true)}>
                기록 모두 지우기
              </Button>
            )}
          </div>
        </>
      )}

      <TabBar />
    </main>
  );
}
