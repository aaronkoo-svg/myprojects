import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'text' };

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return <button type="button" className={`btn btn-${variant} ${className}`} {...props} />;
}

/** 화면 아래에 고정되는 주 버튼 영역. 한 화면에 하나만 쓴다. */
export function BottomBar({ children }: { children: ReactNode }) {
  return (
    <div className="bottom-bar">
      <div className="bottom-bar-inner">{children}</div>
    </div>
  );
}

/** 생성형 AI 결과 표시 의무: 모든 AI 결과에 붙인다. */
export function AiBadge() {
  return <span className="ai-badge">AI 분석</span>;
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card ${className}`}>{children}</div>;
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

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 11.2 12 4l8 7.2V20h-5.2v-5.4H9.2V20H4z" />
  </svg>
);
const ListIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="5" y="4" width="14" height="16" rx="3" />
    <path d="M9 9h6M9 13h6" />
  </svg>
);

/** 토스 규칙: 탭바는 플로팅 형태, 2~5개. */
export function TabBar() {
  return (
    <nav className="tabbar" aria-label="주요 메뉴">
      <NavLink to="/" end className="tab">
        <HomeIcon />
        <span>홈</span>
      </NavLink>
      <NavLink to="/history" className="tab">
        <ListIcon />
        <span>기록</span>
      </NavLink>
    </nav>
  );
}
