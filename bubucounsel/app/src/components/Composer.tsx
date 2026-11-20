import { useEffect, useRef, useState, type FormEvent } from 'react';
import { CHAT_LIMITS } from '../../../shared/chat';
import { LIMITS } from '../../../shared/analysis';
import { MAX_PHOTOS, pickPhotos } from '../lib/toss';
import { Icon } from './ui';

const PICK_ERROR = {
  permission: '사진 접근이 꺼져 있어요. 오른쪽 위 더보기(⋯)의 권한 설정에서 켠 뒤 다시 눌러 주세요.',
  unsupported: '토스 앱을 최신 버전으로 업데이트하면 사진을 올릴 수 있어요.',
  failed: '사진을 불러오지 못했어요. 다시 한 번 눌러 주세요.',
} as const;

export interface ComposerInput {
  text: string;
  photos: string[];
}

interface Props {
  variant: 'hero' | 'bar';
  placeholder: string;
  onSubmit: (input: ComposerInput) => void;
  /** AI가 답하는 중이면 보내기를 막는다 */
  busy?: boolean;
  autoFocus?: boolean;
  /** 바깥에서 사진 고르기를 시작하게 할 때 (홈의 '캡처로 분석' 버튼) */
  pickSignal?: number;
}

/** 캡처 첨부와 글 입력을 함께 받는 입력창 */
export function Composer({ variant, placeholder, onSubmit, busy = false, autoFocus = false, pickSignal = 0 }: Props) {
  const [text, setText] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [error, setError] = useState<keyof typeof PICK_ERROR | null>(null);
  const [picking, setPicking] = useState(false);
  const field = useRef<HTMLTextAreaElement>(null);

  const withPhotos = photos.length > 0;
  const maxLength = withPhotos ? LIMITS.maxContextChars : CHAT_LIMITS.maxMessageChars;
  const canSend = !busy && (withPhotos || text.trim().length > 0);

  const pick = async () => {
    setError(null);
    setPicking(true);
    const result = await pickPhotos(MAX_PHOTOS - photos.length);
    setPicking(false);
    if (!result.ok) {
      setError(result.reason);
      return;
    }
    if (result.dataUrls.length > 0) {
      setPhotos((current) => [...current, ...result.dataUrls].slice(0, MAX_PHOTOS));
      setText((current) => current.slice(0, LIMITS.maxContextChars));
    }
  };

  useEffect(() => {
    if (pickSignal > 0) void pick();
    // pick은 매번 새로 만들어지므로 신호가 바뀔 때만 실행한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickSignal]);

  // 글이 길어지면 네 줄까지 늘어난다.
  useEffect(() => {
    const el = field.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 104)}px`;
  }, [text]);

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    if (!canSend) return;
    onSubmit({ text: text.trim(), photos });
    setText('');
    setPhotos([]);
  };

  return (
    <form className={`composer composer-${variant}`} onSubmit={submit}>
      {withPhotos && (
        <ol className="tray" aria-label="보낼 캡처">
          {photos.map((photo, index) => (
            <li key={`${index}-${photo.length}`} className="tray-item">
              <img src={photo} alt={`${index + 1}번째 캡처`} />
              <span className="tray-index" aria-hidden="true">{index + 1}</span>
              <button type="button" className="tray-remove" aria-label={`${index + 1}번째 캡처 빼기`} onClick={() => setPhotos(photos.filter((_, i) => i !== index))}>
                <Icon.close size={14} />
              </button>
            </li>
          ))}
          {photos.length < MAX_PHOTOS && (
            <li>
              <button type="button" className="tray-add" onClick={pick} aria-label="캡처 더 추가">
                <Icon.plus size={20} />
              </button>
            </li>
          )}
        </ol>
      )}
      <div className="composer-row">
        <button type="button" className="icon-btn attach" aria-label="캡처 첨부" onClick={pick} disabled={picking || photos.length >= MAX_PHOTOS}>
          {variant === 'hero' ? <Icon.photo /> : <Icon.plus />}
        </button>
        <label className="sr-only" htmlFor={`composer-${variant}`}>
          투닥이에게 보낼 말
        </label>
        <textarea
          id={`composer-${variant}`}
          ref={field}
          rows={1}
          value={text}
          maxLength={maxLength}
          autoFocus={autoFocus}
          placeholder={withPhotos ? '어떤 상황이었는지 적어도 좋아요 (선택)' : placeholder}
          onChange={(event) => setText(event.target.value)}
        />
        <button type="submit" className="icon-btn send" aria-label={withPhotos ? '캡처 보내기' : '보내기'} disabled={!canSend}>
          <Icon.send size={20} />
        </button>
      </div>
      {error && (
        <p className="composer-error" role="alert">
          {PICK_ERROR[error]}
        </p>
      )}
    </form>
  );
}
