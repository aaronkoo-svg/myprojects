import { useNavigate } from 'react-router-dom';
import { Mascot } from '../components/Mascot';
import { TabBar } from '../components/ui';
import { startRefine } from './Home';

export function Practice() {
  const navigate = useNavigate();
  return (
    <main className="screen with-tabbar">
      <header className="page-head">
        <h1 className="title-1">연습해 보기</h1>
        <p className="body muted">다음 대화는 조금 더 편하게 할 수 있게, 미리 연습해요.</p>
      </header>

      <div className="practice-grid">
        <button type="button" className="practice-card" onClick={() => startRefine(navigate)}>
          <span className="practice-art green">
            <Mascot variant="green" size={104} />
          </span>
          <span className="practice-text">
            <span className="caption muted">답장 다듬기</span>
            <span className="practice-title">
              보내기 전에
              <br />한 번 고쳐 보기
            </span>
          </span>
        </button>

        <div className="practice-card disabled" aria-disabled="true">
          <span className="practice-art orange">
            <Mascot variant="orange" size={104} />
            <span className="soon">곧 열려요</span>
          </span>
          <span className="practice-text">
            <span className="caption muted">실전 연습</span>
            <span className="practice-title">
              그날 대화
              <br />
              다시 해 보기
            </span>
          </span>
        </div>
      </div>

      <section className="card-soft">
        <p className="body-strong">실전 연습은 이렇게 열릴 거예요</p>
        <p className="caption muted">
          분석한 대화를 무대로 토닥이가 상대 역할을 맡아요. 그때 했던 말 대신 다른 말을 골라 보고, 대화가 어떻게 달라지는지 확인할 수 있어요.
        </p>
      </section>

      <TabBar />
    </main>
  );
}
