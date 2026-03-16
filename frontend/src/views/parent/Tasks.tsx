import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import client from '../../api/client';
import EmojiPicker from '../../components/EmojiPicker';
import { tw } from '../../lib/theme';

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

// ── TaskForm is defined at module level so React never recreates the component
// type on re-render (which would cause every input to lose focus on each keystroke).
interface TaskFormProps {
  form: FormState;
  onChange: (form: FormState) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  submitLabel: string;
  error: string;
  onCancel: () => void;
}

function TaskForm({ form, onChange, onSubmit, submitLabel, error, onCancel }: TaskFormProps) {
  const { t } = useTranslation();

  function toggleDay(day: number) {
    onChange({
      ...form,
      daysOfWeek: form.daysOfWeek.includes(day)
        ? form.daysOfWeek.filter(d => d !== day)
        : [...form.daysOfWeek, day].sort(),
    });
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className={`${tw.formCard} mb-4`}>
      {/* Title + emoji */}
      <div className="flex gap-3">
        <EmojiPicker value={form.emoji} onChange={(e) => onChange({ ...form, emoji: e })} />
        <input
          required
          placeholder={t('parent.tasks.titlePlaceholder')}
          value={form.title}
          onChange={(e) => onChange({ ...form, title: e.target.value })}
          className={`flex-1 ${tw.input}`}
        />
      </div>

      {/* Routine + custom name */}
      <div className="flex gap-3 flex-wrap">
        <select
          value={form.routine}
          onChange={(e) => onChange({ ...form, routine: e.target.value as Task['routine'] })}
          className={`flex-1 min-w-[140px] ${tw.select}`}
        >
          <option value="morning">{t('parent.tasks.morning')}</option>
          <option value="evening">{t('parent.tasks.evening')}</option>
          <option value="custom">{t('parent.tasks.createNewRoutine')}</option>
        </select>
        {form.routine === 'custom' && (
          <input
            placeholder={t('parent.tasks.routineNamePlaceholder')}
            value={form.routineName}
            onChange={(e) => onChange({ ...form, routineName: e.target.value })}
            className={`flex-1 min-w-[140px] ${tw.input}`}
          />
        )}
        <div className="flex items-center gap-2">
          <span className={`text-sm ${tw.secondary}`}>{t('parent.tasks.starValue')}</span>
          <input
            type="number" min={1} max={10} value={form.starValue}
            onChange={(e) => onChange({ ...form, starValue: parseInt(e.target.value) })}
            className={`w-16 text-center ${tw.inputSm}`}
          />
        </div>
      </div>

      {/* Visible to child */}
      <label className={`flex items-center gap-2 text-sm ${tw.labelMd} cursor-pointer`}>
        <input
          type="checkbox" checked={form.isVisibleToChild}
          onChange={(e) => onChange({ ...form, isVisibleToChild: e.target.checked })}
          className="rounded"
        />
        {t('parent.tasks.visibleToChild')}
      </label>

      {/* Days of week */}
      <div>
        <p className={`${tw.labelSm} font-medium mb-1.5`}>{t('parent.tasks.activeDays')}</p>
        <div className="flex gap-1.5 flex-wrap">
          {DAY_LABELS.map((label, i) => (
            <button
              key={i}
              type="button"
              onClick={() => toggleDay(i)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${form.daysOfWeek.includes(i) ? 'bg-blue-700 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Time window */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="flex items-center gap-2">
          <label className={tw.labelSm}>{t('parent.tasks.timeFrom')}</label>
          <input type="time" value={form.timeStart} onChange={(e) => onChange({ ...form, timeStart: e.target.value })} className={tw.inputSm} />
        </div>
        <div className="flex items-center gap-2">
          <label className={tw.labelSm}>{t('parent.tasks.timeTo')}</label>
          <input type="time" value={form.timeEnd} onChange={(e) => onChange({ ...form, timeEnd: e.target.value })} className={tw.inputSm} />
        </div>
        {(form.timeStart || form.timeEnd) && (
          <button type="button" onClick={() => onChange({ ...form, timeStart: '', timeEnd: '' })} className={tw.muted + ' hover:text-gray-600 dark:hover:text-gray-300'}>
            Clear
          </button>
        )}
      </div>
      {(form.timeStart || form.timeEnd) && (
        <p className={`${tw.muted} -mt-1`}>{t('parent.tasks.timeHint')}</p>
      )}

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className={tw.btnCancel}>
          Cancel
        </button>
        <button type="submit" className={tw.btnPrimary}>
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

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

  function cancelForm() {
    setAdding(false);
    setEditId(null);
    setError('');
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

  const grouped = ROUTINES.reduce<Record<string, Task[]>>((acc, r) => {
    acc[r] = tasks.filter((t) => t.routine === r);
    return acc;
  }, {} as Record<string, Task[]>);

  const routineLabel: Record<string, string> = {
    morning: t('parent.tasks.morning'),
    evening: t('parent.tasks.evening'),
    custom: t('parent.tasks.customRoutine'),
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className={tw.pageHeading}>{t('parent.tasks.title')}</h1>
        {!adding && !editId && (
          <button
            onClick={() => { setAdding(true); setForm(defaultForm); }}
            className={tw.btnPrimary}
          >
            + {t('parent.tasks.add')}
          </button>
        )}
      </div>

      {adding && (
        <TaskForm
          form={form}
          onChange={setForm}
          onSubmit={handleAdd}
          submitLabel={t('parent.tasks.save')}
          error={error}
          onCancel={cancelForm}
        />
      )}

      {ROUTINES.map((routine) => (
        grouped[routine].length > 0 && (
          <div key={routine} className="mb-6">
            <h2 className={`${tw.sectionHeading} mb-2`}>{routineLabel[routine]}</h2>
            <div className={`${tw.card} ${tw.cardDivide}`}>
              {grouped[routine].map((task) => (
                <div key={task.id}>
                  {editId === task.id ? (
                    <div className="p-3">
                      <TaskForm
                        form={form}
                        onChange={setForm}
                        onSubmit={handleEdit}
                        submitLabel={t('parent.tasks.save')}
                        error={error}
                        onCancel={cancelForm}
                      />
                    </div>
                  ) : (
                    <div className={`flex items-center gap-3 px-4 py-3 ${tw.listRow} flex-wrap`}>
                      <span className="text-xl">{task.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm font-medium ${task.isActive ? 'text-gray-800 dark:text-gray-100' : 'text-gray-400 line-through'}`}>
                          {task.title}
                        </span>
                        <div className="flex gap-2 mt-0.5 flex-wrap">
                          {!task.isVisibleToChild && (
                            <span className={tw.badgePurple}>Parent only</span>
                          )}
                          {task.timeStart && (
                            <span className={tw.muted}>{task.timeStart}–{task.timeEnd ?? '…'}</span>
                          )}
                        </div>
                      </div>
                      <span className={tw.muted}>{task.starValue}⭐</span>

                      {/* Complete button — shown for parent-only tasks */}
                      {!task.isVisibleToChild && task.isActive && (
                        <button
                          onClick={() => void handleComplete(task)}
                          disabled={completingId === task.id}
                          className={`${tw.badgeAmber} hover:bg-amber-200 dark:hover:bg-amber-900/60 disabled:opacity-50`}
                        >
                          {completingId === task.id ? '...' : '✓ Done'}
                        </button>
                      )}

                      <button
                        onClick={() => void handleToggle(task)}
                        className={task.isActive ? tw.badgeGreen : tw.badgeGray}
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
