import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

function AnalogClock({ date }: { date: Date }) {
  const h = date.getHours() % 12;
  const m = date.getMinutes();
  const s = date.getSeconds();

  const secondDeg = s * 6;
  const minuteDeg = m * 6 + s * 0.1;
  const hourDeg = h * 30 + m * 0.5;

  const hand = (deg: number, length: number, width: number, color: string) => {
    const rad = (deg - 90) * (Math.PI / 180);
    const x2 = 50 + length * Math.cos(rad);
    const y2 = 50 + length * Math.sin(rad);
    return <line x1="50" y1="50" x2={x2} y2={y2} stroke={color} strokeWidth={width} strokeLinecap="round" />;
  };

  return (
    <svg viewBox="0 0 100 100" className="w-28 h-28 md:w-40 md:h-40 xl:w-56 xl:h-56 drop-shadow-lg">
      {/* Face */}
      <circle cx="50" cy="50" r="48" fill="white" fillOpacity="0.15" stroke="white" strokeOpacity="0.4" strokeWidth="1" />
      {/* Hour marks */}
      {Array.from({ length: 12 }).map((_, i) => {
        const rad = (i * 30 - 90) * (Math.PI / 180);
        const x1 = 50 + 40 * Math.cos(rad);
        const y1 = 50 + 40 * Math.sin(rad);
        const x2 = 50 + 44 * Math.cos(rad);
        const y2 = 50 + 44 * Math.sin(rad);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" strokeOpacity="0.6" strokeWidth="2" strokeLinecap="round" />;
      })}
      {hand(hourDeg, 28, 4, 'white')}
      {hand(minuteDeg, 36, 3, 'white')}
      {hand(secondDeg, 38, 1.5, '#FCD34D')}
      {/* Center dot */}
      <circle cx="50" cy="50" r="3" fill="white" />
    </svg>
  );
}

export default function Clock() {
  const [now, setNow] = useState(new Date());
  const { t } = useTranslation();

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hour = now.getHours();
  const greeting = hour >= 5 && hour < 18 ? t('child.goodMorning') : t('child.goodEvening');

  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex flex-col items-center gap-2 xl:gap-4">
      <AnalogClock date={now} />
      <div className="text-5xl md:text-6xl xl:text-8xl font-bold tracking-tight tabular-nums">
        {timeStr}
      </div>
      <div className="text-xl md:text-2xl xl:text-3xl font-medium opacity-90">
        {greeting}
      </div>
    </div>
  );
}
