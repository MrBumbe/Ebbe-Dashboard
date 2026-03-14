import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import client from '../../api/client';

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
  const [entries, setEntries] = useState<MoodEntry[]>([]);

  useEffect(() => {
    client.get<{ data: MoodEntry[] }>('/mood').then((res) => setEntries(res.data.data)).catch(() => null);
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('parent.nav.mood')}</h1>
      <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
        {entries.map((e) => (
          <div key={e.id} className="flex items-center gap-3 px-4 py-3">
            <span className="text-2xl">{MOOD_EMOJI[e.mood] ?? '❓'}</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">{t(`child.mood.${e.mood}`)}</p>
              {e.note && <p className="text-xs text-gray-500 mt-0.5">{e.note}</p>}
            </div>
            <p className="text-xs text-gray-400">
              {new Date(e.loggedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>
        ))}
        {entries.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">No mood entries yet.</p>
        )}
      </div>
    </div>
  );
}
