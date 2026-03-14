import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import client from '../../api/client';

interface Task {
  id: string;
  title: string;
  emoji: string;
  routine: 'morning' | 'evening' | 'custom';
  order: number;
  starValue: number;
  isActive: boolean;
}

const ROUTINES = ['morning', 'evening', 'custom'] as const;

export default function Tasks() {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: '', emoji: '⭐', routine: 'morning' as Task['routine'], starValue: 1 });
  const [error, setError] = useState('');

  async function load() {
    const res = await client.get<{ data: Task[] }>('/tasks');
    setTasks(res.data.data);
  }

  useEffect(() => { void load(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await client.post('/tasks', form);
      setAdding(false);
      setForm({ title: '', emoji: '⭐', routine: 'morning', starValue: 1 });
      await load();
    } catch {
      setError(t('errors.unknown'));
    }
  }

  async function handleToggle(task: Task) {
    await client.patch(`/tasks/${task.id}`, { isActive: !task.isActive });
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm(t('parent.tasks.delete') + '?')) return;
    await client.delete(`/tasks/${id}`);
    await load();
  }

  const grouped = ROUTINES.reduce<Record<string, Task[]>>((acc, r) => {
    acc[r] = tasks.filter((t) => t.routine === r);
    return acc;
  }, {} as Record<string, Task[]>);

  const routineLabel: Record<string, string> = {
    morning: t('parent.tasks.morning'),
    evening: t('parent.tasks.evening'),
    custom: 'Custom',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('parent.tasks.title')}</h1>
        <button
          onClick={() => setAdding(true)}
          className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors min-h-[36px]"
        >
          + {t('parent.tasks.add')}
        </button>
      </div>

      {adding && (
        <form onSubmit={(e) => void handleAdd(e)} className="bg-white border border-gray-200 rounded-xl p-4 mb-6 flex flex-col gap-3">
          <div className="flex gap-3">
            <input
              placeholder="Emoji"
              value={form.emoji}
              onChange={(e) => setForm({ ...form, emoji: e.target.value })}
              className="w-16 border rounded-lg px-2 py-2 text-center text-lg"
            />
            <input
              required
              placeholder={t('parent.tasks.title')}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={form.routine}
              onChange={(e) => setForm({ ...form, routine: e.target.value as Task['routine'] })}
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
            >
              {ROUTINES.map((r) => <option key={r} value={r}>{routineLabel[r]}</option>)}
            </select>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{t('parent.tasks.starValue')}</span>
              <input
                type="number"
                min={1}
                max={10}
                value={form.starValue}
                onChange={(e) => setForm({ ...form, starValue: parseInt(e.target.value) })}
                className="w-16 border rounded-lg px-2 py-2 text-sm text-center"
              />
            </div>
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

      {ROUTINES.map((routine) => (
        grouped[routine].length > 0 && (
          <div key={routine} className="mb-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">{routineLabel[routine]}</h2>
            <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
              {grouped[routine].map((task) => (
                <div key={task.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                  <span className="text-xl">{task.emoji}</span>
                  <span className={`flex-1 text-sm font-medium ${task.isActive ? 'text-gray-800' : 'text-gray-400 line-through'}`}>
                    {task.title}
                  </span>
                  <span className="text-xs text-gray-400">{task.starValue}⭐</span>
                  <button
                    onClick={() => void handleToggle(task)}
                    className={`text-xs px-2 py-1 rounded-md ${task.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                  >
                    {task.isActive ? 'Active' : 'Inactive'}
                  </button>
                  <button
                    onClick={() => void handleDelete(task.id)}
                    className="text-xs text-red-400 hover:text-red-600 px-2 py-1"
                  >
                    {t('parent.tasks.delete')}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )
      ))}
    </div>
  );
}
