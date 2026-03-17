import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import client from '../../api/client';
import { tw } from '../../lib/theme';
import { useAuthStore } from '../../store/useAuthStore';

interface MoodEntry {
  id: string;
  mood: string;
  loggedAt: number;
  note: string | null;
}

const MOOD_EMOJI: Record<string, string> = {
  happy: '😄', okay: '🙂', sad: '😔', angry: '😡',
  tired: '😴', excited: '🤩', anxious: '😰',
};

export default function MoodLog() {
  const { t } = useTranslation();
  const { activeChildId } = useAuthStore();
  const [entries, setEntries] = useState<MoodEntry[]>([]);

  useEffect(() => {
    const params = activeChildId ? { childId: activeChildId } : {};
    client.get<{ data: MoodEntry[] }>('/mood', { params })
      .then((res) => setEntries(res.data.data))
      .catch(() => null);
  }, [activeChildId]);

  return (
    <div>
      <h1 className={`${tw.pageHeading} mb-6`}>{t('parent.nav.mood')}</h1>
      <div className={`${tw.card} ${tw.cardDivide}`}>
        {entries.map((e) => (
          <div key={e.id} className="flex items-center gap-3 px-4 py-3">
            <span className="text-2xl">{MOOD_EMOJI[e.mood] ?? '❓'}</span>
            <div className="flex-1">
              <p className={`text-sm font-medium ${tw.body}`}>{t(`child.mood.${e.mood}`)}</p>
              {e.note && <p className={`${tw.secondary} mt-0.5`}>{e.note}</p>}
            </div>
            <p className={tw.muted}>
              {new Date(e.loggedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>
        ))}
        {entries.length === 0 && (
          <p className={`${tw.muted} text-sm text-center py-6`}>No mood entries yet.</p>
        )}
      </div>
    </div>
  );
}
