import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useChildStore } from '../../store/useChildStore';
import { childApi } from '../../api/child';
import type { LayoutEntry } from '../../api/child';
import { connectChildWs } from '../../api/websocket';
import i18n from '../../i18n';
import ChildHeader from './ChildHeader';
import TaskList from './TaskList';
import MoodCheckIn from './MoodCheckIn';
import WeekSchedule from './WeekSchedule';
import UpcomingEvent from './UpcomingEvent';
import TimerAlert from './TimerAlert';
import StarStore from './StarStore';
import StarHistory from './StarHistory';

const REFRESH_MS = 60_000;

// Default inactivity timeout for page-reset (seconds)
const DEFAULT_INACTIVITY_S = 45;

// Header widgets are always shown in ChildHeader, not in the grid
const HEADER_WIDGETS = new Set(['clock', 'star-balance', 'weather']);

// ── Child overlay state ───────────────────────────────────────
type ChildOverlay = 'store' | 'history' | 'store-or-history' | null;

export default function ChildApp() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const store = useChildStore();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Layout state
  const [layout, setLayout] = useState<LayoutEntry[]>([]);
  const [storeEnabled, setStoreEnabled] = useState(false);
  const [historyEnabled, setHistoryEnabled] = useState(false);
  const [inactivitySecs, setInactivitySecs] = useState(DEFAULT_INACTIVITY_S);
  const [activeMoods, setActiveMoods] = useState<string[] | undefined>(undefined);

  // Multi-page
  const [currentPage, setCurrentPage] = useState(1);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartX = useRef<number | null>(null);

  // Overlay
  const [overlay, setOverlay] = useState<ChildOverlay>(null);

  // ── Load all data ─────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    if (!token) return;
    const [t, sc, ev, bal, wx, ms, ly, tx, rw] = await Promise.allSettled([
      childApi.getTasks(token),
      childApi.getSchedule(token),
      childApi.getEvents(token),
      childApi.getBalance(token),
      childApi.getWeather(token),
      childApi.getMoodStatus(token),
      childApi.getLayout(token),
      childApi.getTransactions(token),
      childApi.getRewards(token),
    ]);
    if (t.status === 'fulfilled') store.setTasks(t.value);
    if (sc.status === 'fulfilled') store.setSchedule(sc.value);
    if (ev.status === 'fulfilled') store.setEvents(ev.value);
    if (bal.status === 'fulfilled') store.setBalance(bal.value.balance);
    if (wx.status === 'fulfilled') store.setWeather(wx.value);
    if (ms.status === 'fulfilled') store.setMoodCooldown(ms.value.cooldownEndsAt);
    if (ly.status === 'fulfilled') setLayout(ly.value);
    if (tx.status === 'fulfilled') store.setTransactions(tx.value);
    if (rw.status === 'fulfilled') store.setRewards(rw.value);
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!token) return;
    store.setToken(token);
    void loadAll();
    const id = setInterval(() => void loadAll(), REFRESH_MS);
    return () => clearInterval(id);
  }, [token, loadAll]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch child settings (store/history toggles, inactivity, moods) ─
  useEffect(() => {
    if (!token) return;
    childApi.getSettings(token).then((s) => {
      store.setAccentColor(s.accentColor);
      setStoreEnabled(s.storeEnabled);
      setHistoryEnabled(s.historyEnabled);
      setInactivitySecs(s.inactivitySeconds);
      setActiveMoods(s.activeMoods ?? undefined);
      void i18n.changeLanguage(s.language);
    }).catch(() => { /* use defaults */ });
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── WebSocket ─────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    return connectChildWs(token, (msg) => {
      if (msg.type === 'TIMER_START') store.startTimer(msg.payload.seconds, msg.payload.label);
      else if (msg.type === 'TIMER_CANCEL') store.cancelTimer();
      else if (msg.type === 'STARS_UPDATED') store.setBalance(msg.payload.balance);
      else if (msg.type === 'TASK_UPDATED') void childApi.getTasks(token).then(store.setTasks);
      else if (msg.type === 'LAYOUT_UPDATED') void childApi.getLayout(token).then(setLayout);
      else if (msg.type === 'LANGUAGE_UPDATED') void i18n.changeLanguage(msg.payload.language);
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

  // ── Inactivity reset to page 1 ────────────────────────────────
  const resetInactivity = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = setTimeout(() => {
      setCurrentPage(1);
    }, inactivitySecs * 1000);
  }, [inactivitySecs]);

  useEffect(() => {
    resetInactivity();
    return () => { if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current); };
  }, [resetInactivity]);

  // ── Swipe to change page ──────────────────────────────────────
  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    resetInactivity();
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 60) return; // too short
    const pages = availablePages;
    const maxPage = pages[pages.length - 1] ?? 1;
    if (dx < 0 && currentPage < maxPage) setCurrentPage(p => p + 1);
    if (dx > 0 && currentPage > 1) setCurrentPage(p => p - 1);
    resetInactivity();
  }

  // ── Task & mood handlers ──────────────────────────────────────
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
      store.setMoodCooldown(Date.now() + 60 * 60 * 1000);
    } catch (err: unknown) {
      const e = err as { code?: string; cooldownEndsAt?: number };
      if (e.code === 'ALREADY_LOGGED') {
        store.setMoodCooldown(e.cooldownEndsAt ?? Date.now() + 60 * 60 * 1000);
      }
    }
  }

  async function handleRequestReward(rewardId: string) {
    await childApi.requestReward(token, rewardId);
  }

  function handleStarTap() {
    if (storeEnabled && historyEnabled) setOverlay('store-or-history');
    else if (storeEnabled) setOverlay('store');
    else if (historyEnabled) setOverlay('history');
    resetInactivity();
  }

  // ── Layout processing ─────────────────────────────────────────
  const { tasks, balance, schedule, events, weather, moodCooldownEndsAt, timer, timerMinimized, accentColor, rewards: rewardList, transactions } = store;
  const accent = accentColor ?? '#1565C0';

  const bgStyle = {
    background: `linear-gradient(135deg, ${accent}ee 0%, ${accent}99 100%)`,
  };

  // Group layout by page
  const pageMap = new Map<number, LayoutEntry[]>();
  for (const entry of layout) {
    if (!pageMap.has(entry.pageNumber)) pageMap.set(entry.pageNumber, []);
    pageMap.get(entry.pageNumber)!.push(entry);
  }

  // Sort each page's entries by order
  for (const [, entries] of pageMap) {
    entries.sort((a, b) => a.order - b.order);
  }

  const availablePages = [...pageMap.keys()].filter(p => {
    const entries = pageMap.get(p) ?? [];
    return entries.some(e => e.isEnabled);
  }).sort((a, b) => a - b);

  // Ensure page 1 always exists
  if (!availablePages.includes(1)) availablePages.unshift(1);

  const currentEntries = (pageMap.get(currentPage) ?? []).filter(e => e.isEnabled);

  // Count non-header enabled widgets on current page to determine header level
  const nonHeaderCount = currentEntries.filter(e => !HEADER_WIDGETS.has(e.widgetId)).length;
  const level: 1 | 2 | 3 = nonHeaderCount <= 2 ? 1 : nonHeaderCount <= 5 ? 2 : 3;
  const compact = level === 3;

  function renderWidget(entry: LayoutEntry) {
    const { widgetId } = entry;
    const key = `${entry.pageNumber}-${widgetId}`;

    switch (widgetId) {
      case 'clock':
      case 'star-balance':
      case 'weather':
      case 'timer-display':
        return null;

      case 'routine-morning':
        return (
          <div key={key}>
            <TaskList tasks={tasks} routine="morning" onComplete={handleComplete} compact={compact} />
          </div>
        );

      case 'routine-evening':
        return (
          <div key={key}>
            <TaskList tasks={tasks} routine="evening" onComplete={handleComplete} compact={compact} />
          </div>
        );

      case 'routine-custom': {
        const customTasks = tasks.filter(t => t.routine === 'custom');
        if (customTasks.length === 0) return null;
        return (
          <div key={key}>
            <TaskList tasks={tasks} routine="custom" onComplete={handleComplete} compact={compact} />
          </div>
        );
      }

      case 'mood-checkin':
        return (
          <div key={key}>
            <MoodCheckIn cooldownEndsAt={moodCooldownEndsAt} onMood={handleMood} activeMoods={activeMoods} />
          </div>
        );

      case 'week-schedule':
        return (
          <div key={key}>
            <WeekSchedule items={schedule} compact={compact} />
          </div>
        );

      case 'upcoming-event':
        return events.length > 0 ? (
          <div key={key}>
            <UpcomingEvent events={events} />
          </div>
        ) : null;

      default:
        return null;
    }
  }

  // ── Missing token ─────────────────────────────────────────────
  if (!token) {
    return (
      <div className="kiosk min-h-screen bg-blue-800 flex items-center justify-center text-white text-2xl">
        Missing token — add ?token=... to the URL.
      </div>
    );
  }

  // ── Overlays ──────────────────────────────────────────────────
  const showOverlay = overlay !== null;

  return (
    <div
      className="kiosk min-h-screen text-white"
      style={bgStyle}
      onPointerDown={resetInactivity}
    >
      {/* Timer fullscreen overlay */}
      {timer && !timerMinimized && (
        <TimerAlert
          remaining={timer.remaining}
          totalSeconds={timer.totalSeconds}
          label={timer.label}
          onMinimize={store.toggleTimerMinimized}
          accentColor={accent}
        />
      )}

      {/* Star store / history overlay */}
      {showOverlay && overlay === 'store' && (
        <StarStore
          balance={balance}
          rewards={rewardList}
          onRequest={handleRequestReward}
          onClose={() => setOverlay(null)}
          accentColor={accent}
        />
      )}
      {showOverlay && overlay === 'history' && (
        <StarHistory
          transactions={transactions}
          onClose={() => setOverlay(null)}
          accentColor={accent}
        />
      )}
      {showOverlay && overlay === 'store-or-history' && (
        <div
          className="fixed inset-0 z-50 flex flex-col text-white"
          style={{ background: `linear-gradient(135deg, ${accent}ee 0%, ${accent}99 100%)` }}
        >
          <div className="flex items-center gap-4 px-6 py-5 border-b border-white/20">
            <button onClick={() => setOverlay(null)} className="min-w-[48px] min-h-[48px] flex items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20 text-2xl">←</button>
            <div className="text-2xl font-bold">⭐ {balance}</div>
          </div>
          <div className="flex-1 flex items-center justify-center gap-6 px-8">
            <button
              onClick={() => setOverlay('store')}
              className="flex-1 max-w-[240px] bg-white/10 hover:bg-white/20 rounded-3xl p-8 flex flex-col items-center gap-4 text-center active:scale-95 transition-all min-h-[200px]"
            >
              <span className="text-5xl">🛍️</span>
              <span className="text-xl font-bold">Star Store</span>
            </button>
            <button
              onClick={() => setOverlay('history')}
              className="flex-1 max-w-[240px] bg-white/10 hover:bg-white/20 rounded-3xl p-8 flex flex-col items-center gap-4 text-center active:scale-95 transition-all min-h-[200px]"
            >
              <span className="text-5xl">📋</span>
              <span className="text-xl font-bold">History</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Unified header (clock / weather / stars) ──────────────── */}
      <ChildHeader
        weather={weather}
        balance={balance}
        level={level}
        storeEnabled={storeEnabled}
        historyEnabled={historyEnabled}
        onStarTap={handleStarTap}
        timer={timer}
        timerMinimized={timerMinimized}
        onExpandTimer={store.toggleTimerMinimized}
      />

      {/* ── Widget grid ───────────────────────────────────────────── */}
      <div
        className="flex flex-col gap-4 p-4 md:grid md:grid-cols-2 md:gap-5 md:p-6 xl:grid-cols-3 xl:gap-6 xl:p-8"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onClick={resetInactivity}
      >
        {currentEntries.filter(e => !HEADER_WIDGETS.has(e.widgetId)).map(renderWidget)}
      </div>

      {/* ── Page dot indicator ────────────────────────────────────── */}
      {availablePages.length > 1 && (
        <div className="fixed bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
          {availablePages.map(p => (
            <button
              key={p}
              onClick={() => { setCurrentPage(p); resetInactivity(); }}
              className={`w-2.5 h-2.5 xl:w-3 xl:h-3 rounded-full transition-all ${p === currentPage ? 'bg-white' : 'bg-white/30'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
