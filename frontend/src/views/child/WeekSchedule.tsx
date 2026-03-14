import { useTranslation } from 'react-i18next';
import type { ScheduleItem } from '../../api/child';

interface Props {
  items: ScheduleItem[];
}

export default function WeekSchedule({ items }: Props) {
  const { t } = useTranslation();

  // Group by day
  const byDay: Record<number, ScheduleItem[]> = {};
  for (const item of items) {
    if (!byDay[item.dayOfWeek]) byDay[item.dayOfWeek] = [];
    byDay[item.dayOfWeek].push(item);
  }

  // 0=Mon … 6=Sun. JS getDay() returns 0=Sun, so convert.
  const jsDay = new Date().getDay();
  const today = jsDay === 0 ? 6 : jsDay - 1;

  const days = [0, 1, 2, 3, 4, 5, 6];

  return (
    <div className="bg-white/10 rounded-2xl p-4 xl:p-6">
      <h2 className="text-lg md:text-xl xl:text-2xl font-bold mb-3">
        {t('child.schedule.title')}
      </h2>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const isToday = day === today;
          const dayItems = byDay[day] ?? [];
          return (
            <div
              key={day}
              className={`rounded-xl p-1 xl:p-2 flex flex-col gap-1 min-h-[60px] ${isToday ? 'bg-white/20 ring-2 ring-white/60' : 'bg-white/5'}`}
            >
              <p className={`text-center text-xs xl:text-sm font-bold ${isToday ? 'text-yellow-300' : 'opacity-60'}`}>
                {t(`child.schedule.days.${day}`).slice(0, 2)}
              </p>
              {dayItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded px-1 py-0.5 text-xs xl:text-sm truncate text-center"
                  style={{ backgroundColor: `${item.color}55` }}
                  title={`${item.timeStart} ${item.title}`}
                >
                  {item.emoji}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
