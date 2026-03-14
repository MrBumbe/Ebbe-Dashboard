// Child-view API — all calls authenticated via ?token= query param.

export interface TaskItem {
  id: string;
  familyId: string;
  title: string;
  emoji: string;
  routine: 'morning' | 'evening' | 'custom';
  order: number;
  starValue: number;
  isActive: boolean;
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
    const err = await res.json() as { error: { code: string; message: string } };
    throw Object.assign(new Error(err.error.message), { code: err.error.code });
  }
  const json = await res.json() as { data: T };
  return json.data;
}

export const childApi = {
  getTasks: (token: string) => get<TaskItem[]>('/tasks', token),
  completeTask: (token: string, taskId: string) =>
    post<{ starsAwarded: number; balance: number }>(`/tasks/${taskId}/complete`, token),
  getSchedule: (token: string) => get<ScheduleItem[]>('/schedule', token),
  getEvents: (token: string) => get<EventItem[]>('/events', token),
  getBalance: (token: string) => get<{ balance: number }>('/balance', token),
  logMood: (token: string, mood: string) => post<{ id: string; mood: string }>('/mood', token, { mood }),
  getWeather: (token: string) => get<WeatherData | null>('/weather', token),
};
