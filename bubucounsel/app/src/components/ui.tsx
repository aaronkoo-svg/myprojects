import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'text' | 'outline' };

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return <button type="button" className={`btn btn-${variant} ${className}`} {...props} />;
}

/** 생성형 AI 결과 표시 의무: 모든 AI 결과에 붙인다. */
export function AiBadge({ label = 'AI 분석' }: { label?: string }) {
  return <span className="ai-badge">{label}</span>;
}

export function Skeleton({ lines = 2 }: { lines?: number }) {
  return (
    <div className="skeleton" aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <span key={i} style={{ width: i === lines - 1 ? '62%' : '100%' }} />
      ))}
    </div>
  );
}

/* ── 아이콘 (선으로 그린 SVG) ─────────────────────────── */

type IconProps = { size?: number };
const stroke = (size = 22, children: ReactNode, width = 2) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

export const Icon = {
  bubble: ({ size = 22, filled = false }: IconProps & { filled?: boolean }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={filled ? 0 : 2} strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3c5 0 9 3.4 9 7.6S17 18 12 18l-1 0-4.6 3.2.9-4C5 16 3 13.6 3 10.6 3 6.4 7 3 12 3z" />
    </svg>
  ),
  photo: ({ size }: IconProps) => stroke(size, <><rect x="3.5" y="4.5" width="17" height="15" rx="3.5" /><circle cx="9" cy="10" r="1.8" /><path d="M20 15.5l-4.5-4.5L7 19.5" /></>),
  pencil: ({ size }: IconProps) => stroke(size, <path d="M4 20h4l10.5-10.5a2.8 2.8 0 0 0-4-4L4 16z" />),
  play: ({ size, filled = false }: IconProps & { filled?: boolean }) =>
    filled ? (
      <svg width={size ?? 22} height={size ?? 22} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 4.5l14 7.5-14 7.5z" /></svg>
    ) : (
      stroke(size, <path d="M6 4.5l14 7.5-14 7.5z" />)
    ),
  list: ({ size }: IconProps) => stroke(size, <><rect x="5" y="3.5" width="14" height="17" rx="3" /><path d="M9 9h6M9 13h6" /></>),
  plus: ({ size }: IconProps) => stroke(size, <path d="M12 5v14M5 12h14" />, 2.2),
  send: ({ size }: IconProps) => stroke(size, <path d="M12 19V5M6 11l6-6 6 6" />, 2.4),
  close: ({ size }: IconProps) => stroke(size, <path d="M6 6l12 12M18 6L6 18" />, 2.2),
  chevron: ({ size }: IconProps) => stroke(size, <path d="M9 6l6 6-6 6" />),
  sample: ({ size }: IconProps) => stroke(size, <><circle cx="12" cy="12" r="8.5" /><path d="M10 9l5 3-5 3z" /></>),
  clock: ({ size }: IconProps) => stroke(size, <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>),
  copy: ({ size }: IconProps) => stroke(size, <><rect x="8" y="8" width="12" height="12" rx="3" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></>),
};

/** 토스 규칙: 탭바는 플로팅 형태, 2~5개. */
export function TabBar() {
  return (
    <nav className="tabbar" aria-label="주요 메뉴">
      <NavLink to="/" end className="tab">
        {({ isActive }) => (
          <>
            <Icon.bubble filled={isActive} />
            <span>대화</span>
          </>
        )}
      </NavLink>
      <NavLink to="/history" className="tab">
        <Icon.list />
        <span>기록</span>
      </NavLink>
      <NavLink to="/practice" className="tab">
        {({ isActive }) => (
          <>
            <Icon.play filled={isActive} />
            <span>연습</span>
          </>
        )}
      </NavLink>
    </nav>
  );
}

/** 화면 아래에 고정되는 주 버튼 영역 */
export function BottomBar({ children }: { children: ReactNode }) {
  return (
    <div className="bottom-bar">
      <div className="bottom-bar-inner">{children}</div>
    </div>
  );
}
