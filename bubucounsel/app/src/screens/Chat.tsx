import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { Analysis, PartialAnalysis, Speaker } from '../../../shared/analysis';
import type { ChatReply } from '../../../shared/chat';
import { SAMPLE_CHAT } from '../../../shared/sample';
import { Composer, type ComposerInput } from '../components/Composer';
import { Mascot } from '../components/Mascot';
import { AiBadge, Button, Icon, Skeleton } from '../components/ui';
import { sendFeedback, type FeedbackReason } from '../lib/api';
import { formatDate, personalize, STYLE_LABEL, TONE_LABEL } from '../lib/labels';
import { dismissError, sendCaptures, sendText, thumbnailsOf, useRun, type Run } from '../lib/run';
import { addMessage, latestAnalysis, newId, removeThread, SAMPLE_ID, setMeIsA, useThread, useThreads, type Message, type Thread } from '../lib/threads';
import { adAvailable, copyText, isAdReady, showRewardedAd } from '../lib/toss';

export function Chat() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const thread = useThread(id);
  const { loaded } = useThreads();
  const run = useRun();
  const scroller = useRef<HTMLDivElement>(null);
  const isSample = id === SAMPLE_ID;
  const active = run.status !== 'idle' && run.threadId === id ? run : null;
  const busy = active?.status === 'analyzing' || active?.status === 'replying';

  // 새 말이 오면 맨 아래로 내린다.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [thread?.messages.length, active]);

  if (!thread) {
    if (!loaded) return null;
    return (
      <main className="screen">
        <div className="empty">
          <Mascot size={96} variant="purple" />
          <p className="body-strong">이 대화를 찾을 수 없어요</p>
          <p className="caption muted">이미 지웠거나 다른 기기에서 나눈 대화일 수 있어요.</p>
          <Link to="/" className="btn btn-secondary">
            홈으로 가기
          </Link>
        </div>
      </main>
    );
  }

  const submit = ({ text, photos }: ComposerInput) => {
    if (photos.length > 0) sendCaptures(thread.id, photos, text);
    else sendText(thread.id, text);
  };

  const groups = groupMessages(thread.messages);
  const last = thread.messages[thread.messages.length - 1];
  const found = latestAnalysis(thread);
  const showFollowUps = !busy && !active && found?.analysis.kind === 'analysis' && last?.role === 'agent';

  return (
    <main className="chat">
      <div className="chat-scroll" ref={scroller}>
        <div className="chat-inner">
          <div className="chat-head">
            {isSample ? (
              <span className="caption muted">예시 대화예요. 저장되지 않아요.</span>
            ) : (
              <>
                <span className="caption muted">{formatDate(thread.createdAt)} 시작한 대화</span>
                <DeleteButton
                  onDelete={() => {
                    removeThread(thread.id);
                    navigate('/history', { replace: true });
                  }}
                />
              </>
            )}
          </div>

          {groups.map((group) =>
            group.role === 'user' ? (
              group.messages.map((m) => <UserMessage key={m.id} message={m} isSample={isSample} />)
            ) : (
              <AgentGroup key={group.messages[0]!.id}>
                {group.messages.map((m) => (
                  <AgentMessage key={m.id} message={m} thread={thread} isSample={isSample} />
                ))}
              </AgentGroup>
            ),
          )}

          {active && (
            <AgentGroup>
              <ActiveRun run={active} thread={thread} />
            </AgentGroup>
          )}

          {showFollowUps && found && <FollowUps thread={thread} analysisId={found.id} />}
        </div>
      </div>

      {isSample ? (
        <div className="chat-bottom">
          <Link to="/" className="btn btn-primary">
            내 대화로 시작하기
          </Link>
        </div>
      ) : (
        <div className="chat-bottom">
          <Composer variant="bar" placeholder="더 물어보거나 답장 붙여넣기" onSubmit={submit} busy={busy} />
        </div>
      )}
    </main>
  );
}

type Group = { role: 'user' | 'agent'; messages: Message[] };

