import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useChildStore } from '../../store/useChildStore';
import { childApi } from '../../api/child';
import { connectChildWs } from '../../api/websocket';
import Clock from './Clock';
import TaskList from './TaskList';
import RewardDisplay from './RewardDisplay';
import MoodCheckIn from './MoodCheckIn';
import WeekSchedule from './WeekSchedule';
import UpcomingEvent from './UpcomingEvent';
import TimerAlert from './TimerAlert';

const REFRESH_MS = 60_000;

function getRoutine(): 'morning' | 'evening' {
  const h = new Date().getHours();
  return h >= 5 && h < 15 ? 'morning' : 'evening';
}

export default function ChildApp() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const store = useChildStore();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Load all data ─────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    store.setToken(token);

    async function loadAll() {
      const [t, sc, ev, bal, wx] = await Promise.allSettled([
        childApi.getTasks(token),
        childApi.getSchedule(token),
        childApi.getEvents(token),
        childApi.getBalance(token),
        childApi.getWeather(token),
      ]);
      if (t.status === 'fulfilled') store.setTasks(t.value);
      if (sc.status === 'fulfilled') store.setSchedule(sc.value);
      if (ev.status === 'fulfilled') store.setEvents(ev.value);
      if (bal.status === 'fulfilled') store.setBalance(bal.value.balance);
      if (wx.status === 'fulfilled') store.setWeather(wx.value);
    }

    void loadAll();
    const id = setInterval(() => void loadAll(), REFRESH_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ── WebSocket ─────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    return connectChildWs(token, (msg) => {
      if (msg.type === 'TIMER_START') store.startTimer(msg.payload.seconds, msg.payload.label);
      else if (msg.type === 'TIMER_CANCEL') store.cancelTimer();
      else if (msg.type === 'STARS_UPDATED') store.setBalance(msg.payload.balance);
      else if (msg.type === 'TASK_UPDATED') void childApi.getTasks(token).then(store.setTasks);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ── Timer tick ────────────────────────────────────────────────
  useEffect(() => {
    if (store.timer) {
      timerRef.current = setInterval(store.tickTimer, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [store.timer, store.tickTimer]);

  async function handleComplete(taskId: string) {
    try {
      const result = await childApi.completeTask(token, taskId);
      store.markTaskComplete(taskId, result.balance);
    } catch (err: unknown) {
      if ((err as { code?: string }).code !== 'ALREADY_COMPLETED') console.error(err);
    }
  }

  async function handleMood(mood: string) {
    try {
      await childApi.logMood(token, mood);
      store.setMoodLoggedToday(true);
    } catch (err: unknown) {
      if ((err as { code?: string }).code === 'ALREADY_LOGGED') store.setMoodLoggedToday(true);
    }
  }

  if (!token) {
    return (
      <div className="kiosk min-h-screen bg-blue-800 flex items-center justify-center text-white text-2xl">
        Missing token — add ?token=... to the URL.
      </div>
    );
  }

  const { tasks, balance, schedule, events, weather, moodLoggedToday, timer } = store;
  const routine = getRoutine();

  const weatherEmoji: Record<string, string> = {
    sunny: '☀️', cloudy: '☁️', rain: '🌧️', snow: '❄️', storm: '⛈️', fog: '🌫️',
  };

  return (
    <div className="kiosk min-h-screen bg-gradient-to-br from-blue-600 to-blue-900 text-white">

      {timer && (
        <TimerAlert remaining={timer.remaining} totalSeconds={timer.totalSeconds} label={timer.label} />
      )}

      {/* ── Main grid ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 p-4 md:grid md:grid-cols-3 md:gap-6 md:p-6 xl:gap-8 xl:p-10">

        {/* LEFT: Clock + Stars + Weather */}
        <div className="flex flex-col gap-4 xl:gap-6">
          <div className="bg-white/10 rounded-2xl p-4 xl:p-8 flex flex-col items-center gap-4">
            <Clock />
          </div>
          <RewardDisplay balance={balance} />
          {weather && (
            <div className="bg-white/10 rounded-2xl px-6 py-4 xl:py-6 flex items-center gap-4">
              <span className="text-4xl xl:text-5xl">{weatherEmoji[weather.condition] ?? '🌤️'}</span>
              <div>
                <p className="text-3xl xl:text-5xl font-bold">{weather.temperature}°</p>
                <p className="text-sm xl:text-lg opacity-75">{weather.locationName}</p>
              </div>
            </div>
          )}
        </div>

        {/* CENTER: Tasks (spans 2 cols on tablet, 1 on large) */}
        <div className="md:col-span-2 xl:col-span-1">
          <TaskList tasks={tasks} routine={routine} onComplete={handleComplete} />
        </div>

        {/* RIGHT: Mood + Events + Schedule — large screen only */}
        <div className="hidden xl:flex xl:flex-col xl:gap-6">
          <MoodCheckIn alreadyLogged={moodLoggedToday} onMood={handleMood} />
          {events.length > 0 && <UpcomingEvent events={events} />}
          <WeekSchedule items={schedule} />
        </div>
      </div>

      {/* Phone/tablet: Mood + Events + Schedule stacked below */}
      <div className="xl:hidden flex flex-col gap-4 px-4 pb-8 md:px-6 md:grid md:grid-cols-3">
        <div className="md:col-span-1">
          <MoodCheckIn alreadyLogged={moodLoggedToday} onMood={handleMood} />
        </div>
        {events.length > 0 && (
          <div className="md:col-span-2">
            <UpcomingEvent events={events} />
          </div>
        )}
        <div className="md:col-span-3">
          <WeekSchedule items={schedule} />
        </div>
      </div>
    </div>
  );
}
