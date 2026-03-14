import { create } from 'zustand';
import type { TaskItem, ScheduleItem, EventItem, WeatherData } from '../api/child';

interface ActiveTimer {
  label: string;
  totalSeconds: number;
  remaining: number;
}

interface ChildState {
  token: string | null;
  tasks: TaskItem[];
  balance: number;
  schedule: ScheduleItem[];
  events: EventItem[];
  weather: WeatherData | null;
  moodLoggedToday: boolean;
  timer: ActiveTimer | null;

  setToken: (token: string) => void;
  setTasks: (tasks: TaskItem[]) => void;
  markTaskComplete: (taskId: string, newBalance: number) => void;
  setBalance: (n: number) => void;
  setSchedule: (items: ScheduleItem[]) => void;
  setEvents: (items: EventItem[]) => void;
  setWeather: (data: WeatherData | null) => void;
  setMoodLoggedToday: (val: boolean) => void;
  startTimer: (seconds: number, label: string) => void;
  cancelTimer: () => void;
  tickTimer: () => void;
}

export const useChildStore = create<ChildState>((set) => ({
  token: null,
  tasks: [],
  balance: 0,
  schedule: [],
  events: [],
  weather: null,
  moodLoggedToday: false,
  timer: null,

  setToken: (token) => set({ token }),

  setTasks: (tasks) => set({ tasks }),

  markTaskComplete: (taskId, newBalance) =>
    set((s) => ({
      tasks: s.tasks.map((t) => t.id === taskId ? { ...t, isCompletedToday: true } : t),
      balance: newBalance,
    })),

  setBalance: (balance) => set({ balance }),

  setSchedule: (schedule) => set({ schedule }),

  setEvents: (events) => set({ events }),

  setWeather: (weather) => set({ weather }),

  setMoodLoggedToday: (moodLoggedToday) => set({ moodLoggedToday }),

  startTimer: (seconds, label) =>
    set({ timer: { label, totalSeconds: seconds, remaining: seconds } }),

  cancelTimer: () => set({ timer: null }),

  tickTimer: () =>
    set((s) => {
      if (!s.timer) return s;
      const remaining = s.timer.remaining - 1;
      return { timer: remaining <= 0 ? null : { ...s.timer, remaining } };
    }),
}));