/** 이어지는 투닥이의 말은 한 묶음으로 보여 준다. */
function groupMessages(messages: Message[]): Group[] {
  const groups: Group[] = [];
  for (const m of messages) {
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.role === m.role) lastGroup.messages.push(m);
    else groups.push({ role: m.role, messages: [m] });
  }
  return groups;
}

function AgentGroup({ children }: { children: ReactNode }) {
  return (
    <div className="agent">
      <Mascot size={36} plain className="agent-avatar" />
      <div className="agent-body">
        <div className="agent-name">
          <span>투닥이</span>
          <span className="ai-tag">AI</span>
        </div>
        {children}
      </div>
    </div>
  );
}

function UserMessage({ message, isSample }: { message: Message; isSample: boolean }) {
  if (message.role !== 'user') return null;
  if (message.kind === 'text') {
    return <p className="bubble-user">{message.text}</p>;
  }
  const thumbs = thumbnailsOf(message.id);
  return (
    <div className="user-captures">
      {isSample ? (
        <div className="sample-chat" aria-label="예시 대화 캡처">
          {SAMPLE_CHAT.map((line, i) => (
            <span key={i} className={`mini-bubble ${line.speaker === 'A' ? 'right' : 'left'}`}>
              {line.text}
            </span>
          ))}
        </div>
      ) : thumbs ? (
        <div className="capture-thumbs">
          {thumbs.slice(0, 4).map((src, i) => (
            <img key={i} src={src} alt={`보낸 캡처 ${i + 1}`} />
          ))}
          {thumbs.length > 4 && <span className="capture-more">+{thumbs.length - 4}</span>}
        </div>
      ) : (
        <span className="capture-chip">
          <Icon.photo size={16} /> 캡처 {message.count}장
        </span>
      )}
      {message.context && <p className="bubble-user">{message.context}</p>}
    </div>
  );
}

function AgentMessage({ message, thread, isSample }: { message: Message; thread: Thread; isSample: boolean }) {
  if (message.role !== 'agent') return null;
  const say = (text: string) => personalize(text, thread.meIsA);
  switch (message.kind) {
    case 'analysis':
      return <AnalysisView analysis={message.analysis} thread={thread} isSample={isSample} />;
    case 'reply':
      return (
        <>
          <p className="bubble-agent">{message.text}</p>
          {message.suggestion && <SuggestionBlock text={message.suggestion} />}
        </>
      );
    case 'note':
      return <p className="bubble-agent">{message.text}</p>;
    case 'why': {
      const target = thread.messages.find((m) => m.id === message.analysisId);
      if (target?.kind !== 'analysis') return null;
      const me: Speaker = thread.meIsA ? 'A' : 'B';
      return (
        <div className="card-agent">
          <p className="card-title">다툼의 흐름을 바꾼 말이에요</p>
          <ul className="utterances">
            {target.analysis.utterances.map((u, i) => (
              <li key={i} className={`utterance ${u.speaker === me ? 'mine' : 'theirs'}`}>
                <span className="caption muted">{u.speaker === me ? '나' : '상대'}</span>
                <p className={`quote tone-${u.tone}`}>{u.quote}</p>
                <span className={`tone-label tone-${u.tone}`}>{TONE_LABEL[u.tone]}</span>
                <p className="caption note">{say(u.note)}</p>
              </li>
            ))}
          </ul>
        </div>
      );
    }
    case 'guide': {
      const target = thread.messages.find((m) => m.id === message.analysisId);
      if (target?.kind !== 'analysis') return null;
      const steps = thread.meIsA ? target.analysis.guideForA : target.analysis.guideForB;
      return (
        <div className="card-agent">
          <p className="card-title">다음엔 이렇게 해 보세요</p>
          <ol className="guide">
            {steps.map((step, i) => (
              <li key={i}>{say(step)}</li>
            ))}
          </ol>
        </div>
      );
    }
  }
}

/* ── 분석 결과 ────────────────────────────────────────── */

