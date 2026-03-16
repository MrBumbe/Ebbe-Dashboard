interface Props {
  date: Date;
  sizeCls: string; // tailwind size classes e.g. "w-32 h-32 xl:w-48 xl:h-48"
}

export default function AnalogClock({ date, sizeCls }: Props) {
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
    <svg viewBox="0 0 100 100" className={`${sizeCls} drop-shadow-lg flex-shrink-0`}>
      <circle cx="50" cy="50" r="48" fill="white" fillOpacity="0.15" stroke="white" strokeOpacity="0.4" strokeWidth="1" />
      {Array.from({ length: 12 }).map((_, i) => {
        const rad = (i * 30 - 90) * (Math.PI / 180);
        const x1 = 50 + 40 * Math.cos(rad);
        const y1 = 50 + 40 * Math.sin(rad);
        const x2b = 50 + 44 * Math.cos(rad);
        const y2b = 50 + 44 * Math.sin(rad);
        return <line key={i} x1={x1} y1={y1} x2={x2b} y2={y2b} stroke="white" strokeOpacity="0.6" strokeWidth="2" strokeLinecap="round" />;
      })}
      {hand(hourDeg, 28, 4, 'white')}
      {hand(minuteDeg, 36, 3, 'white')}
      {hand(secondDeg, 38, 1.5, '#FCD34D')}
      <circle cx="50" cy="50" r="3" fill="white" />
    </svg>
  );
}
