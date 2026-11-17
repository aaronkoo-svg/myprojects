import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { PartialAnalysis, Quota, Speaker } from '../../../shared/analysis';
import { AiBadge, BottomBar, Button, Card, Skeleton } from '../components/ui';
import { sendFeedback, type FeedbackReason } from '../lib/api';
import { removeHistory, updateHistory, useHistory } from '../lib/history';
import { resetJob, startAnalysis, useJob, type Job } from '../lib/job';
import { personalize, STYLE_LABEL, TONE_LABEL } from '../lib/labels';
import { SAMPLE_ANALYSIS, SAMPLE_CHAT } from '../../../shared/sample';
import { adAvailable, copyText, isAdReady, showRewardedAd } from '../lib/toss';

export function Result() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const job = useJob();
  const { items, loaded } = useHistory();
  const [sampleMeIsA, setSampleMeIsA] = useState(true);

  // 분석이 끝나면 저장된 기록 주소로 바꾼다. 뒤로가기는 홈으로 간다.
  useEffect(() => {
    if (id === 'new' && job.status === 'done') navigate(`/result/${job.historyId}`, { replace: true });
    if (id === 'new' && job.status === 'idle') navigate('/', { replace: true });
  }, [id, job, navigate]);

  if (id === 'sample') {
    return (
      <ResultView
        analysis={SAMPLE_ANALYSIS}
        meIsA={sampleMeIsA}
        onSwap={() => setSampleMeIsA((value) => !value)}
        sample
      />
    );
  }

  if (id === 'new') {
    if (job.status === 'running') return <ResultView analysis={job.partial} meIsA streaming />;
    if (job.status === 'error') return <ErrorView job={job} />;
    return null;
  }

  const item = items.find((entry) => entry.id === id);
  if (!item) {
    if (!loaded) return null;
    return (
      <main className="screen">
        <Card className="empty">
          <p className="body-strong">이 기록을 찾을 수 없어요</p>
          <p className="caption muted">이미 지웠거나 다른 기기에서 만든 기록일 수 있어요.</p>
          <Link to="/" className="btn btn-secondary">
            홈으로 가기
          </Link>
        </Card>
      </main>
    );
  }

  return (
    <ResultView
      analysis={item.analysis}
      meIsA={item.meIsA}
      onSwap={() => updateHistory(item.id, { meIsA: !item.meIsA })}
      onDelete={() => {
        removeHistory(item.id);
        navigate('/history', { replace: true });
      }}
    />
  );
}

interface ResultViewProps {
  analysis: PartialAnalysis;
  meIsA: boolean;
  streaming?: boolean;
  sample?: boolean;
  onSwap?: () => void;
  onDelete?: () => void;
}

const STAGES = ['대화를 읽고 있어요', '흐름을 정리하고 있어요', '보낼 문장을 고르고 있어요'];

