import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import client from '../../api/client';
import EmojiPicker from '../../components/EmojiPicker';

interface ScheduleItem {
  id: string;
  dayOfWeek: number;
  timeStart: string;
  title: string;
  emoji: string;
  color: string;
  isRecurring: boolean;
  specificDate: number | null;
}

const DAYS = [0, 1, 2, 3, 4, 5, 6];

interface FormState {
  dayOfWeek: number;
  timeStart: string;
  title: string;
  emoji: string;
  color: string;
  isRecurring: boolean;
  specificDate: string; // ISO date string for <input type="date">
}

const DEFAULT_FORM: FormState = {
  dayOfWeek: 0,
  timeStart: '08:00',
  title: '',
  emoji: '📅',
  color: '#4A90D9',
  isRecurring: true,
  specificDate: '',
};

// ── Date helpers (mirrors backend lib/scheduleDate.ts) ────────────────────────

function jsToEbbeDay(jsDay: number): number {
  return jsDay === 0 ? 6 : jsDay - 1;
}

function getWeekMonday(): Date {
  const now = new Date();
  const jsDay = now.getDay();
  const diff = jsDay === 0 ? -6 : 1 - jsDay;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getEffectiveDay(item: ScheduleItem, weekStart: Date): number {
  if (!item.specificDate) return item.dayOfWeek;
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  const anchor = new Date(item.specificDate);
  if (!item.isRecurring) {
    if (anchor >= weekStart && anchor < weekEnd) return jsToEbbeDay(anchor.getDay());
    return item.dayOfWeek;
  }
  const thisYear = weekStart.getFullYear();
  for (const year of [thisYear, thisYear + 1]) {
    const occurrence = new Date(year, anchor.getMonth(), anchor.getDate());
    if (occurrence >= weekStart && occurrence < weekEnd) return jsToEbbeDay(occurrence.getDay());
  }
  return item.dayOfWeek;
}

// ── ItemForm at module level — prevents focus loss on keystroke ───────────────

interface ItemFormProps {
  form: FormState;
  onChange: (form: FormState) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  submitLabel: string;
  onCancel: () => void;
}

function ItemForm({ form, onChange, onSubmit, submitLabel, onCancel }: ItemFormProps) {
  const { t } = useTranslation();

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="bg-white border border-gray-200 rounded-xl p-4 mb-6 flex flex-col gap-3">
      <div className="flex gap-3">
        <EmojiPicker value={form.emoji} onChange={(e) => onChange({ ...form, emoji: e })} />
        <input
          required
          placeholder={t('parent.schedule.titlePlaceholder')}
          value={form.title}
          onChange={(e) => onChange({ ...form, title: e.target.value })}
          className="flex-1 border rounded-lg px-3 py-2 text-sm"
        />
      </div>

      {/* Recurring toggle */}
      <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
        <input
          type="checkbox"
          checked={form.isRecurring}
          onChange={(e) => onChange({ ...form, isRecurring: e.target.checked, specificDate: '' })}
          className="w-4 h-4 rounded"
        />
        <span className="text-sm text-gray-700">{t('parent.schedule.recurring')}</span>
      </label>

      <div className="flex gap-3 flex-wrap">
        {form.isRecurring && !form.specificDate ? (
          /* Pure weekly: show weekday dropdown */
          <select
            value={form.dayOfWeek}
            onChange={(e) => onChange({ ...form, dayOfWeek: parseInt(e.target.value) })}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            {DAYS.map((d) => <option key={d} value={d}>{t(`child.schedule.days.${d}`)}</option>)}
          </select>
        ) : (
          /* Date-specific: show date picker */
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">
              {form.isRecurring ? t('parent.schedule.annualDate') : t('parent.schedule.specificDate')}
            </label>
            <input
              type="date"
              required={!form.isRecurring}
              value={form.specificDate}
              onChange={(e) => onChange({ ...form, specificDate: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm"
            />
            {form.isRecurring && (
              <button
                type="button"
                onClick={() => onChange({ ...form, specificDate: '' })}
                className="text-xs text-blue-600 hover:underline text-left"
              >
                {t('parent.schedule.clearDate')}
              </button>
            )}
          </div>
        )}

        {/* For recurring weekly items: offer optional annual date anchor */}
        {form.isRecurring && !form.specificDate && (
          <button
            type="button"
            onClick={() => onChange({ ...form, specificDate: new Date().toISOString().slice(0, 10) })}
            className="text-xs text-gray-400 hover:text-gray-600 border border-dashed border-gray-300 rounded-lg px-3 py-2"
          >
            + {t('parent.schedule.annualDate')}
          </button>
        )}

        <input
          type="time"
          value={form.timeStart}
          onChange={(e) => onChange({ ...form, timeStart: e.target.value })}
          className="border rounded-lg px-3 py-2 text-sm"
        />
        <input
          type="color"
          value={form.color}
          onChange={(e) => onChange({ ...form, color: e.target.value })}
          className="w-10 h-9 border rounded-lg cursor-pointer"
        />
      </div>

      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="text-sm text-gray-500 px-4 py-2 hover:bg-gray-50 rounded-lg">
          Cancel
        </button>
        <button type="submit" className="bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-800">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function Schedule() {
  const { t } = useTranslation();
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);

  async function load() {
    const res = await client.get<{ data: ScheduleItem[] }>('/schedule');
    setItems(res.data.data);
  }
  useEffect(() => { void load(); }, []);

  function startAdd() {
    setAdding(true);
    setEditId(null);
    setForm(DEFAULT_FORM);
  }

  function startEdit(item: ScheduleItem) {
    setEditId(item.id);
    setAdding(false);
    setForm({
      dayOfWeek: item.dayOfWeek,
      timeStart: item.timeStart,
      title: item.title,
      emoji: item.emoji,
      color: item.color,
      isRecurring: item.isRecurring,
      specificDate: item.specificDate
        ? new Date(item.specificDate).toISOString().slice(0, 10)
        : '',
    });
  }

  function cancelForm() {
    setAdding(false);
    setEditId(null);
    setForm(DEFAULT_FORM);
  }

  function buildPayload(f: FormState) {
    const specificDateMs = f.specificDate ? new Date(f.specificDate).getTime() : null;
    return {
      timeStart: f.timeStart,
      title: f.title,
      emoji: f.emoji,
      color: f.color,
      isRecurring: f.isRecurring,
      specificDate: specificDateMs,
      ...(specificDateMs === null && { dayOfWeek: f.dayOfWeek }),
    };
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    await client.post('/schedule', buildPayload(form));
    cancelForm();
    await load();
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editId) return;
    await client.patch(`/schedule/${editId}`, buildPayload(form));
    cancelForm();
    await load();
  }

  async function handleDelete(id: string) {
    await client.delete(`/schedule/${id}`);
    await load();
  }

  // Group items by effective day for the current week
  const weekStart = getWeekMonday();
  const byDay: Record<number, ScheduleItem[]> = {};
  for (const item of items) {
    const day = getEffectiveDay(item, weekStart);
    if (!byDay[day]) byDay[day] = [];
    byDay[day].push(item);
  }

  const editingItem = editId ? items.find(i => i.id === editId) : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800">{t('parent.nav.schedule')}</h1>
        {!adding && !editId && (
          <button
            onClick={startAdd}
            className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            + {t('parent.schedule.addItem')}
          </button>
        )}
      </div>

      {/* Add form */}
      {adding && (
        <ItemForm
          form={form}
          onChange={setForm}
          onSubmit={handleAdd}
          submitLabel={t('parent.tasks.save')}
          onCancel={cancelForm}
        />
      )}

      {/* Edit form — shown above the grid, outside the cell */}
      {editId && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            {t('parent.schedule.editItem')}: {editingItem?.emoji} {editingItem?.title}
          </p>
          <ItemForm
            form={form}
            onChange={setForm}
            onSubmit={handleEdit}
            submitLabel={t('parent.tasks.save')}
            onCancel={cancelForm}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-3">
        {DAYS.map((day) => (
          <div key={day} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-600 uppercase">{t(`child.schedule.days.${day}`)}</p>
            </div>
            <div className="p-2 flex flex-col gap-1 min-h-[80px]">
              {(byDay[day] ?? []).map((item) => (
                <div
                  key={item.id}
                  className={`rounded-md px-2 py-1.5 text-xs group cursor-pointer transition-opacity ${editId === item.id ? 'opacity-50 ring-2 ring-blue-400' : 'hover:opacity-80'}`}
                  style={{ backgroundColor: `${item.color}22`, borderLeft: `3px solid ${item.color}` }}
                  onClick={() => startEdit(item)}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span>{item.emoji}</span>
                    <span className="font-semibold text-gray-700">{item.timeStart}</span>
                    {!item.isRecurring && (
                      <span title={item.specificDate ? new Date(item.specificDate).toLocaleDateString() : ''} className="text-[9px] text-gray-400 leading-none">📅</span>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); void handleDelete(item.id); }}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 ml-auto"
                    >
                      ×
                    </button>
                  </div>
                  <div className="text-gray-700 mt-0.5 leading-tight">{item.title}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
