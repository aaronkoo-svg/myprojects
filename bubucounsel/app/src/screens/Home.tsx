import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AiBadge, Button, TabBar } from '../components/ui';
import { useHistory } from '../lib/history';
import { setDraft } from '../lib/job';
import { formatDate, personalize, TOPIC_LABEL } from '../lib/labels';
import { MAX_PHOTOS, pickPhotos } from '../lib/toss';

const PICK_ERROR = {
  permission: '사진 접근이 꺼져 있어요. 오른쪽 위 더보기(⋯)의 권한 설정에서 켠 뒤 다시 눌러 주세요.',
  unsupported: '토스 앱을 최신 버전으로 업데이트하면 사진을 올릴 수 있어요.',
  failed: '사진을 불러오지 못했어요. 다시 한 번 눌러 주세요.',
} as const;

export function Home() {
  const navigate = useNavigate();
  const { items } = useHistory();
  const [error, setError] = useState<keyof typeof PICK_ERROR | null>(null);
  const [picking, setPicking] = useState(false);

  const upload = async () => {
    setError(null);
    setPicking(true);
    const result = await pickPhotos(MAX_PHOTOS);
    setPicking(false);
    if (!result.ok) {
      setError(result.reason);
      return;
    }
    if (result.dataUrls.length === 0) return;
    setDraft({ photos: result.dataUrls, context: '' });
    navigate('/preview');
  };

  return (
    <main className="screen with-tabbar">
      <header className="hero">
        <h1 className="title-1">
          다툰 대화,
          <br />
          같이 살펴봐요
        </h1>
        <p className="body muted">
          메신저 대화 캡처를 올리면 어디서 엇갈렸는지, 지금 뭐라고 보내면 좋을지 알려 드려요.
        </p>
      </header>

      <section className="card upload-card">
        <div className="upload-icon" aria-hidden="true">
          <svg viewBox="0 0 48 48" width="44" height="44" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 12a5 5 0 0 1 5-5h20a5 5 0 0 1 5 5v14a5 5 0 0 1-5 5H22l-9 7v-7.2A5 5 0 0 1 9 26z" />
            <path d="M17 16h14M17 22h9" />
          </svg>
        </div>
        <Button onClick={upload} disabled={picking}>
          대화 캡처 올리기
        </Button>
        <p className="caption muted center">최대 {MAX_PHOTOS}장 · 길게 이어 붙인 캡처도 괜찮아요</p>
        {error && (
          <p className="notice-error" role="alert">
            {PICK_ERROR[error]}
          </p>
        )}
      </section>

      <div className="center">
        <Link to="/result/sample" className="btn btn-text">
          예시로 먼저 보기
        </Link>
      </div>

      <ul className="notice-list">
        <li>
          <AiBadge /> 결과는 생성형 AI가 만들어요. 전문 상담을 대신하지 않아요.
        </li>
        <li>캡처는 분석을 위해 AI 서비스로 전송되고, 저희 서버에는 저장하지 않아요.</li>
        <li>분석 결과는 이 기기에만 보관돼요.</li>
      </ul>

      {items.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2 className="title-2">최근 분석</h2>
            <Link to="/history" className="link">
              전체 보기
            </Link>
          </div>
          <ul className="record-list">
            {items.slice(0, 2).map((item) => (
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
        </section>
      )}

      <TabBar />
    </main>
  );
}
