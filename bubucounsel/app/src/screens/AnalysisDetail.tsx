import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { SAMPLE_CHAT } from '../../../shared/sample';
import { AppBar } from '../components/AppBar';
import { Mascot } from '../components/Mascot';
import { AiBadge, BottomBar, Button, Icon } from '../components/ui';
import { pushBackHandler } from '../lib/back';
import { formatDate, personalize, STYLE_LABEL } from '../lib/labels';
import { thumbnailsOf } from '../lib/run';
import { SAMPLE_ID, setMeIsA, useThread, useThreads, type Message } from '../lib/threads';
import { Feedback, GuideList, SafetyCard, SuggestionBlock, WhyList } from './Chat';

/** 분석 하나를 한 화면에서 자세히 본다: 보낸 대화, 판정, 짚어 볼 말, 다음엔 이렇게, 보낼 문장 */
export function AnalysisDetail() {
  const { id = '', mid = '' } = useParams();
  const navigate = useNavigate();
  const thread = useThread(id);
  const { loaded } = useThreads();
  const [zoomed, setZoomed] = useState<string | null>(null);
  // 크게 보기가 열려 있으면 뒤로가기는 그것만 닫는다. (안드로이드 테스트 APK)
  useEffect(() => (zoomed ? pushBackHandler(() => setZoomed(null)) : undefined), [zoomed]);

  const index = thread?.messages.findIndex((m) => m.id === mid) ?? -1;
  const message = index >= 0 ? thread?.messages[index] : undefined;
  if (!thread || message?.kind !== 'analysis') {
    if (!loaded) return null;
    return (
      <main className="screen">
        <div className="empty">
          <Mascot size={96} variant="purple" />
          <p className="body-strong">이 분석을 찾을 수 없어요</p>
          <Link to="/" className="btn btn-secondary">
            홈으로 가기
          </Link>
        </div>
      </main>
    );
  }

  const { analysis } = message;
  const meIsA = thread.meIsA;
  const say = (text: string) => personalize(text, meIsA);
  // 이 분석 바로 앞에 보낸 캡처
  let captures: Extract<Message, { kind: 'captures' }> | undefined;
  for (let i = index - 1; i >= 0; i--) {
    const m = thread.messages[i];
    if (m?.kind === 'captures') {
      captures = m;
      break;
    }
  }
  const thumbs = captures ? thumbnailsOf(captures.id) : undefined;
  const isSample = thread.id === SAMPLE_ID;
  const myShare = meIsA ? analysis.shareA : analysis.shareB;
  const suggestions = meIsA ? analysis.suggestionsForA : analysis.suggestionsForB;

  return (
    <main className="screen with-bottom-bar detail">
      <AppBar back />
      <header className="page-head">
        <span className="caption muted">{isSample ? '예시 대화' : `${formatDate(message.at)} 분석`}</span>
        <h1 className="title-1">분석 자세히 보기</h1>
      </header>

      <section className="section">
        <h2 className="title-2">보낸 대화</h2>
        <div className="card-soft">
          {isSample ? (
            <div className="sample-chat wide" aria-label="예시 대화">
              {SAMPLE_CHAT.map((line, i) => (
                <span key={i} className={`mini-bubble ${line.speaker === 'A' ? 'right' : 'left'}`}>
                  {line.text}
                </span>
              ))}
            </div>
          ) : thumbs ? (
            <div className="detail-thumbs">
              {thumbs.map((src, i) => (
                <button key={i} type="button" onClick={() => setZoomed(src)} aria-label={`${i + 1}번째 캡처 크게 보기`}>
                  <img src={src} alt="" />
                </button>
              ))}
            </div>
          ) : (
            <p className="caption muted">
              <Icon.photo size={16} /> 캡처 {captures?.count ?? 0}장을 보냈어요. 원본 이미지는 저장하지 않아서 다시 볼 수 없어요. 아래 "짚어 볼 말"에 투닥이가 읽은 원문이 있어요.
            </p>
          )}
          {captures?.context && (
            <p className="caption">
              <strong>적어 준 상황</strong> {captures.context}
            </p>
          )}
        </div>
      </section>

      {analysis.kind === 'safety' ? (
        <SafetyCard message={analysis.summary} />
      ) : analysis.kind === 'not_chat' ? (
        <p className="bubble-agent">{analysis.summary}</p>
      ) : (
        <>
          <section className="verdict">
            <div className="verdict-meta">
              <AiBadge />
              <span className="caption muted">보내 준 대화 안에서만 봤어요</span>
            </div>
            <p className="verdict-title">{say(analysis.summary)}</p>
            <div className="share" role="img" aria-label={`나 ${myShare}, 상대 ${100 - myShare}`}>
              <div className="share-labels">
                <span>
                  나 <strong>{myShare}</strong>
                </span>
                <span>
                  상대 <strong>{100 - myShare}</strong>
                </span>
              </div>
              <div className="share-bar">
                <span style={{ width: `${myShare}%` }} />
              </div>
              <p className="caption muted">다툼이 커진 데 각자의 말이 차지한 몫이에요</p>
            </div>
            <p className="verdict-reason">{say(analysis.reason)}</p>
          </section>

          <section className="section">
            <h2 className="title-2">왜 그렇게 봤나요</h2>
            <p className="caption muted">다툼의 흐름을 바꾼 말을 대화 순서대로 짚었어요.</p>
            <div className="card-agent">
              <WhyList analysis={analysis} meIsA={meIsA} />
            </div>
          </section>

          <section className="section">
            <h2 className="title-2">다음엔 이렇게</h2>
            <div className="card-agent">
              <GuideList analysis={analysis} meIsA={meIsA} />
            </div>
          </section>

          <section className="section">
            <h2 className="title-2">이렇게 보내 보세요</h2>
            {suggestions.map((s, i) => (
              <SuggestionBlock key={i} label={STYLE_LABEL[s.style]} text={s.text} />
            ))}
          </section>

          <section className="section detail-foot">
            <button type="button" className="chip-follow" onClick={() => setMeIsA(thread.id, !meIsA)}>
              나와 상대 바꾸기
            </button>
            <span className="caption muted">지금은 {meIsA ? '오른쪽' : '왼쪽'} 말풍선을 나로 봤어요</span>
            {!isSample && <Feedback swapped={!meIsA} />}
            <p className="fine-print">
              보낸 캡처와 적어 준 상황만으로 판단한 결과예요. 캡처에 없는 사정은 반영되지 않았고, 전문 상담을 대신하지 않아요.
            </p>
          </section>
        </>
      )}

      <BottomBar>
        <Button onClick={() => navigate(-1)}>대화로 돌아가기</Button>
      </BottomBar>

      {zoomed && (
        <button type="button" className="lightbox" onClick={() => setZoomed(null)} aria-label="닫기">
          <img src={zoomed} alt="캡처 크게 보기" />
        </button>
      )}
    </main>
  );
}
