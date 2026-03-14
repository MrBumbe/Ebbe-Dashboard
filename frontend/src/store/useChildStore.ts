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
  moodCooldownEndsAt: number | null;
  timer: ActiveTimer | null;
  timerMinimized: boolean;
  accentColor: string;

  setToken: (token: string) => void;
  setTasks: (tasks: TaskItem[]) => void;
  markTaskComplete: (taskId: string, newBalance: number) => void;
  setBalance: (n: number) => void;
  setSchedule: (items: ScheduleItem[]) => void;
  setEvents: (items: EventItem[]) => void;
  setWeather: (data: WeatherData | null) => void;
  setMoodCooldown: (endsAt: number | null) => void;
  setAccentColor: (color: string) => void;
  startTimer: (seconds: number, label: string) => void;
  cancelTimer: () => void;
  tickTimer: () => void;
  toggleTimerMinimized: () => void;
}

export const useChildStore = create<ChildState>((set) => ({
  token: null,
  tasks: [],
  balance: 0,
  schedule: [],
  events: [],
  weather: null,
  moodCooldownEndsAt: null,
  timer: null,
  timerMinimized: false,
  accentColor: '#1565C0',

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

  setMoodCooldown: (moodCooldownEndsAt) => set({ moodCooldownEndsAt }),

  setAccentColor: (accentColor) => set({ accentColor }),

  startTimer: (seconds, label) =>
    set({ timer: { label, totalSeconds: seconds, remaining: seconds }, timerMinimized: false }),

  cancelTimer: () => set({ timer: null, timerMinimized: false }),

  tickTimer: () =>
    set((s) => {
      if (!s.timer) return s;
      const remaining = s.timer.remaining - 1;
      if (remaining <= 0) return { timer: null, timerMinimized: false };
      // Force fullscreen when ≤ 60 seconds left
      const timerMinimized = s.timerMinimized && remaining > 60;
      return { timer: { ...s.timer, remaining }, timerMinimized };
    }),

  toggleTimerMinimized: () => set((s) => ({ timerMinimized: !s.timerMinimized })),
}));
