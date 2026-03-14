import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import client from '../../api/client';

interface Stats {
  balance: number;
  tasksToday: number;
  totalTasks: number;
}

export default function Dashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    async function load() {
      const [balRes, tasksRes] = await Promise.allSettled([
        client.get<{ data: { balance: number } }>('/rewards/balance'),
        client.get<{ data: unknown[] }>('/tasks'),
      ]);
      const balance = balRes.status === 'fulfilled' ? balRes.value.data.data.balance : 0;
      const totalTasks = tasksRes.status === 'fulfilled' ? tasksRes.value.data.data.length : 0;
      setStats({ balance, tasksToday: 0, totalTasks });
    }
    void load();
  }, []);

  const cards = [
    { label: t('child.stars.label'), value: stats?.balance ?? '—', emoji: '⭐' },
    { label: t('parent.tasks.title'), value: stats?.totalTasks ?? '—', emoji: '📋' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('parent.nav.dashboard')}</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="text-3xl mb-2">{c.emoji}</div>
            <div className="text-2xl font-bold text-gray-800">{c.value}</div>
            <div className="text-sm text-gray-500 mt-1">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
