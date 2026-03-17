// Child-view API — all calls authenticated via ?token= query param.

export interface TaskItem {
  id: string;
  familyId: string;
  title: string;
  emoji: string;
  routine: 'morning' | 'evening' | 'custom';
  routineName: string | null;
  order: number;
  starValue: number;
  isActive: boolean;
  isVisibleToChild: boolean;
  daysOfWeek: string;   // JSON array
  timeStart: string | null;
  timeEnd: string | null;
  focusModeEnabled: boolean;
  createdAt: number;
  isCompletedToday: boolean;
}

export interface ScheduleItem {
  id: string;
  dayOfWeek: number; // 0=Mon … 6=Sun
  timeStart: string; // "HH:MM"
  title: string;
  emoji: string;
  color: string;
}

export interface EventItem {
  id: string;
  title: string;
  emoji: string;
  eventDate: number; // unix ms
}

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  condition: string;
  icon: string;
  locationName: string;
  updatedAt: string;
}

export interface RewardItem {
  id: string;
  title: string;
  emoji: string;
  starCost: number;
  isActive: boolean;
}

export interface TransactionItem {
  id: string;
  type: 'earn' | 'redeem';
  amount: number;
  description: string;
  relatedId: string | null;
  createdAt: number;
}

export interface LayoutEntry {
  familyId?: string;
  pageNumber: number;
  widgetId: string;
  order: number;
  isEnabled: boolean;
  config: string;
}

async function get<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`/api/v1/child${path}?token=${encodeURIComponent(token)}`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const json = await res.json() as { data: T };
  return json.data;
}

async function post<T>(path: string, token: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api/v1/child${path}?token=${encodeURIComponent(token)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json() as { error: { code: string; message: string; cooldownEndsAt?: number } };
    throw Object.assign(new Error(err.error.message), err.error);
  }
  const json = await res.json() as { data: T };
  return json.data;
}

export interface ChildSettings {
  accentColor: string;
  storeEnabled: boolean;
  historyEnabled: boolean;
  inactivitySeconds: number;
  activeMoods: string[] | null;
  language: string;
}

export const childApi = {
  getTasks: (token: string) => get<TaskItem[]>('/tasks', token),
  completeTask: (token: string, taskId: string) =>
    post<{ starsAwarded: number; balance: number }>(`/tasks/${taskId}/complete`, token),
  getSchedule: (token: string) => get<ScheduleItem[]>('/schedule', token),
  getEvents: (token: string) => get<EventItem[]>('/events', token),
  getBalance: (token: string) => get<{ balance: number }>('/balance', token),
  getTransactions: (token: string) => get<TransactionItem[]>('/transactions', token),
  getRewards: (token: string) => get<RewardItem[]>('/rewards', token),
  requestReward: (token: string, rewardId: string) =>
    post<{ requestId: string }>(`/rewards/${rewardId}/request`, token),
  getMoodStatus: (token: string) =>
    get<{ canLog: boolean; cooldownEndsAt: number | null }>('/mood/status', token),
  logMood: (token: string, mood: string) => post<{ id: string; mood: string }>('/mood', token, { mood }),
  getWeather: (token: string) => get<WeatherData | null>('/weather', token),
  getTheme: (token: string) => get<{ accentColor: string }>('/theme', token),
  getLayout: (token: string) => get<LayoutEntry[]>('/layout', token),
  getSettings: (token: string) => get<ChildSettings>('/settings', token),
};
