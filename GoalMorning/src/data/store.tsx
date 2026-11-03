import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { emptyData, type AppData, type Goal, type GoalLevel, type Task } from '@/data/types';
import { dateKey } from '@/lib/date';

const STORAGE_KEY = 'goalmorning:data:v1';

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

type GoalInput = { level: GoalLevel; title: string; why?: string; parentId?: string | null };

type Store = {
  ready: boolean;
  data: AppData;
  addGoal: (g: GoalInput) => Goal;
  updateGoal: (id: string, patch: Partial<Omit<Goal, 'id' | 'createdAt'>>) => void;
  deleteGoal: (id: string) => void;
  addTask: (title: string, goalId?: string | null, date?: string) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  carryTask: (id: string) => void;
  checkIn: (p: { picks: { title: string; goalId: string | null }[]; intention: string }) => void;
  finishOnboarding: () => void;
  resetAll: () => void;
};

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(emptyData);
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  // 앱 시작 시 폰에 저장된 데이터 불러오기
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setData({ ...emptyData, ...JSON.parse(raw) });
      })
      .catch(() => {})
      .finally(() => {
        loaded.current = true;
        setReady(true);
      });
  }, []);

  // 바뀔 때마다 저장
  useEffect(() => {
    if (!loaded.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {});
  }, [data]);

  const addGoal = useCallback((g: GoalInput) => {
    const goal: Goal = {
      id: newId(),
      level: g.level,
      parentId: g.parentId ?? null,
      title: g.title.trim(),
      why: (g.why ?? '').trim(),
      status: 'active',
      createdAt: Date.now(),
    };
    setData((d) => ({ ...d, goals: [...d.goals, goal] }));
    return goal;
  }, []);

  const updateGoal: Store['updateGoal'] = useCallback((id, patch) => {
    setData((d) => ({ ...d, goals: d.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) }));
  }, []);

  // 지우면 아래 단계는 연결만 풀리고 남는다 (기록 보존)
  const deleteGoal = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      goals: d.goals
        .filter((g) => g.id !== id)
        .map((g) => (g.parentId === id ? { ...g, parentId: null } : g)),
      tasks: d.tasks.map((t) => (t.goalId === id ? { ...t, goalId: null } : t)),
    }));
  }, []);

  const addTask: Store['addTask'] = useCallback((title, goalId = null, date = dateKey()) => {
    const task: Task = { id: newId(), date, goalId, title: title.trim(), done: false, carriedFrom: null };
    setData((d) => ({ ...d, tasks: [...d.tasks, task] }));
  }, []);

  const toggleTask = useCallback((id: string) => {
    setData((d) => ({ ...d, tasks: d.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) }));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setData((d) => ({ ...d, tasks: d.tasks.filter((t) => t.id !== id) }));
  }, []);

  // 지난 날의 못 끝낸 일을 오늘로 옮기기
  const carryTask = useCallback((id: string) => {
    const today = dateKey();
    setData((d) => ({
      ...d,
      tasks: d.tasks.map((t) =>
        t.id === id ? { ...t, date: today, carriedFrom: t.carriedFrom ?? t.date } : t,
      ),
    }));
  }, []);

  const checkIn: Store['checkIn'] = useCallback(({ picks, intention }) => {
    const today = dateKey();
    setData((d) => {
      const existing = new Set(d.tasks.filter((t) => t.date === today).map((t) => t.title));
      const newTasks: Task[] = picks
        .filter((p) => p.title.trim() && !existing.has(p.title.trim()))
        .map((p) => ({
          id: newId(),
          date: today,
          goalId: p.goalId,
          title: p.title.trim(),
          done: false,
          carriedFrom: null,
        }));
      return {
        ...d,
        tasks: [...d.tasks, ...newTasks],
        checkins: [
          ...d.checkins.filter((c) => c.date !== today),
          { date: today, intention: intention.trim(), createdAt: Date.now() },
        ],
      };
    });
  }, []);

  const finishOnboarding = useCallback(() => setData((d) => ({ ...d, onboarded: true })), []);
  const resetAll = useCallback(() => setData(emptyData), []);

  const value = useMemo<Store>(
    () => ({
      ready,
      data,
      addGoal,
      updateGoal,
      deleteGoal,
      addTask,
      toggleTask,
      deleteTask,
      carryTask,
      checkIn,
      finishOnboarding,
      resetAll,
    }),
    [ready, data, addGoal, updateGoal, deleteGoal, addTask, toggleTask, deleteTask, carryTask, checkIn, finishOnboarding, resetAll],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const s = useContext(StoreContext);
  if (!s) throw new Error('useStore must be used inside StoreProvider');
  return s;
}

// ---- 화면에서 자주 쓰는 계산 ----

export const activeGoals = (goals: Goal[], level: GoalLevel) =>
  goals.filter((g) => g.level === level && g.status !== 'archived');

export const childrenOf = (goals: Goal[], id: string) =>
  goals.filter((g) => g.parentId === id && g.status !== 'archived');

// 장기 목표 진행률 = 연결된 단기 계획 중 달성 비율
export function progressOf(goals: Goal[], longId: string) {
  const kids = childrenOf(goals, longId);
  if (kids.length === 0) return null;
  return kids.filter((k) => k.status === 'done').length / kids.length;
}

// 어떤 목표가 이어지는 꿈(비전)까지의 경로
export function ancestry(goals: Goal[], id: string | null): Goal[] {
  const chain: Goal[] = [];
  let cur = goals.find((g) => g.id === id);
  while (cur && chain.length < 3) {
    chain.unshift(cur);
    cur = goals.find((g) => g.id === cur!.parentId);
  }
  return chain;
}