function AnalysisView({ analysis, thread, isSample, streaming = false }: { analysis: PartialAnalysis; thread: Thread; isSample: boolean; streaming?: boolean }) {
  const say = (text: string) => personalize(text, thread.meIsA);
  if (analysis.kind === 'not_chat') {
    return (
      <p className="bubble-agent">
        {analysis.summary}
        <br />
        메신저 대화 화면을 그대로 캡처해서 다시 보내 주세요.
      </p>
    );
  }
  if (analysis.kind === 'safety') return <SafetyCard message={analysis.summary ?? ''} />;

  const myShare = thread.meIsA ? analysis.shareA : analysis.shareB;
  const suggestions = (thread.meIsA ? analysis.suggestionsForA : analysis.suggestionsForB) ?? [];
  const hasShare = typeof analysis.shareA === 'number' && typeof analysis.shareB === 'number' && myShare !== undefined;

  return (
    <>
      <div className="verdict">
        <div className="verdict-meta">
          <AiBadge />
          <span className="caption muted">보내 준 대화 안에서만 봤어요</span>
        </div>
        {analysis.summary ? <p className="verdict-title">{say(analysis.summary)}</p> : <Skeleton lines={2} />}
        {hasShare && (
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
          </div>
        )}
        {analysis.reason ? <p className="verdict-reason">{say(analysis.reason)}</p> : streaming && <Skeleton lines={2} />}
        {!streaming && !isSample && <Feedback swapped={!thread.meIsA} />}
      </div>

      {suggestions.length > 0 ? (
        <SuggestionTabs suggestions={suggestions} threadId={thread.id} streaming={streaming} isSample={isSample} />
      ) : (
        streaming && analysis.reason && (
          <div className="suggestion">
            <Skeleton lines={3} />
          </div>
        )
      )}
    </>
  );
}

