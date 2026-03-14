import { useTranslation } from 'react-i18next';
import type { EventItem } from '../../api/child';

interface Props {
  events: EventItem[];
}

export default function UpcomingEvent({ events }: Props) {
  const { t } = useTranslation();

  if (events.length === 0) return null;

  const next = events[0];
  const msLeft = next.eventDate - Date.now();
  const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));

  const text = daysLeft <= 0
    ? t('child.event.today', { title: next.title })
    : t('child.event.daysLeft', { count: daysLeft, title: next.title });

  return (
    <div className="bg-white/10 rounded-2xl px-6 py-4 xl:py-6 flex items-center gap-4">
      <span className="text-4xl xl:text-6xl">{next.emoji}</span>
      <p className="text-lg md:text-xl xl:text-2xl font-semibold">{text}</p>
    </div>
  );
}
