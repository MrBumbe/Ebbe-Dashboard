import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import client from '../../api/client';
import EmojiPicker from '../../components/EmojiPicker';

interface Reward {
  id: string;
  title: string;
  emoji: string;
  starCost: number;
  isActive: boolean;
}

interface RewardRequest {
  id: string;
  rewardId: string;
  status: 'pending' | 'approved' | 'denied';
  requestedAt: number;
  reward: Reward | null;
}

export default function Rewards() {
  const { t } = useTranslation();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [requests, setRequests] = useState<RewardRequest[]>([]);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Array<{ id: string; type: 'earn' | 'redeem'; amount: number; description: string; createdAt: number }>>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: '', emoji: '🎁', starCost: 10 });
  const [error, setError] = useState('');

  // Manual adjustment form
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustDesc, setAdjustDesc] = useState('');
  const [adjustError, setAdjustError] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  async function load() {
    const [r, b, rq, tx] = await Promise.all([
      client.get<{ data: Reward[] }>('/rewards'),
      client.get<{ data: { balance: number } }>('/rewards/balance'),
      client.get<{ data: RewardRequest[] }>('/rewards/requests'),
      client.get<{ data: Array<{ id: string; type: 'earn' | 'redeem'; amount: number; description: string; createdAt: number }> }>('/rewards/transactions'),
    ]);
    setRewards(r.data.data);
    setBalance(b.data.data.balance);
    setRequests(rq.data.data.filter(r => r.status === 'pending'));
    setTransactions(tx.data.data.slice(0, 10));
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

  async function handleRequest(id: string, action: 'approve' | 'deny') {
    await client.patch(`/rewards/requests/${id}`, { action });
    await load();
  }

  async function handleAdjust(e: React.FormEvent) {
    e.preventDefault();
    setAdjustError('');
    const amount = parseInt(adjustAmount);
    if (!Number.isInteger(amount) || amount === 0) {
      setAdjustError('Enter a non-zero number');
      return;
    }
    if (!adjustDesc.trim()) {
      setAdjustError('Description is required');
      return;
    }
    setAdjusting(true);
    try {
      await client.post('/rewards/adjust', { amount, description: adjustDesc.trim() });
      setAdjustAmount('');
      setAdjustDesc('');
      await load();
    } catch {
      setAdjustError(t('errors.unknown'));
    } finally {
      setAdjusting(false);
    }
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

      {/* Pending requests */}
      {requests.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
            {t('parent.rewards.pendingRequests')}
          </h2>
          <div className="bg-white rounded-xl border border-amber-200 divide-y divide-gray-50">
            {requests.map((req) => (
              <div key={req.id} className="flex items-center gap-3 px-4 py-3">
                <span className="text-xl">{req.reward?.emoji ?? '🎁'}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-800">{req.reward?.title ?? '—'}</span>
                  <p className="text-xs text-gray-400">{req.reward ? `${req.reward.starCost} ⭐` : ''}</p>
                </div>
                <button
                  onClick={() => void handleRequest(req.id, 'approve')}
                  className="text-xs bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1.5 rounded-md font-medium"
                >
                  ✓ {t('parent.rewards.approve')}
                </button>
                <button
                  onClick={() => void handleRequest(req.id, 'deny')}
                  className="text-xs bg-red-100 text-red-600 hover:bg-red-200 px-3 py-1.5 rounded-md font-medium"
                >
                  ✕ {t('parent.rewards.deny')}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add reward form */}
      {adding && (
        <form onSubmit={(e) => void handleAdd(e)} className="bg-white border border-gray-200 rounded-xl p-4 mb-6 flex flex-col gap-3">
          <div className="flex gap-3">
            <EmojiPicker value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e })} />
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

      {/* Reward list */}
      <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50 mb-6">
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

      {/* Manual star adjustment */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
          {t('parent.rewards.manualAdjust')}
        </h2>
        <form onSubmit={(e) => void handleAdjust(e)} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">{t('parent.rewards.adjustAmount')}</label>
              <input
                type="number"
                placeholder="+5 or -3"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                className="w-24 border rounded-lg px-2 py-2 text-sm"
              />
            </div>
            <input
              placeholder={t('parent.rewards.adjustDescription')}
              value={adjustDesc}
              onChange={(e) => setAdjustDesc(e.target.value)}
              className="flex-1 min-w-[180px] border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          {adjustError && <p className="text-sm text-red-600">{adjustError}</p>}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={adjusting}
              className="bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-800 disabled:opacity-50"
            >
              {t('parent.rewards.adjustSubmit')}
            </button>
          </div>
        </form>
      </div>

      {transactions.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Recent transactions</h2>
          <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
            {transactions.map((tx) => {
              const isEarn = tx.type === 'earn';
              const icon = isEarn ? '⭐' : tx.description.startsWith('Redeemed:') ? '🎁' : '✂️';
              const dateStr = new Date(tx.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' });
              return (
                <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-lg">{icon}</span>
                  <span className="flex-1 text-sm text-gray-700 truncate">{tx.description}</span>
                  <span className="text-xs text-gray-400">{dateStr}</span>
                  <span className={`text-sm font-semibold ${isEarn ? 'text-green-600' : 'text-red-500'}`}>
                    {isEarn ? '+' : '-'}{tx.amount} ⭐
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
