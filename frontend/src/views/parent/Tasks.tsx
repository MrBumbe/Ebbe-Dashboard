import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import client from '../../api/client';
import EmojiPicker from '../../components/EmojiPicker';

interface Task {
  id: string;
  title: string;
  emoji: string;
  routine: 'morning' | 'evening' | 'custom';
  routineName: string | null;
  order: number;
  starValue: number;
  isActive: boolean;
  isVisibleToChild: boolean;
  daysOfWeek: string; // JSON
  timeStart: string | null;
  timeEnd: string | null;
  focusModeEnabled: boolean;
}

const ROUTINES = ['morning', 'evening', 'custom'] as const;
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface FormState {
  title: string;
  emoji: string;
  routine: Task['routine'];
  routineName: string;
  starValue: number;
  isVisibleToChild: boolean;
  daysOfWeek: number[];
  timeStart: string;
  timeEnd: string;
}

const defaultForm: FormState = {
  title: '', emoji: '⭐', routine: 'morning', routineName: '',
  starValue: 1, isVisibleToChild: true,
  daysOfWeek: [0,1,2,3,4,5,6], timeStart: '', timeEnd: '',
};

export default function Tasks() {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [error, setError] = useState('');
  const [completingId, setCompletingId] = useState<string | null>(null);

  async function load() {
    const res = await client.get<{ data: Task[] }>('/tasks');
    setTasks(res.data.data);
  }

  useEffect(() => { void load(); }, []);

  function parseDays(task: Task): number[] {
    try { return JSON.parse(task.daysOfWeek) as number[]; } catch { return [0,1,2,3,4,5,6]; }
  }

  function startEdit(task: Task) {
    setEditId(task.id);
    setForm({
      title: task.title,
      emoji: task.emoji,
      routine: task.routine,
      routineName: task.routineName ?? '',
      starValue: task.starValue,
      isVisibleToChild: task.isVisibleToChild,
      daysOfWeek: parseDays(task),
      timeStart: task.timeStart ?? '',
      timeEnd: task.timeEnd ?? '',
    });
    setAdding(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await client.post('/tasks', {
        ...form,
        routineName: form.routineName || null,
        timeStart: form.timeStart || null,
        timeEnd: form.timeEnd || null,
      });
      setAdding(false);
      setForm(defaultForm);
      await load();
    } catch {
      setError(t('errors.unknown'));
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editId) return;
    setError('');
    try {
      await client.patch(`/tasks/${editId}`, {
        ...form,
        routineName: form.routineName || null,
        timeStart: form.timeStart || null,
        timeEnd: form.timeEnd || null,
      });
      setEditId(null);
      setForm(defaultForm);
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

  async function handleComplete(task: Task) {
    setCompletingId(task.id);
    try {
      await client.post(`/tasks/${task.id}/complete`, {});
    } finally {
      setCompletingId(null);
      await load();
    }
  }

  function toggleDay(day: number) {
    setForm(f => ({
      ...f,
      daysOfWeek: f.daysOfWeek.includes(day)
        ? f.daysOfWeek.filter(d => d !== day)
        : [...f.daysOfWeek, day].sort(),
    }));
  }

  const grouped = ROUTINES.reduce<Record<string, Task[]>>((acc, r) => {
    acc[r] = tasks.filter((t) => t.routine === r);
    return acc;
  }, {} as Record<string, Task[]>);

  const routineLabel: Record<string, string> = {
    morning: t('parent.tasks.morning'),
    evening: t('parent.tasks.evening'),
    custom: t('parent.tasks.customRoutine'),
  };

  function TaskForm({ onSubmit, submitLabel }: { onSubmit: (e: React.FormEvent) => Promise<void>; submitLabel: string }) {
    return (
      <form onSubmit={(e) => void onSubmit(e)} className="bg-white border border-gray-200 rounded-xl p-4 mb-4 flex flex-col gap-3">
        {/* Title + emoji */}
        <div className="flex gap-3">
          <EmojiPicker value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e })} />
          <input
            required
            placeholder={t('parent.tasks.titlePlaceholder')}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="flex-1 border rounded-lg px-3 py-2 text-sm"
          />
        </div>

        {/* Routine + custom name */}
        <div className="flex gap-3 flex-wrap">
          <select
            value={form.routine}
            onChange={(e) => setForm({ ...form, routine: e.target.value as Task['routine'] })}
            className="flex-1 min-w-[140px] border rounded-lg px-3 py-2 text-sm"
          >
            <option value="morning">{t('parent.tasks.morning')}</option>
            <option value="evening">{t('parent.tasks.evening')}</option>
            <option value="custom">{t('parent.tasks.createNewRoutine')}</option>
          </select>
          {form.routine === 'custom' && (
            <input
              placeholder={t('parent.tasks.routineNamePlaceholder')}
              value={form.routineName}
              onChange={(e) => setForm({ ...form, routineName: e.target.value })}
              className="flex-1 min-w-[140px] border rounded-lg px-3 py-2 text-sm"
            />
          )}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{t('parent.tasks.starValue')}</span>
            <input
              type="number" min={1} max={10} value={form.starValue}
              onChange={(e) => setForm({ ...form, starValue: parseInt(e.target.value) })}
              className="w-16 border rounded-lg px-2 py-2 text-sm text-center"
            />
          </div>
        </div>

        {/* Visible to child */}
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox" checked={form.isVisibleToChild}
            onChange={(e) => setForm({ ...form, isVisibleToChild: e.target.checked })}
            className="rounded"
          />
          {t('parent.tasks.visibleToChild')}
        </label>

        {/* Days of week */}
        <div>
          <p className="text-xs font-medium text-gray-600 mb-1.5">{t('parent.tasks.activeDays')}</p>
          <div className="flex gap-1.5 flex-wrap">
            {DAY_LABELS.map((label, i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggleDay(i)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${form.daysOfWeek.includes(i) ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Time window */}
        <div className="flex gap-3 items-center flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600">{t('parent.tasks.timeFrom')}</label>
            <input type="time" value={form.timeStart} onChange={(e) => setForm({ ...form, timeStart: e.target.value })} className="border rounded-lg px-2 py-1.5 text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600">{t('parent.tasks.timeTo')}</label>
            <input type="time" value={form.timeEnd} onChange={(e) => setForm({ ...form, timeEnd: e.target.value })} className="border rounded-lg px-2 py-1.5 text-sm" />
          </div>
          {(form.timeStart || form.timeEnd) && (
            <button type="button" onClick={() => setForm({ ...form, timeStart: '', timeEnd: '' })} className="text-xs text-gray-400 hover:text-gray-600">
              Clear
            </button>
          )}
        </div>
        {(form.timeStart || form.timeEnd) && (
          <p className="text-xs text-gray-400 -mt-1">{t('parent.tasks.timeHint')}</p>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={() => { setAdding(false); setEditId(null); setError(''); }} className="text-sm text-gray-500 px-4 py-2 hover:bg-gray-50 rounded-lg">
            Cancel
          </button>
          <button type="submit" className="bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-800">
            {submitLabel}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('parent.tasks.title')}</h1>
        {!adding && !editId && (
          <button
            onClick={() => { setAdding(true); setForm(defaultForm); }}
            className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors min-h-[36px]"
          >
            + {t('parent.tasks.add')}
          </button>
        )}
      </div>

      {adding && <TaskForm onSubmit={handleAdd} submitLabel={t('parent.tasks.save')} />}

      {ROUTINES.map((routine) => (
        grouped[routine].length > 0 && (
          <div key={routine} className="mb-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">{routineLabel[routine]}</h2>
            <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
              {grouped[routine].map((task) => (
                <div key={task.id}>
                  {editId === task.id ? (
                    <div className="p-3">
                      <TaskForm onSubmit={handleEdit} submitLabel={t('parent.tasks.save')} />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 flex-wrap">
                      <span className="text-xl">{task.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm font-medium ${task.isActive ? 'text-gray-800' : 'text-gray-400 line-through'}`}>
                          {task.title}
                        </span>
                        <div className="flex gap-2 mt-0.5 flex-wrap">
                          {!task.isVisibleToChild && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">Parent only</span>
                          )}
                          {task.timeStart && (
                            <span className="text-xs text-gray-400">{task.timeStart}–{task.timeEnd ?? '…'}</span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">{task.starValue}⭐</span>

                      {/* Complete button — shown for parent-only tasks */}
                      {!task.isVisibleToChild && task.isActive && (
                        <button
                          onClick={() => void handleComplete(task)}
                          disabled={completingId === task.id}
                          className="text-xs bg-amber-100 text-amber-700 hover:bg-amber-200 px-2 py-1 rounded-md disabled:opacity-50"
                        >
                          {completingId === task.id ? '...' : '✓ Done'}
                        </button>
                      )}

                      <button
                        onClick={() => void handleToggle(task)}
                        className={`text-xs px-2 py-1 rounded-md ${task.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                      >
                        {task.isActive ? 'Active' : 'Inactive'}
                      </button>
                      <button onClick={() => startEdit(task)} className="text-xs text-blue-500 hover:text-blue-700 px-2 py-1">
                        Edit
                      </button>
                      <button onClick={() => void handleDelete(task.id)} className="text-xs text-red-400 hover:text-red-600 px-2 py-1">
                        {t('parent.tasks.delete')}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      ))}
    </div>
  );
}
