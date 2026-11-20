import { Link, useNavigate } from 'react-router-dom';
import { inToss } from '../lib/toss';
import { Icon } from './ui';

interface Props {
  /** 이전 화면으로 가는 버튼 (탭 화면이 아닐 때) */
  back?: boolean;
  /** 오른쪽 설정 버튼 */
  settings?: boolean;
}

/**
 * 화면 맨 위의 앱 아이콘·이름 줄.
 * 토스 앱 안에서는 토스 내비게이션 바가 아이콘·이름·뒤로가기를 보여 주므로 그리지 않는다.
 * (토스 규칙: 자체 헤더·뒤로가기를 겹쳐 두지 않는다) 설정 버튼만 남긴다.
 */
export function AppBar({ back = false, settings = false }: Props) {
  const navigate = useNavigate();
  const gear = settings && (
    <Link to="/settings" className="icon-btn app-bar-action" aria-label="설정">
      <Icon.gear />
    </Link>
  );

  if (inToss) return gear ? <div className="app-bar toss">{gear}</div> : null;

  return (
    <header className="app-bar">
      <div className="app-bar-brand">
        {back && (
          <button type="button" className="icon-btn app-bar-back" aria-label="뒤로" onClick={() => navigate(-1)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
        )}
        <Link to="/" className="app-bar-home" aria-label="투닥 홈">
          <img src="./icon-192.png" alt="" width="30" height="30" />
          <span>투닥</span>
        </Link>
      </div>
      {gear}
    </header>
  );
}
