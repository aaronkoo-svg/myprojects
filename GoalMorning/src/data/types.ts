export type GoalLevel = 'vision' | 'long' | 'short';
export type GoalStatus = 'active' | 'done' | 'paused' | 'archived';

export type Goal = {
  id: string;
  level: GoalLevel;
  parentId: string | null; // vision은 null, long은 vision id, short는 long id (연결 안 해도 됨)
  title: string;
  why: string; // 이 목표가 중요한 이유 한 줄
  status: GoalStatus;
  createdAt: number;
};

export type Task = {
  id: string;
  date: string; // YYYY-MM-DD
  goalId: string | null;
  title: string;
  done: boolean;
  carriedFrom: string | null; // 어제에서 가져온 경우 원래 날짜
};

export type Checkin = {
  date: string;
  intention: string; // 오늘의 다짐
  createdAt: number;
};

export type AppData = {
  version: 1;
  onboarded: boolean;
  goals: Goal[];
  tasks: Task[];
  checkins: Checkin[];
};

export const emptyData: AppData = {
  version: 1,
  onboarded: false,
  goals: [],
  tasks: [],
  checkins: [],
};

export const LevelLabel: Record<GoalLevel, string> = {
  vision: '미래 비전',
  long: '장기 목표',
  short: '단기 계획',
};

export const StatusLabel: Record<GoalStatus, string> = {
  active: '진행 중',
  done: '달성',
  paused: '보류',
  archived: '보관',
};
