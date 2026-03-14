import { useTranslation } from 'react-i18next';

interface Props {
  remaining: number;
  totalSeconds: number;
  label: string;
}

export default function TimerAlert({ remaining, totalSeconds, label }: Props) {
  const { t } = useTranslation();
  const minutes = Math.ceil(remaining / 60);
  const progress = remaining / totalSeconds;
  const circumference = 2 * Math.PI * 54;
  const dash = circumference * progress;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-amber-500/95 text-white">
      <div className="relative w-48 h-48 xl:w-64 xl:h-64 mb-6">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r="54" fill="none" stroke="white" strokeOpacity="0.2" strokeWidth="8" />
          <circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke="white"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl xl:text-7xl font-bold tabular-nums">{minutes}</span>
          <span className="text-lg xl:text-xl opacity-80">min</span>
        </div>
      </div>
      <div className="text-3xl xl:text-5xl font-bold text-center px-6">
        {t('child.timer.label', { minutes, activity: label })}
      </div>
    </div>
  );
}
