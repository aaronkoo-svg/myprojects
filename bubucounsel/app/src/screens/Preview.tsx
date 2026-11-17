import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LIMITS } from '../../../shared/analysis';
import { BottomBar, Button } from '../components/ui';
import { apiConfigured } from '../lib/api';
import { DIRECT_MODE, getDirectSettings } from '../lib/directSettings';
import { setDraft, startAnalysis, useDraft } from '../lib/job';
import { MAX_PHOTOS, pickPhotos } from '../lib/toss';

export function Preview() {
  const navigate = useNavigate();
  const draft = useDraft();
  const [zoomed, setZoomed] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (draft.photos.length === 0) navigate('/', { replace: true });
  }, [draft.photos.length, navigate]);

  const update = (photos: string[]) => setDraft({ ...draft, photos });
  const remove = (index: number) => update(draft.photos.filter((_, i) => i !== index));
  const move = (index: number, delta: -1 | 1) => {
    const next = [...draft.photos];
    const target = index + delta;
    const a = next[index];
    const b = next[target];
    if (a === undefined || b === undefined) return;
    next[index] = b;
    next[target] = a;
    update(next);
  };

  const addMore = async () => {
    const result = await pickPhotos(MAX_PHOTOS - draft.photos.length);
    if (result.ok) update([...draft.photos, ...result.dataUrls].slice(0, MAX_PHOTOS));
    else setMessage('사진을 더 불러오지 못했어요. 다시 눌러 주세요.');
  };

  const submit = () => {
    if (DIRECT_MODE && !getDirectSettings().apiKey) {
      navigate('/settings?resume=1');
      return;
    }
    if (!DIRECT_MODE && !apiConfigured) {
      setMessage('분석 서버가 아직 연결되지 않았어요. 지금은 예시로만 볼 수 있어요.');
      return;
    }
    void startAnalysis();
    navigate('/result/new', { replace: true });
  };

  return (
    <main className="screen with-bottom-bar">
      <header className="hero compact">
        <h1 className="title-1">대화 순서가 맞나요?</h1>
        <p className="body muted">위에서부터 시간 순서로 읽어요. 순서가 다르면 화살표로 바꿔 주세요.</p>
      </header>

      <ol className="thumbs" aria-label="올린 캡처">
        {draft.photos.map((photo, index) => (
          <li key={`${index}-${photo.length}`} className="thumb">
            <button type="button" className="thumb-image" onClick={() => setZoomed(photo)} aria-label={`${index + 1}번째 캡처 크게 보기`}>
              <img src={photo} alt="" />
              <span className="thumb-index">{index + 1}</span>
            </button>
            <div className="thumb-actions">
              <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="앞으로 옮기기">
                ←
              </button>
              <button type="button" onClick={() => remove(index)} aria-label="이 캡처 빼기">
                빼기
              </button>
              <button type="button" onClick={() => move(index, 1)} disabled={index === draft.photos.length - 1} aria-label="뒤로 옮기기">
                →
              </button>
            </div>
          </li>
        ))}
        {draft.photos.length < MAX_PHOTOS && (
          <li className="thumb">
            <button type="button" className="thumb-add" onClick={addMore}>
              <span aria-hidden="true">＋</span>
              캡처 추가
            </button>
          </li>
        )}
      </ol>

      <section className="section">
        <label className="title-2" htmlFor="context">
          어떤 상황이었나요? <span className="optional">선택</span>
        </label>
        <p className="caption muted">캡처에 없는 배경이 있으면 한 줄로 적어 주세요. 더 정확하게 볼 수 있어요.</p>
        <textarea
          id="context"
          className="textarea"
          rows={2}
          maxLength={LIMITS.maxContextChars}
          placeholder="예: 어제 저녁 약속을 깜빡한 일로 다퉜어요"
          value={draft.context}
          onChange={(event) => setDraft({ ...draft, context: event.target.value })}
        />
        <p className="caption muted right">
          {draft.context.length}/{LIMITS.maxContextChars}
        </p>
      </section>

      <p className="fine-print">
        캡처에는 상대방의 대화가 들어 있어요. 분석을 위해 AI 서비스로 전송되며, 저희 서버에는 저장하지 않아요.
      </p>

      {message && (
        <p className="notice-error" role="alert">
          {message}
        </p>
      )}

      <BottomBar>
        <Button onClick={submit}>분석하기</Button>
      </BottomBar>

      {zoomed && (
        <button type="button" className="lightbox" onClick={() => setZoomed(null)} aria-label="닫기">
          <img src={zoomed} alt="캡처 크게 보기" />
        </button>
      )}
    </main>
  );
}
