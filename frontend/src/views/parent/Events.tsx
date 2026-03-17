import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import client from '../../api/client';
import EmojiPicker from '../../components/EmojiPicker';
import { tw } from '../../lib/theme';
import { useAuthStore } from '../../store/useAuthStore';

interface EventItem {
  id: string;
  title: string;
  emoji: string;
  eventDate: number;
  isVisible: boolean;
  childId: string | null;
}

interface ChildInfo {
  id: string;
  name: string;
  emoji: string;
}

export default function Events() {
  const { t } = useTranslation();
  const { activeChildId } = useAuthStore();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [children, setChildren] = useState<ChildInfo[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: '', emoji: '🎉', eventDate: '', isVisible: true, childId: '' });

  useEffect(() => {
    client.get<{ data: ChildInfo[] }>('/children')
      .then((res) => setChildren(res.data.data))
      .catch(() => null);
  }, []);

  async function loadEvents() {
    try {
      const res = await client.get<{ data: EventItem[] }>('/events');
      setEvents(res.data.data);
    } catch { /* ignore */ }
  }

  useEffect(() => { void loadEvents(); }, [activeChildId]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    await client.post('/events', {
      title: form.title,
      emoji: form.emoji,
      eventDate: new Date(form.eventDate).getTime(),
      isVisible: form.isVisible,
      childId: form.childId || null,
    });
    setAdding(false);
    setForm({ title: '', emoji: '🎉', eventDate: '', isVisible: true, childId: '' });
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

  function childName(childId: string | null) {
    if (!childId) return null;
    return children.find(c => c.id === childId)?.name ?? null;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className={tw.pageHeading}>{t('parent.nav.events')}</h1>
        <button
          onClick={() => setAdding(true)}
          className={tw.btnPrimary}
        >
          + Add event
        </button>
      </div>

      {adding && (
        <form onSubmit={(e) => void handleAdd(e)} className={`${tw.formCard} mb-6`}>
          <div className="flex gap-3">
            <EmojiPicker value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e })} />
            <input
              required
              placeholder="Event name"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={`flex-1 ${tw.input}`}
            />
          </div>
          <div className="flex gap-3 items-center flex-wrap">
            <input
              required
              type="date"
              value={form.eventDate}
              onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
              className={tw.input}
            />
            <label className={`flex items-center gap-2 text-sm ${tw.secondary} cursor-pointer`}>
              <input
                type="checkbox"
                checked={form.isVisible}
                onChange={(e) => setForm({ ...form, isVisible: e.target.checked })}
                className="rounded"
              />
              Show on child screen
            </label>
          </div>
          {/* Assign to child (optional — empty = whole family) */}
          <div className="flex items-center gap-2">
            <label className={`text-sm ${tw.secondary} whitespace-nowrap`}>Assign to</label>
            <select
              value={form.childId}
              onChange={(e) => setForm({ ...form, childId: e.target.value })}
              className={tw.select}
            >
              <option value="">Everyone (whole family)</option>
              {children.map(c => (
                <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setAdding(false)} className={tw.btnCancel}>
              Cancel
            </button>
            <button type="submit" className={tw.btnPrimary}>
              {t('parent.tasks.save')}
            </button>
          </div>
        </form>
      )}

      <div className={`${tw.card} ${tw.cardDivide}`}>
        {events.map((ev) => {
          const date = new Date(ev.eventDate);
          const daysLeft = Math.ceil((ev.eventDate - Date.now()) / 86400000);
          const assignedTo = childName(ev.childId);
          return (
            <div key={ev.id} className={`flex items-center gap-3 px-4 py-3 ${tw.listRow}`}>
              <span className="text-xl">{ev.emoji}</span>
              <div className="flex-1">
                <p className={`text-sm font-medium ${tw.body}`}>{ev.title}</p>
                <p className={tw.muted}>
                  {date.toLocaleDateString()} · {daysLeft > 0 ? `in ${daysLeft} days` : 'today!'}
                  {assignedTo && <span className="ml-2">· {assignedTo}</span>}
                </p>
              </div>
              <button
                onClick={() => void handleToggleVisible(ev)}
                className={ev.isVisible ? tw.badgeGreen : tw.badgeGray}
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
          <p className={`${tw.muted} text-sm text-center py-6`}>No upcoming events.</p>
        )}
      </div>
    </div>
  );
}
