import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppBar } from '../components/AppBar';
import { Composer, type ComposerInput } from '../components/Composer';
import { Mascot } from '../components/Mascot';
import { Icon, TabBar } from '../components/ui';
import { formatDate, personalize, TOPIC_LABEL } from '../lib/labels';
import { sendCaptures, sendText } from '../lib/run';
import { createThread, latestAnalysis, newId, resetSample, SAMPLE_ID, threadTitle, useThreads, type Thread } from '../lib/threads';

const DAY_NAMES = ['월', '화', '수', '목', '금', '토', '일'];

/** 이번 주 월요일부터 일요일까지 */
function thisWeek(now = new Date()) {
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return DAY_NAMES.map((name, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return { name, date, isToday: date.toDateString() === now.toDateString(), isFuture: date > now };
  });
}

export const REFINE_INTRO = '보내려는 답장을 붙여 넣어 주세요. 상대에게 어떻게 들릴지 보고, 더 나은 문장을 같이 찾아볼게요.';

/** 답장 다듬기: 투닥이의 안내로 시작하는 새 대화 */
export function startRefine(navigate: (to: string) => void) {
  const thread = createThread({ id: newId(), at: Date.now(), role: 'agent', kind: 'note', text: REFINE_INTRO });
  navigate(`/chat/${thread.id}`);
}

export function Home() {
  const navigate = useNavigate();
  const { threads } = useThreads();
  const [pickSignal, setPickSignal] = useState(0);
  const week = thisWeek();
  const weekStart = week[0]!.date.getTime();
  const thisWeekThreads = threads.filter((t) => t.createdAt >= weekStart);
  const talkedOn = new Set(thisWeekThreads.map((t) => new Date(t.createdAt).toDateString()));
  const recent = threads[0];

  const start = ({ text, photos }: ComposerInput) => {
    const thread = createThread();
    navigate(`/chat/${thread.id}`);
    if (photos.length > 0) sendCaptures(thread.id, photos, text);
    else sendText(thread.id, text);
  };

  return (
    <main className="screen with-tabbar home">
      <AppBar settings />
      <section className="hero-card">
        <Mascot size={176} label="말풍선 모양의 캐릭터 투닥이" className="hero-mascot" />
        <h1 className="title-1 center">오늘은 어떤 대화였어요?</h1>
        <p className="body muted center">
          다툰 대화를 캡처해 보내거나,
          <br />
          그냥 털어놔도 괜찮아요
        </p>
        <Composer variant="hero" placeholder="투닥이에게 말 걸기" onSubmit={start} pickSignal={pickSignal} />
        <p className="fine-print center">
          투닥이는 생성형 AI예요. 전문 상담을 대신하지 않아요.
          <br />
          캡처는 분석에만 쓰고 저장하지 않아요.
        </p>
      </section>

      <div className="quick-actions">
        <button type="button" className="chip-action" onClick={() => setPickSignal((n) => n + 1)}>
          <span className="tint-blue"><Icon.photo size={18} /></span>캡처로 분석
        </button>
        <button type="button" className="chip-action" onClick={() => startRefine(navigate)}>
          <span className="tint-orange"><Icon.pencil size={18} /></span>답장 다듬기
        </button>
        <Link to={`/chat/${SAMPLE_ID}`} className="chip-action" onClick={resetSample}>
          <span className="tint-green"><Icon.sample size={18} /></span>예시 보기
        </Link>
      </div>

      <section className="section">
        <div className="section-head">
          <h2 className="title-2">이번 주</h2>
          <span className="caption muted">{thisWeekThreads.length > 0 ? `대화 ${thisWeekThreads.length}번` : '아직 대화가 없어요'}</span>
        </div>
        <ol className="week" aria-label="이번 주 대화한 날">
          {week.map((day) => {
            const talked = talkedOn.has(day.date.toDateString());
            return (
              <li key={day.name} className={`day ${day.isToday ? 'today' : ''} ${day.isFuture ? 'future' : ''}`} aria-label={`${day.name}요일 ${day.date.getDate()}일${talked ? ', 대화함' : ''}`}>
                <span className="day-name">{day.name}</span>
                <span className="day-date">{day.date.getDate()}</span>
                <span className={`day-dot ${talked ? 'on' : ''}`} />
              </li>
            );
          })}
        </ol>
      </section>

      {recent && <RecentCard thread={recent} />}

      <TabBar />
    </main>
  );
}

function RecentCard({ thread }: { thread: Thread }) {
  const found = latestAnalysis(thread);
  const topic = found?.analysis.kind === 'analysis' ? TOPIC_LABEL[found.analysis.topic] : null;
  return (
    <Link to={`/chat/${thread.id}`} className="recent">
      <span className="recent-icon" aria-hidden="true">
        <Icon.clock />
      </span>
      <span className="recent-text">
        <span className="recent-title">{personalize(threadTitle(thread), thread.meIsA)}</span>
        <span className="caption muted">
          {formatDate(thread.updatedAt)}
          {topic ? ` · ${topic}` : ''} · 이어서 대화하기
        </span>
      </span>
      <Icon.chevron size={18} />
    </Link>
  );
}
