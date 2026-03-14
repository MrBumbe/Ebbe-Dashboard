import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import client from '../../api/client';

interface Reward {
  id: string;
  title: string;
  emoji: string;
  starCost: number;
  isActive: boolean;
}

export default function Rewards() {
  const { t } = useTranslation();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [balance, setBalance] = useState(0);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: '', emoji: '🎁', starCost: 10 });
  const [error, setError] = useState('');

  async function load() {
    const [r, b] = await Promise.all([
      client.get<{ data: Reward[] }>('/rewards'),
      client.get<{ data: { balance: number } }>('/rewards/balance'),
    ]);
    setRewards(r.data.data);
    setBalance(b.data.data.balance);
  }

  useEffect(() => { void load(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await client.post('/rewards', form);
      setAdding(false);
      setForm({ title: '', emoji: '🎁', starCost: 10 });
      await load();
    } catch {
      setError(t('errors.unknown'));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t('parent.tasks.delete') + '?')) return;
    await client.delete(`/rewards/${id}`);
    await load();
  }

  async function handleToggle(r: Reward) {
    await client.patch(`/rewards/${r.id}`, { isActive: !r.isActive });
    await load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-800">{t('parent.rewards.title')}</h1>
        <button
          onClick={() => setAdding(true)}
          className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + {t('parent.rewards.add')}
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-6">{t('parent.rewards.balance', { count: balance })}</p>

      {adding && (
        <form onSubmit={(e) => void handleAdd(e)} className="bg-white border border-gray-200 rounded-xl p-4 mb-6 flex flex-col gap-3">
          <div className="flex gap-3">
            <input
              placeholder="🎁"
              value={form.emoji}
              onChange={(e) => setForm({ ...form, emoji: e.target.value })}
              className="w-16 border rounded-lg px-2 py-2 text-center text-lg"
            />
            <input
              required
              placeholder={t('parent.rewards.title')}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{t('parent.rewards.starCost')}</span>
            <input
              type="number"
              min={1}
              value={form.starCost}
              onChange={(e) => setForm({ ...form, starCost: parseInt(e.target.value) })}
              className="w-20 border rounded-lg px-2 py-2 text-sm"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setAdding(false)} className="text-sm text-gray-500 px-4 py-2 hover:bg-gray-50 rounded-lg">
              Cancel
            </button>
            <button type="submit" className="bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-800">
              {t('parent.tasks.save')}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
        {rewards.map((r) => (
          <div key={r.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
            <span className="text-xl">{r.emoji}</span>
            <span className={`flex-1 text-sm font-medium ${r.isActive ? 'text-gray-800' : 'text-gray-400 line-through'}`}>
              {r.title}
            </span>
            <span className="text-sm font-semibold text-amber-600">{r.starCost} ⭐</span>
            <button
              onClick={() => void handleToggle(r)}
              className={`text-xs px-2 py-1 rounded-md ${r.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
            >
              {r.isActive ? 'Active' : 'Inactive'}
            </button>
            <button onClick={() => void handleDelete(r.id)} className="text-xs text-red-400 hover:text-red-600 px-2 py-1">
              {t('parent.tasks.delete')}
            </button>
          </div>
        ))}
        {rewards.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">No rewards yet.</p>
        )}
      </div>
    </div>
  );
}
