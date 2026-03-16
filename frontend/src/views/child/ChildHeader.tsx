import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { WeatherData } from '../../api/child';
import AnalogClock from './AnalogClock';

interface TimerState {
  remaining: number;
  label: string;
}

interface Props {
  weather: WeatherData | null;
  balance: number;
  level: 1 | 2 | 3;
  storeEnabled: boolean;
  historyEnabled: boolean;
  onStarTap?: () => void;
  timer: TimerState | null;
  timerMinimized: boolean;
  onExpandTimer: () => void;
}

const WEATHER_EMOJI: Record<string, string> = {
  sunny: '☀️', cloudy: '☁️', rain: '🌧️', snow: '❄️', storm: '⛈️', fog: '🌫️',
};

export default function ChildHeader({
  weather, balance, level, storeEnabled, historyEnabled, onStarTap,
  timer, timerMinimized, onExpandTimer,
}: Props) {
  const { t, i18n } = useTranslation();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Weekday (Ebbe: 0=Mon … 6=Sun)
  const jsDay = now.getDay();
  const ebbeDay = jsDay === 0 ? 6 : jsDay - 1;
  const weekdayName = t(`child.schedule.days.${ebbeDay}`);

  // Date string e.g. "21 mars" / "21 March"
  const dateLocale = i18n.language.startsWith('sv') ? 'sv-SE' : 'en-GB';
  const dateStr = now.toLocaleDateString(dateLocale, { day: 'numeric', month: 'long' });

  const weatherEmoji = weather ? (WEATHER_EMOJI[weather.condition] ?? '🌤️') : null;
  const tappable = (storeEnabled || historyEnabled) && onStarTap;

  // ── Level 3: single compact row ────────────────────────────────
  if (level === 3) {
    return (
      <div className="flex-shrink-0">
        <div className="flex items-center justify-between gap-2 px-4 py-3 xl:px-6 xl:py-4 bg-white/10 rounded-2xl mx-4 mt-4 xl:mx-6 xl:mt-6">
          {/* Weather */}
          <div className="flex items-center gap-1.5">
            {weatherEmoji && <span className="text-xl xl:text-2xl">{weatherEmoji}</span>}
            {weather && <span className="text-base xl:text-lg font-semibold">{weather.temperature}°</span>}
          </div>

          {/* Time */}
          <span className="text-2xl xl:text-4xl font-bold tabular-nums">{timeStr}</span>

          {/* Weekday */}
          <span className="text-sm xl:text-base opacity-80">{weekdayName}</span>

          {/* Stars */}
          {tappable ? (
            <button onClick={onStarTap} className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 active:scale-95 rounded-xl px-3 py-1.5 transition-all">
              <span className="text-xl">⭐</span>
              <span className="text-base xl:text-xl font-bold tabular-nums">{balance}</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-xl">⭐</span>
              <span className="text-base xl:text-xl font-bold tabular-nums">{balance}</span>
            </div>
          )}
        </div>

        {/* Compact timer bar */}
        {timer && timerMinimized && (
          <button
            onClick={onExpandTimer}
            className="mx-4 mt-2 xl:mx-6 w-[calc(100%-2rem)] xl:w-[calc(100%-3rem)] flex items-center gap-3 bg-amber-500/80 hover:bg-amber-500 rounded-xl px-4 py-2 transition-colors"
          >
            <span className="text-xl">{timer.label.match(/\p{Emoji}/u)?.[0] ?? '⏱️'}</span>
            <span className="flex-1 text-sm font-semibold truncate text-left">{timer.label.replace(/\p{Emoji}/gu, '').trim() || timer.label}</span>
            <span className="text-base font-bold tabular-nums">
              {String(Math.floor(timer.remaining / 60)).padStart(2, '0')}:{String(timer.remaining % 60).padStart(2, '0')}
            </span>
          </button>
        )}
      </div>
    );
  }

  // ── Level 1 & 2: Three-column layout ──────────────────────────
  const analogSizeCls = level === 1
    ? 'w-32 h-32 md:w-44 md:h-44 xl:w-60 xl:h-60'
    : 'w-24 h-24 md:w-32 md:h-32 xl:w-44 xl:h-44';

  const timeTextCls = level === 1
    ? 'text-4xl md:text-6xl xl:text-8xl'
    : 'text-3xl md:text-5xl xl:text-6xl';

  return (
    <div className="flex-shrink-0 px-4 pt-4 xl:px-6 xl:pt-6">
      <div className="grid grid-cols-3 gap-4 xl:gap-6 items-center bg-white/10 rounded-2xl p-4 xl:p-6">

        {/* Left — weather + date */}
        <div className="flex flex-col gap-1">
          {weatherEmoji && (
            <div className="flex items-center gap-2">
              <span className={level === 1 ? 'text-4xl xl:text-5xl' : 'text-3xl xl:text-4xl'}>{weatherEmoji}</span>
              {weather && (
                <span className={`font-bold ${level === 1 ? 'text-3xl xl:text-4xl' : 'text-xl xl:text-3xl'}`}>
                  {weather.temperature}°
                </span>
              )}
            </div>
          )}
          {!weatherEmoji && <div className="h-10" />}
          {level === 1 && (
            <p className="text-base xl:text-xl opacity-80">{dateStr}</p>
          )}
          <p className={`opacity-90 font-medium ${level === 1 ? 'text-lg xl:text-2xl' : 'text-base xl:text-lg'}`}>
            {weekdayName}
          </p>
        </div>

        {/* Center — digital time + analog clock */}
        <div className="flex flex-col items-center gap-2 xl:gap-3">
          <span className={`font-bold tabular-nums tracking-tight ${timeTextCls}`}>{timeStr}</span>
          <AnalogClock date={now} sizeCls={analogSizeCls} />
        </div>

        {/* Right — star balance */}
        <div className="flex flex-col items-end">
          {tappable ? (
            <button
              onClick={onStarTap}
              className="flex flex-col items-center bg-white/10 hover:bg-white/20 active:scale-95 rounded-2xl px-4 py-3 xl:px-6 xl:py-4 transition-all w-full"
            >
              <span className={level === 1 ? 'text-5xl xl:text-7xl' : 'text-4xl xl:text-5xl'}>⭐</span>
              <span className={`font-bold tabular-nums ${level === 1 ? 'text-4xl xl:text-6xl' : 'text-3xl xl:text-4xl'}`}>{balance}</span>
              <span className="text-xs opacity-60 mt-1">{t('child.stars.tapToOpen')}</span>
            </button>
          ) : (
            <div className="flex flex-col items-center bg-white/10 rounded-2xl px-4 py-3 xl:px-6 xl:py-4 w-full">
              <span className={level === 1 ? 'text-5xl xl:text-7xl' : 'text-4xl xl:text-5xl'}>⭐</span>
              <span className={`font-bold tabular-nums ${level === 1 ? 'text-4xl xl:text-6xl' : 'text-3xl xl:text-4xl'}`}>{balance}</span>
            </div>
          )}
        </div>
      </div>

      {/* Compact timer bar (below 3-col header) */}
      {timer && timerMinimized && (
        <button
          onClick={onExpandTimer}
          className="mt-3 w-full flex items-center gap-3 bg-amber-500/80 hover:bg-amber-500 rounded-xl px-4 py-3 transition-colors"
        >
          <span className="text-2xl">{timer.label.match(/\p{Emoji}/u)?.[0] ?? '⏱️'}</span>
          <span className="flex-1 text-sm font-semibold truncate text-left">{timer.label.replace(/\p{Emoji}/gu, '').trim() || timer.label}</span>
          <span className="text-lg font-bold tabular-nums">
            {String(Math.floor(timer.remaining / 60)).padStart(2, '0')}:{String(timer.remaining % 60).padStart(2, '0')}
          </span>
        </button>
      )}
    </div>
  );
}
