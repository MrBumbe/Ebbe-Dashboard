import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import client from '../../api/client';

interface EventItem {
  id: string;
  title: string;
  emoji: string;
  eventDate: number;
  isVisible: boolean;
}

export default function Events() {
  const { t } = useTranslation();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: '', emoji: '🎉', eventDate: '', isVisible: true });

  async function loadEvents() {
    try {
      const res = await client.get<{ data: EventItem[] }>('/events');
      setEvents(res.data.data);
    } catch { /* ignore */ }
  }

  useEffect(() => { void loadEvents(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    await client.post('/events', {
      title: form.title,
      emoji: form.emoji,
      eventDate: new Date(form.eventDate).getTime(),
      isVisible: form.isVisible,
    });
    setAdding(false);
    setForm({ title: '', emoji: '🎉', eventDate: '', isVisible: true });
    await loadEvents();
  }

  async function handleDelete(id: string) {
    await client.delete(`/events/${id}`);
    await loadEvents();
  }

  async function handleToggleVisible(ev: EventItem) {
    await client.patch(`/events/${ev.id}`, { isVisible: !ev.isVisible });
    await loadEvents();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('parent.nav.events')}</h1>
        <button
          onClick={() => setAdding(true)}
          className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          + Add event
        </button>
      </div>

      {adding && (
        <form onSubmit={(e) => void handleAdd(e)} className="bg-white border border-gray-200 rounded-xl p-4 mb-6 flex flex-col gap-3">
          <div className="flex gap-3">
            <input
              placeholder="🎉"
              value={form.emoji}
              onChange={(e) => setForm({ ...form, emoji: e.target.value })}
              className="w-16 border rounded-lg px-2 py-2 text-center text-lg"
            />
            <input
              required
              placeholder="Event name"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-3 items-center">
            <input
              required
              type="date"
              value={form.eventDate}
              onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm"
            />
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isVisible}
                onChange={(e) => setForm({ ...form, isVisible: e.target.checked })}
                className="rounded"
              />
              Show on child screen
            </label>
          </div>
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
        {events.map((ev) => {
          const date = new Date(ev.eventDate);
          const daysLeft = Math.ceil((ev.eventDate - Date.now()) / 86400000);
          return (
            <div key={ev.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
              <span className="text-xl">{ev.emoji}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{ev.title}</p>
                <p className="text-xs text-gray-400">{date.toLocaleDateString()} · {daysLeft > 0 ? `in ${daysLeft} days` : 'today!'}</p>
              </div>
              <button
                onClick={() => void handleToggleVisible(ev)}
                className={`text-xs px-2 py-1 rounded-md ${ev.isVisible ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
              >
                {ev.isVisible ? 'Visible' : 'Hidden'}
              </button>
              <button onClick={() => void handleDelete(ev.id)} className="text-xs text-red-400 hover:text-red-600 px-2 py-1">
                {t('parent.tasks.delete')}
              </button>
            </div>
          );
        })}
        {events.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">No upcoming events.</p>
        )}
      </div>
    </div>
  );
}