function ResultView({ analysis, meIsA, streaming = false, sample = false, onSwap, onDelete }: ResultViewProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [openWhy, setOpenWhy] = useState(false);
  const say = (text: string) => personalize(text, meIsA);
  const me: Speaker = meIsA ? 'A' : 'B';

  const suggestions = (meIsA ? analysis.suggestionsForA : analysis.suggestionsForB) ?? [];
  const guide = (meIsA ? analysis.guideForA : analysis.guideForB) ?? [];
  const utterances = analysis.utterances ?? [];
  const myShare = meIsA ? analysis.shareA : analysis.shareB;
  const hasShare = typeof analysis.shareA === 'number' && typeof analysis.shareB === 'number';

  const copy = async (text: string) => {
    if (await copyText(text)) {
      setCopied(text);
      window.setTimeout(() => setCopied((current) => (current === text ? null : current)), 2000);
    }
  };

  if (!analysis.kind || !analysis.summary) return <Waiting />;
  if (analysis.kind === 'not_chat') return <NotChat message={analysis.summary} />;
  if (analysis.kind === 'safety') return <Safety message={analysis.summary} />;

  const firstSuggestion = suggestions[0]?.text;

  return (
    <main className={`screen ${streaming ? '' : 'with-bottom-bar'}`}>
      {sample && (
        <details className="card sample-chat">
          <summary>
            <span className="body-strong">예시 대화 보기</span>
            <span className="caption muted">약속을 잊어서 다툰 대화예요</span>
          </summary>
          <div className="bubbles">
            {SAMPLE_CHAT.map((line, index) => (
              <p key={index} className={`bubble ${line.speaker === me ? 'mine' : 'theirs'}`}>
                {line.text}
              </p>
            ))}
          </div>
        </details>
      )}

      <section className="verdict">
        <div className="verdict-meta">
          <AiBadge />
          <span className="caption muted">올린 대화 안에서만 본 결과예요</span>
        </div>
        <h1 className="display">{say(analysis.summary)}</h1>

        {hasShare && myShare !== undefined && (
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
        )}

        {analysis.reason ? <p className="body">{say(analysis.reason)}</p> : streaming && <Skeleton lines={3} />}
      </section>

      <section className="section">
        <h2 className="title-2">이렇게 말해 보세요</h2>
        {suggestions.length === 0 && streaming && <Card><Skeleton lines={3} /></Card>}
        <ul className="suggestions">
          {suggestions.map(
            (suggestion, index) =>
              suggestion?.text && (
                <li key={index} className="card suggestion">
                  <span className="chip">{suggestion.style ? STYLE_LABEL[suggestion.style] : ''}</span>
                  <p className="callout">{suggestion.text}</p>
                  {!streaming && (
                    <Button variant="text" onClick={() => copy(suggestion.text)}>
                      {copied === suggestion.text ? '복사했어요' : '복사하기'}
                    </Button>
                  )}
                </li>
              ),
          )}
        </ul>
      </section>

      {(utterances.length > 0 || streaming) && (
        <section className="section">
          <button type="button" className="disclosure" aria-expanded={openWhy} onClick={() => setOpenWhy((value) => !value)}>
            <h2 className="title-2">왜 그렇게 봤나요</h2>
            <span className="caption muted">{utterances.length > 0 ? `짚어 볼 말 ${utterances.length}개` : '정리하는 중'}</span>
            <span className={`chevron ${openWhy ? 'open' : ''}`} aria-hidden="true" />
          </button>
          {openWhy && (
            <ul className="utterances">
              {utterances.map(
                (utterance, index) =>
                  utterance?.quote && (
                    <li key={index} className={`utterance ${utterance.speaker === me ? 'mine' : 'theirs'}`}>
                      <span className="caption muted">{utterance.speaker === me ? '나' : '상대'}</span>
                      <p className={`bubble tone-${utterance.tone ?? 'care'}`}>{utterance.quote}</p>
                      {utterance.tone && <span className={`tone-label tone-${utterance.tone}`}>{TONE_LABEL[utterance.tone]}</span>}
                      {utterance.note && <p className="caption note">{say(utterance.note)}</p>}
                    </li>
                  ),
              )}
            </ul>
          )}
        </section>
      )}

      {(guide.length > 0 || streaming) && (
        <section className="section">
          <h2 className="title-2">다음엔 이렇게</h2>
          {guide.length === 0 ? (
            <Skeleton lines={3} />
          ) : (
            <ol className="guide">
              {guide.map((step, index) => step && <li key={index}>{say(step)}</li>)}
            </ol>
          )}
        </section>
      )}

      {streaming ? (
        <p className="caption muted center streaming-note" role="status">
          결과를 채우고 있어요
        </p>
      ) : (
        <>
          <Footer meIsA={meIsA} onSwap={onSwap} onDelete={onDelete} sample={sample} />
          {firstSuggestion && (
            <BottomBar>
              <Button onClick={() => copy(firstSuggestion)}>
                {copied === firstSuggestion ? '복사했어요' : '첫 번째 문장 복사하기'}
              </Button>
            </BottomBar>
          )}
        </>
      )}
    </main>
  );
}