function SuggestionTabs({
  suggestions,
  threadId,
  streaming,
  isSample,
}: {
  suggestions: NonNullable<Analysis['suggestionsForA']>;
  threadId: string;
  streaming: boolean;
  isSample: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const current = suggestions[Math.min(index, suggestions.length - 1)];
  useEffect(() => setCopied(false), [index]);

  const copy = async () => {
    if (current?.text && (await copyText(current.text))) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="suggestion">
      <div className="suggestion-head">
        <span className="card-title">이렇게 보내 보세요</span>
        <div className="segmented" role="tablist" aria-label="문장 스타일">
          {suggestions.map((s, i) => (
            <button key={i} type="button" role="tab" aria-selected={i === index} className={i === index ? 'on' : ''} onClick={() => setIndex(i)}>
              <span>{s?.style ? STYLE_LABEL[s.style] : '…'}</span>
            </button>
          ))}
        </div>
      </div>
      <p className="suggestion-text" role="tabpanel">
        {current?.text}
      </p>
      {!streaming && (
        <div className="suggestion-actions">
          <Button onClick={copy}>{copied ? '복사했어요' : '복사하기'}</Button>
          {isSample ? (
            <Button variant="outline" onClick={() => setIndex((i) => (i + 1) % suggestions.length)}>
              다른 문장 보기
            </Button>
          ) : (
            <Button variant="outline" onClick={() => sendText(threadId, '다른 표현으로 써 줘')}>
              다르게 써 줘
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/** 채팅 답에 붙는 보낼 문장 */
function SuggestionBlock({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="suggestion">
      <span className="card-title">이렇게 보내 보세요</span>
      <p className="suggestion-text">{text}</p>
      <div className="suggestion-actions">
        <Button
          onClick={async () => {
            if (await copyText(text)) {
              setCopied(true);
              window.setTimeout(() => setCopied(false), 2000);
            }
          }}
        >
          {copied ? '복사했어요' : '복사하기'}
        </Button>
      </div>
    </div>
  );
}

function Feedback({ swapped }: { swapped: boolean }) {
  const [state, setState] = useState<'closed' | 'open' | 'sent'>('closed');
  const reasons: { id: FeedbackReason; label: string }[] = [
    { id: 'biased', label: '한쪽으로 치우쳤어요' },
    { id: 'misread', label: '대화를 잘못 읽었어요' },
    { id: 'awkward', label: '문장이 어색해요' },
    { id: 'other', label: '그 밖의 이유' },
  ];
  if (state === 'sent') return <p className="caption muted">알려 주셔서 고마워요. 더 나아지는 데 쓸게요.</p>;
  if (state === 'closed') {
    return (
      <button type="button" className="link-quiet" onClick={() => setState('open')}>
        결과가 이상해요
      </button>
    );
  }
  return (
    <div className="feedback">
      <p className="caption">어떤 점이 이상했나요? 대화 내용은 보내지 않아요.</p>
      <div className="chips">
        {reasons.map((r) => (
          <button
            key={r.id}
            type="button"
            className="chip-button"
            onClick={() => {
              void sendFeedback(r.id, swapped);
              setState('sent');
            }}
          >
            {r.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** 폭력·협박·자해 신호가 보이면 판정 대신 보여 준다. */
function SafetyCard({ message }: { message: string }) {
  return (
    <div className="card-agent safety">
      <AiBadge />
      <p className="card-title">지금은 누가 잘못했는지보다 안전이 먼저예요</p>
      {message && <p className="caption">{message}</p>}
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
    </div>
  );
}

/* ── 진행 중·오류 ─────────────────────────────────────── */

const STAGES = ['캡처를 읽고 있어요', '흐름을 정리하고 있어요', '보낼 문장을 고르고 있어요'];

function ActiveRun({ run, thread }: { run: Exclude<Run, { status: 'idle' }>; thread: Thread }) {
  if (run.status === 'analyzing') {
    if (!run.partial.kind || !run.partial.summary) return <Typing stages={STAGES} />;
    return <AnalysisView analysis={run.partial} thread={thread} isSample={false} streaming />;
  }
  if (run.status === 'replying') {
    const partial: Partial<ChatReply> = run.partial;
    if (!partial.reply) return <Typing />;
    return (
      <p className="bubble-agent" aria-live="polite">
        {partial.reply}
        <span className="cursor" aria-hidden="true" />
      </p>
    );
  }
  return <ErrorCard run={run} />;
}

function Typing({ stages }: { stages?: string[] }) {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    if (!stages) return;
    const timer = window.setInterval(() => setStage((s) => Math.min(s + 1, stages.length - 1)), 3500);
    return () => window.clearInterval(timer);
  }, [stages]);
  return (
    <div className="typing" role="status" aria-live="polite">
      <span className="dots" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      {stages ? <span className="caption muted">{stages[stage]}</span> : <span className="sr-only">답을 쓰고 있어요</span>}
    </div>
  );
}

const ERROR_COPY: Record<string, { title: string; body: string }> = {
  limit_free_used: { title: '오늘 무료 분석을 다 썼어요', body: '하루에 한 번 무료로 분석할 수 있어요.' },
  limit_daily_max: { title: '오늘은 여기까지예요', body: '하루에 세 번까지 분석할 수 있어요. 내일 다시 만나요.' },
  refused: { title: '이 내용은 답하기 어려워요', body: 'AI가 이 내용을 다루기 어렵다고 판단했어요. 다른 부분으로 다시 보내 주세요. 횟수에는 포함되지 않았어요.' },
  ai_failed: { title: '답을 마치지 못했어요', body: '잠시 문제가 생겼어요. 다시 시도해 주세요. 횟수에는 포함되지 않았어요.' },
  image_failed: { title: '캡처를 읽지 못했어요', body: '이미지 파일에 문제가 있어요. 다른 캡처로 다시 보내 주세요.' },
  unauthorized: { title: '토스 앱에서 열어 주세요', body: '사용자 확인에 실패했어요. 토스 앱을 최신 버전으로 업데이트한 뒤 다시 시도해 주세요.' },
  bad_request: { title: '캡처가 너무 크거나 많아요', body: '캡처 수를 줄여서 다시 보내 주세요.' },
  no_key: { title: 'API 키를 먼저 넣어 주세요', body: '테스트 설정에서 Claude API 키를 넣으면 답할 수 있어요.' },
  bad_key: { title: 'API 키를 확인해 주세요', body: '키가 틀렸거나 사용할 수 없는 키예요. 테스트 설정에서 다시 넣어 주세요.' },
};
const CHAT_LIMIT_COPY = { title: '오늘은 이야기를 많이 나눴어요', body: '대화는 하루 20번까지 할 수 있어요. 내일 다시 이야기해요.' };

function ErrorCard({ run }: { run: Extract<Run, { status: 'error' }> }) {
  const navigate = useNavigate();
  const [adFailed, setAdFailed] = useState(false);
  const copy = run.from === 'chat' && run.code === 'limit_daily_max' ? CHAT_LIMIT_COPY : (ERROR_COPY[run.code] ?? ERROR_COPY.ai_failed!);
  const canWatchAd = run.code === 'limit_free_used' && adAvailable() && isAdReady();
  const canRetry = run.code === 'ai_failed' || run.code === 'unauthorized';
  const needsKey = run.code === 'no_key' || run.code === 'bad_key';

  const watchAd = async () => {
    setAdFailed(false);
    if (await showRewardedAd()) run.retry({ adWatched: true });
    else setAdFailed(true);
  };

  return (
    <div className="card-agent error" role="alert">
      <p className="card-title">{copy.title}</p>
      <p className="caption">{copy.body}</p>
      {adFailed && <p className="caption error-text">광고를 끝까지 보지 않았거나 불러오지 못했어요.</p>}
      <div className="error-actions">
        {canWatchAd && <Button onClick={watchAd}>광고 보고 한 번 더 분석하기</Button>}
        {canRetry && <Button onClick={() => run.retry()}>다시 시도하기</Button>}
        {needsKey && <Button onClick={() => navigate('/settings')}>테스트 설정 열기</Button>}
        <Button variant="outline" onClick={dismissError}>
          닫기
        </Button>
      </div>
    </div>
  );
}

/* ── 이어 묻기 ────────────────────────────────────────── */

function FollowUps({ thread, analysisId }: { thread: Thread; analysisId: string }) {
  const ask = (text: string, reply: Message) => {
    addMessage(thread.id, { id: newId(), at: Date.now(), role: 'user', kind: 'text', text, local: true });
    addMessage(thread.id, reply);
  };
  const at = () => Date.now();
  return (
    <div className="follow-ups" aria-label="이어서 물어보기">
      <button type="button" className="chip-follow" onClick={() => ask('왜 그렇게 봤어?', { id: newId(), at: at(), role: 'agent', kind: 'why', analysisId })}>
        왜 그렇게 봤어?
      </button>
      <button type="button" className="chip-follow" onClick={() => ask('다음엔 어떻게 해?', { id: newId(), at: at(), role: 'agent', kind: 'guide', analysisId })}>
        다음엔 어떻게 해?
      </button>
      <button
        type="button"
        className="chip-follow"
        onClick={() => {
          setMeIsA(thread.id, !thread.meIsA);
          ask('나와 상대가 바뀌었어', {
            id: newId(),
            at: at(),
            role: 'agent',
            kind: 'note',
            text: `알겠어요. 이제 ${thread.meIsA ? '왼쪽' : '오른쪽'} 말풍선을 나로 보고 위 결과를 바꿔 놓았어요.`,
          });
        }}
      >
        나와 상대 바꾸기
      </button>
    </div>
  );
}

function DeleteButton({ onDelete }: { onDelete: () => void }) {
  const [confirming, setConfirming] = useState(false);
  if (!confirming) {
    return (
      <button type="button" className="link-quiet" onClick={() => setConfirming(true)}>
        이 대화 지우기
      </button>
    );
  }
  return (
    <span className="confirm-inline">
      <span className="caption">지울까요?</span>
      <button type="button" className="link-quiet" onClick={() => setConfirming(false)}>
        그대로 두기
      </button>
      <button type="button" className="link-quiet danger" onClick={onDelete}>
        지우기
      </button>
    </span>
  );
}
