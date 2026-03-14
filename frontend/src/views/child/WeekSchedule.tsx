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
    <div className="bg-white/10 rounded-2xl p-3 xl:p-6">
      <h2 className="text-base md:text-lg xl:text-2xl font-bold mb-3">
        {t('child.schedule.title')}
      </h2>

      {/* Horizontally scrollable 7-column grid */}
      <div className="overflow-x-auto -mx-1 px-1">
        <div className="grid grid-cols-7 gap-1.5 min-w-[420px] xl:min-w-0">
          {days.map((day) => {
            const isToday = day === today;
            const dayItems = byDay[day] ?? [];
            const dayLabel = t(`child.schedule.days.${day}`);
            // 2-letter abbreviation, except on xl show 3
            const abbr = dayLabel.slice(0, 2);

            return (
              <div
                key={day}
                className={`rounded-xl flex flex-col min-h-[80px] xl:min-h-[120px] overflow-hidden ${isToday ? 'bg-white/25 ring-2 ring-white/70' : 'bg-white/8'}`}
                style={isToday ? {} : { background: 'rgba(255,255,255,0.08)' }}
              >
                {/* Day header */}
                <div className={`text-center py-1.5 xl:py-2 ${isToday ? 'bg-yellow-400/30' : 'bg-white/5'}`}>
                  <p className={`text-xs xl:text-sm font-bold tracking-wide ${isToday ? 'text-yellow-200' : 'opacity-70'}`}>
                    {abbr}
                  </p>
                </div>

                {/* Schedule items */}
                <div className="flex flex-col gap-1 p-1 xl:p-1.5 flex-1">
                  {dayItems.length === 0 && (
                    <div className="flex-1 flex items-center justify-center opacity-20">
                      <span className="text-xs">—</span>
                    </div>
                  )}
                  {dayItems.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg px-1 py-1 xl:py-1.5 flex flex-col items-center gap-0.5"
                      style={{ backgroundColor: `${item.color}55` }}
                      title={`${item.timeStart} ${item.title}`}
                    >
                      <span className="text-base xl:text-xl leading-none">{item.emoji}</span>
                      <span className="text-[9px] xl:text-xs opacity-80 leading-none tabular-nums">{item.timeStart}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Today's items — shown as a larger list below the grid */}
      {(byDay[today] ?? []).length > 0 && (
        <div className="mt-3 xl:mt-4">
          <p className="text-xs xl:text-sm font-semibold opacity-70 mb-1.5 uppercase tracking-wide">
            {t(`child.schedule.days.${today}`)}
          </p>
          <div className="flex flex-col gap-1.5">
            {(byDay[today] ?? []).map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-xl px-3 py-2 xl:py-3"
                style={{ backgroundColor: `${item.color}44`, borderLeft: `4px solid ${item.color}` }}
              >
                <span className="text-2xl xl:text-3xl leading-none">{item.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm xl:text-base font-semibold leading-tight truncate">{item.title}</p>
                  <p className="text-xs xl:text-sm opacity-70">{item.timeStart}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