function Footer({ meIsA, onSwap, onDelete, sample }: Pick<ResultViewProps, 'meIsA' | 'onSwap' | 'onDelete' | 'sample'>) {
  const [feedback, setFeedback] = useState<'closed' | 'open' | 'sent'>('closed');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const reasons: { id: FeedbackReason; label: string }[] = [
    { id: 'biased', label: '한쪽으로 치우쳤어요' },
    { id: 'misread', label: '대화를 잘못 읽었어요' },
    { id: 'awkward', label: '문장이 어색해요' },
    { id: 'other', label: '그 밖의 이유' },
  ];

  return (
    <footer className="result-footer">
      <p className="fine-print">
        올린 캡처와 적어 주신 상황만으로 판단한 결과예요. 캡처에 없는 사정은 반영되지 않았고, 전문 상담을 대신하지 않아요.
      </p>
      <ul className="footer-actions">
        {onSwap && (
          <li>
            <Button variant="text" onClick={onSwap}>
              나와 상대가 바뀌었어요
            </Button>
            <span className="caption muted">지금은 {meIsA ? '오른쪽' : '왼쪽'} 말풍선을 나로 봤어요</span>
          </li>
        )}
        {!sample && (
          <li>
            {feedback === 'closed' && (
              <Button variant="text" onClick={() => setFeedback('open')}>
                결과가 이상해요
              </Button>
            )}
            {feedback === 'open' && (
              <div className="feedback">
                <p className="caption">어떤 점이 이상했나요? 대화 내용은 보내지 않아요.</p>
                <div className="chips">
                  {reasons.map((reason) => (
                    <button
                      key={reason.id}
                      type="button"
                      className="chip-button"
                      onClick={() => {
                        void sendFeedback(reason.id, !meIsA);
                        setFeedback('sent');
                      }}
                    >
                      {reason.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {feedback === 'sent' && <p className="caption muted">알려 주셔서 고마워요. 더 나아지는 데 쓸게요.</p>}
          </li>
        )}
        {onDelete && (
          <li>
            {confirmDelete ? (
              <div className="confirm">
                <p className="caption">이 기록을 지울까요? 되돌릴 수 없어요.</p>
                <div className="confirm-actions">
                  <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
                    그대로 두기
                  </Button>
                  <Button variant="secondary" className="danger" onClick={onDelete}>
                    지우기
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="text" className="subtle" onClick={() => setConfirmDelete(true)}>
                이 기록 지우기
              </Button>
            )}
          </li>
        )}
      </ul>
    </footer>
  );
}

function Waiting() {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setStage((value) => Math.min(value + 1, STAGES.length - 1)), 3500);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <main className="screen">
      <section className="verdict waiting" role="status" aria-live="polite">
        <div className="verdict-meta">
          <AiBadge />
        </div>
        <h1 className="title-1">{STAGES[stage]}</h1>
        <p className="body muted">캡처가 많으면 조금 더 걸려요. 화면을 닫지 말고 기다려 주세요.</p>
        <Skeleton lines={3} />
        <Card>
          <Skeleton lines={3} />
        </Card>
      </section>
    </main>
  );
}

function NotChat({ message }: { message: string }) {
  const navigate = useNavigate();
  return (
    <main className="screen with-bottom-bar">
      <section className="verdict">
        <div className="verdict-meta">
          <AiBadge />
        </div>
        <h1 className="title-1">대화를 읽지 못했어요</h1>
        <p className="body">{message}</p>
        <p className="caption muted">메신저 대화 화면을 그대로 캡처한 이미지를 올려 주세요. 이번 분석은 횟수에 포함되지 않았어요.</p>
      </section>
      <BottomBar>
        <Button
          onClick={() => {
            resetJob();
            navigate('/', { replace: true });
          }}
        >
          다시 올리기
        </Button>
      </BottomBar>
    </main>
  );
}

/** 폭력·협박·자해 신호가 보이면 판정 대신 이 화면을 보여 준다. */
function Safety({ message }: { message: string }) {
  return (
    <main className="screen">
      <section className="verdict">
        <div className="verdict-meta">
          <AiBadge />
        </div>
        <h1 className="title-1">지금은 누가 잘못했는지보다 안전이 먼저예요</h1>
        <p className="body">{message}</p>
      </section>
      <Card className="safety">
        <p className="body-strong">혼자 감당하지 않아도 돼요</p>
        <ul>
          <li>
            <strong>여성긴급전화 1366</strong>
            <span className="caption muted">가정폭력·데이트폭력 상담, 24시간</span>
          </li>
          <li>
            <strong>자살예방 상담전화 109</strong>
            <span className="caption muted">힘든 마음을 털어놓을 수 있어요, 24시간</span>
          </li>
          <li>
            <strong>긴급 신고 112</strong>
            <span className="caption muted">지금 위험하다면 바로 신고해 주세요</span>
          </li>
        </ul>
      </Card>
      <div className="center">
        <Link to="/" className="btn btn-text">
          홈으로 가기
        </Link>
      </div>
    </main>
  );
}

const ERROR_COPY: Record<Extract<Job, { status: 'error' }>['code'], { title: string; body: string }> = {
  limit_free_used: { title: '오늘 무료 분석을 다 썼어요', body: '하루에 한 번 무료로 분석할 수 있어요. 올린 캡처는 그대로 남아 있어요.' },
  limit_daily_max: { title: '오늘은 여기까지예요', body: '하루에 세 번까지 분석할 수 있어요. 내일 다시 만나요.' },
  refused: { title: '이 대화는 분석하지 못했어요', body: 'AI가 이 내용을 다루기 어렵다고 판단했어요. 다른 부분을 캡처해서 올려 주세요. 횟수에는 포함되지 않았어요.' },
  ai_failed: { title: '분석을 마치지 못했어요', body: '잠시 문제가 생겼어요. 다시 시도해 주세요. 횟수에는 포함되지 않았어요.' },
  image_failed: { title: '캡처를 읽지 못했어요', body: '이미지 파일에 문제가 있어요. 다른 캡처로 다시 올려 주세요.' },
  unauthorized: { title: '토스 앱에서 열어 주세요', body: '사용자 확인에 실패했어요. 토스 앱을 최신 버전으로 업데이트한 뒤 다시 시도해 주세요.' },
  bad_request: { title: '캡처가 너무 크거나 많아요', body: '캡처 수를 줄여서 다시 올려 주세요.' },
};

function ErrorView({ job }: { job: Extract<Job, { status: 'error' }> }) {
  const navigate = useNavigate();
  const copy = ERROR_COPY[job.code];
  const [adFailed, setAdFailed] = useState(false);
  const canWatchAd = job.code === 'limit_free_used' && adAvailable() && isAdReady();
  const canRetry = job.code === 'ai_failed' || job.code === 'unauthorized';

  const watchAd = async () => {
    setAdFailed(false);
    if (await showRewardedAd()) void startAnalysis({ adWatched: true });
    else setAdFailed(true);
  };
  const goHome = () => {
    resetJob();
    navigate('/', { replace: true });
  };

  return (
    <main className="screen with-bottom-bar">
      <section className="verdict">
        <h1 className="title-1">{copy.title}</h1>
        <p className="body">{copy.body}</p>
        {job.quota && <QuotaLine quota={job.quota} />}
        {adFailed && (
          <p className="notice-error" role="alert">
            광고를 끝까지 보지 않았거나 불러오지 못했어요.
          </p>
        )}
      </section>
      <BottomBar>
        {canWatchAd && <Button onClick={watchAd}>광고 보고 한 번 더 분석하기</Button>}
        {canRetry && <Button onClick={() => void startAnalysis()}>다시 시도하기</Button>}
        <Button variant={canWatchAd || canRetry ? 'text' : 'primary'} onClick={goHome}>
          홈으로 가기
        </Button>
      </BottomBar>
    </main>
  );
}

function QuotaLine({ quota }: { quota: Quota }) {
  return (
    <p className="caption muted">
      오늘 {quota.used}번 분석했어요 · 하루 최대 {quota.max}번
    </p>
  );
}
