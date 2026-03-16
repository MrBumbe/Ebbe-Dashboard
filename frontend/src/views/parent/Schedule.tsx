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
}

const DAYS = [0, 1, 2, 3, 4, 5, 6];
const DEFAULT_FORM = { dayOfWeek: 0, timeStart: '08:00', title: '', emoji: '📅', color: '#4A90D9' };

export default function Schedule() {
  const { t } = useTranslation();
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(DEFAULT_FORM);

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
    setForm({ dayOfWeek: item.dayOfWeek, timeStart: item.timeStart, title: item.title, emoji: item.emoji, color: item.color });
  }

  function cancelForm() {
    setAdding(false);
    setEditId(null);
    setForm(DEFAULT_FORM);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    await client.post('/schedule', form);
    cancelForm();
    await load();
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editId) return;
    await client.patch(`/schedule/${editId}`, form);
    cancelForm();
    await load();
  }

  async function handleDelete(id: string) {
    await client.delete(`/schedule/${id}`);
    await load();
  }

  const byDay: Record<number, ScheduleItem[]> = {};
  for (const item of items) {
    if (!byDay[item.dayOfWeek]) byDay[item.dayOfWeek] = [];
    byDay[item.dayOfWeek].push(item);
  }

  function ItemForm({ onSubmit, submitLabel }: { onSubmit: (e: React.FormEvent) => Promise<void>; submitLabel: string }) {
    return (
      <form onSubmit={(e) => void onSubmit(e)} className="bg-white border border-gray-200 rounded-xl p-4 mb-6 flex flex-col gap-3">
        <div className="flex gap-3">
          <EmojiPicker value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e })} />
          <input
            required
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="flex-1 border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div className="flex gap-3 flex-wrap">
          <select
            value={form.dayOfWeek}
            onChange={(e) => setForm({ ...form, dayOfWeek: parseInt(e.target.value) })}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            {DAYS.map((d) => <option key={d} value={d}>{t(`child.schedule.days.${d}`)}</option>)}
          </select>
          <input
            type="time"
            value={form.timeStart}
            onChange={(e) => setForm({ ...form, timeStart: e.target.value })}
            className="border rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="color"
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
            className="w-10 h-9 border rounded-lg cursor-pointer"
          />
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={cancelForm} className="text-sm text-gray-500 px-4 py-2 hover:bg-gray-50 rounded-lg">
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
        <h1 className="text-2xl font-bold text-gray-800">{t('parent.nav.schedule')}</h1>
        {!adding && !editId && (
          <button
            onClick={startAdd}
            className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            + Add item
          </button>
        )}
      </div>

      {adding && <ItemForm onSubmit={handleAdd} submitLabel={t('parent.tasks.save')} />}

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-3">
        {DAYS.map((day) => (
          <div key={day} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-600 uppercase">{t(`child.schedule.days.${day}`)}</p>
            </div>
            <div className="p-2 flex flex-col gap-1 min-h-[80px]">
              {(byDay[day] ?? []).map((item) => (
                editId === item.id ? (
                  <div key={item.id} className="col-span-full">
                    <ItemForm onSubmit={handleEdit} submitLabel={t('parent.tasks.save')} />
                  </div>
                ) : (
                  <div
                    key={item.id}
                    className="rounded-md px-2 py-1.5 text-xs group cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: `${item.color}22`, borderLeft: `3px solid ${item.color}` }}
                    onClick={() => startEdit(item)}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>{item.emoji}</span>
                      <span className="font-semibold text-gray-700">{item.timeStart}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); void handleDelete(item.id); }}
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 ml-auto"
                      >
                        ×
                      </button>
                    </div>
                    <div className="text-gray-700 mt-0.5 leading-tight">{item.title}</div>
                  </div>
                )
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
