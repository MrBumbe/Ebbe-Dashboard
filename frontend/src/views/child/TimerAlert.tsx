import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  remaining: number;
  totalSeconds: number;
  label: string;
  onMinimize: () => void;
  accentColor?: string;
}

// Gentle 3-note descending chime using Web Audio API
function playChime() {
  try {
    const ctx = new AudioContext();
    const notes = [523.25, 392.00, 261.63]; // C5, G4, C4
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.4;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.35, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
      osc.start(t);
      osc.stop(t + 0.7);
    });
  } catch {
    // AudioContext not available — silent fallback
  }
}

export default function TimerAlert({ remaining, totalSeconds, label, onMinimize }: Props) {
  const { t } = useTranslation();
  const prevRemaining = useRef(remaining);
  const chimePlayed = useRef(false);

  // Play chime exactly once when timer reaches 0
  useEffect(() => {
    if (prevRemaining.current > 0 && remaining === 0 && !chimePlayed.current) {
      chimePlayed.current = true;
      playChime();
    }
    prevRemaining.current = remaining;
  }, [remaining]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const progress = totalSeconds > 0 ? remaining / totalSeconds : 0;
  const circumference = 2 * Math.PI * 54;
  const dash = circumference * progress;

  const isUrgent = remaining <= 60;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center text-white transition-colors duration-1000 ${isUrgent ? 'bg-red-600/95' : 'bg-amber-500/95'}`}
      onClick={isUrgent ? undefined : onMinimize}
    >
      {/* SVG countdown ring */}
      <div className="relative w-48 h-48 xl:w-72 xl:h-72 mb-6">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r="54" fill="none" stroke="white" strokeOpacity="0.2" strokeWidth="8" />
          <circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke="white"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl xl:text-6xl font-bold tabular-nums">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
          {!isUrgent && (
            <span className="text-xs xl:text-sm opacity-60 mt-1">tap to minimise</span>
          )}
        </div>
      </div>

      {/* Label */}
      <div className="text-2xl xl:text-4xl font-bold text-center px-8 max-w-lg">
        {t('child.timer.label', { minutes: minutes + (seconds > 0 ? 1 : 0), activity: label })}
      </div>

      {isUrgent && (
        <div className="mt-4 text-lg xl:text-2xl font-semibold animate-pulse opacity-90">
          ⏰ {remaining === 0 ? "Time's up!" : 'Almost time!'}
        </div>
      )}
    </div>
  );
}
