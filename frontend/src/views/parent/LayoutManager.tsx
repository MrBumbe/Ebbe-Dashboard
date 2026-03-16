import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import client from '../../api/client';

interface LayoutEntry {
  pageNumber: number;
  widgetId: string;
  order: number;
  isEnabled: boolean;
  config: string;
}

const HEADER_ONLY_WIDGETS = new Set(['clock', 'star-balance', 'weather']);

const WIDGET_LABELS: Record<string, string> = {
  'clock':           '🕐 Clock',
  'star-balance':    '⭐ Star Balance',
  'weather':         '🌤️ Weather',
  'routine-morning': '🌅 Morning Routine',
  'routine-evening': '🌙 Evening Routine',
  'routine-custom':  '📋 Custom Routine',
  'week-schedule':   '📅 Week Schedule',
  'upcoming-event':  '🎉 Upcoming Event',
  'mood-checkin':    '😊 Mood Check-in',
  'timer-display':   '⏱️ Timer',
};

export default function LayoutManager() {
  const { t } = useTranslation();
  const [layout, setLayout] = useState<LayoutEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function load() {
    const res = await client.get<{ data: LayoutEntry[] }>('/layouts');
    setLayout(res.data.data);
  }

  useEffect(() => { void load(); }, []);

  function pages(): number[] {
    const nums = [...new Set(layout.map(e => e.pageNumber))].sort((a, b) => a - b);
    return nums.length ? nums : [1];
  }

  function entriesForPage(page: number) {
    return layout
      .filter(e => e.pageNumber === page && !HEADER_ONLY_WIDGETS.has(e.widgetId))
      .sort((a, b) => a.order - b.order);
  }

  function toggleWidget(widgetId: string) {
    setLayout(l => l.map(e => e.widgetId === widgetId ? { ...e, isEnabled: !e.isEnabled } : e));
  }

  function moveWidget(widgetId: string, direction: 'up' | 'down') {
    const entry = layout.find(e => e.widgetId === widgetId);
    if (!entry) return;
    const pageEntries = entriesForPage(entry.pageNumber);
    const idx = pageEntries.findIndex(e => e.widgetId === widgetId);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= pageEntries.length) return;
    const swapEntry = pageEntries[swapIdx];
    setLayout(l => l.map(e => {
      if (e.widgetId === widgetId) return { ...e, order: swapEntry.order };
      if (e.widgetId === swapEntry.widgetId) return { ...e, order: entry.order };
      return e;
    }));
  }

  function setPage(widgetId: string, page: number) {
    setLayout(l => l.map(e => e.widgetId === widgetId ? { ...e, pageNumber: page } : e));
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await client.put('/layouts', layout);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  const pageList = pages();
  const maxPage = Math.max(...pageList);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('parent.layout.title')}</h1>
        <button
          onClick={() => void handleSave()}
          disabled={saving}
          className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          {saved ? '✓ Saved' : saving ? '...' : t('parent.tasks.save')}
        </button>
      </div>

      <p className="text-sm text-gray-500 mb-2">{t('parent.layout.hint')}</p>
      <p className="text-sm text-gray-400 mb-6">Clock, weather, and star balance are always shown in the page header.</p>

      {pageList.map(page => (
        <div key={page} className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
            {t('parent.layout.page', { number: page })}
          </h2>
          <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
            {entriesForPage(page).map((entry, idx, arr) => (
              <div key={entry.widgetId} className="flex items-center gap-3 px-4 py-3">
                {/* Enabled toggle */}
                <input
                  type="checkbox"
                  checked={entry.isEnabled}
                  onChange={() => toggleWidget(entry.widgetId)}
                  className="rounded"
                />

                {/* Label */}
                <span className={`flex-1 text-sm font-medium ${entry.isEnabled ? 'text-gray-800' : 'text-gray-400'}`}>
                  {WIDGET_LABELS[entry.widgetId] ?? entry.widgetId}
                </span>

                {/* Page selector */}
                <select
                  value={entry.pageNumber}
                  onChange={(e) => setPage(entry.widgetId, parseInt(e.target.value))}
                  className="border rounded px-2 py-1 text-xs text-gray-600"
                >
                  {Array.from({ length: maxPage + 1 }, (_, i) => i + 1).map(p => (
                    <option key={p} value={p}>{t('parent.layout.page', { number: p })}</option>
                  ))}
                </select>

                {/* Reorder */}
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveWidget(entry.widgetId, 'up')}
                    disabled={idx === 0}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-20 text-xs leading-none px-1"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveWidget(entry.widgetId, 'down')}
                    disabled={idx === arr.length - 1}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-20 text-xs leading-none px-1"
                  >
                    ▼
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
