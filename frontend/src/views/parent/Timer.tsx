import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/useAuthStore';
import { connectParentWs } from '../../api/websocket';
import EmojiPicker from '../../components/EmojiPicker';
import { tw } from '../../lib/theme';

const PRESETS = [2, 5, 10, 15, 30];

export default function Timer() {
  const { t } = useTranslation();
  const accessToken = useAuthStore((s) => s.accessToken);
  const wsRef = useRef<WebSocket | null>(null);

  const [minutes, setMinutes] = useState<number | ''>(5);
  const [customInput, setCustomInput] = useState('');
  const [labelEmoji, setLabelEmoji] = useState('⏰');
  const [labelText, setLabelText] = useState('');
  const [active, setActive] = useState(false);
  const [connected, setConnected] = useState(false);
  const [clockTarget, setClockTarget] = useState('');

  useEffect(() => {
    if (!accessToken) return;
    const ws = connectParentWs(accessToken);
    wsRef.current = ws;
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    return () => ws.close();
  }, [accessToken]);

  function send(payload: object) {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  }

  // Calculate minutes from a clock-time target (e.g. "13:45")
  function minutesFromClockTarget(target: string): number {
    const [h, m] = target.split(':').map(Number);
    const now = new Date();
    const targetMs = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0).getTime();
    const diff = targetMs - now.getTime();
    return Math.max(1, Math.ceil(diff / 60000));
  }

  function handlePreset(m: number) {
    setMinutes(m);
    setCustomInput('');
    setClockTarget('');
  }

  function handleCustomInput(v: string) {
    setCustomInput(v);
    setClockTarget('');
    const n = parseInt(v);
    if (!isNaN(n) && n > 0) setMinutes(n);
    else setMinutes('');
  }

  function handleClockTarget(v: string) {
    setClockTarget(v);
    setCustomInput('');
    if (v) {
      const m = minutesFromClockTarget(v);
      setMinutes(m);
    }
  }

  const fullLabel = `${labelEmoji} ${labelText}`.trim();

  function handleSend() {
    const mins = typeof minutes === 'number' ? minutes : 0;
    if (!mins || !fullLabel) return;
    send({ type: 'TRIGGER_TIMER', payload: { seconds: mins * 60, label: fullLabel } });
    setActive(true);
  }

  function handleCancel() {
    send({ type: 'CANCEL_TIMER' });
    setActive(false);
  }

  const selectedPreset = typeof minutes === 'number' && PRESETS.includes(minutes) && !customInput && !clockTarget
    ? minutes
    : null;

  return (
    <div>
      <h1 className={`${tw.pageHeading} mb-2`}>{t('parent.timer.title')}</h1>
      <p className={`${tw.secondary} mb-6`}>
        {connected ? '🟢 Connected to screen' : '🔴 Not connected'}
      </p>

      <div className={`${tw.card} p-6 max-w-md flex flex-col gap-5`}>

        {/* Label with emoji picker */}
        <div>
          <label className={`block ${tw.labelMd} mb-1`}>{t('parent.timer.label')}</label>
          <div className="flex gap-2">
            <EmojiPicker value={labelEmoji} onChange={setLabelEmoji} />
            <input
              type="text"
              value={labelText}
              onChange={(e) => setLabelText(e.target.value)}
              placeholder="Dinner, Bedtime…"
              className={`flex-1 ${tw.input}`}
            />
          </div>
          {fullLabel && (
            <p className={`${tw.muted} mt-1`}>Preview: <span className={`font-medium ${tw.secondary}`}>{fullLabel}</span></p>
          )}
        </div>

        {/* Duration — presets */}
        <div>
          <label className={`block ${tw.labelMd} mb-2`}>{t('parent.timer.minutes')}</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {PRESETS.map((m) => (
              <button
                key={m}
                onClick={() => handlePreset(m)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedPreset === m ? 'bg-blue-700 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
              >
                {m} min
              </button>
            ))}
          </div>

          {/* Custom minute input */}
          <div className="flex gap-2 items-center mb-2">
            <input
              type="number"
              min={1}
              max={240}
              value={customInput}
              onChange={(e) => handleCustomInput(e.target.value)}
              placeholder="Custom mins"
              className={`w-32 ${tw.input}`}
            />
            <span className={tw.muted}>minutes</span>
          </div>

          {/* Set by clock time */}
          <div className="flex gap-2 items-center">
            <input
              type="time"
              value={clockTarget}
              onChange={(e) => handleClockTarget(e.target.value)}
              className={tw.input}
            />
            <span className={tw.muted}>
              {clockTarget && typeof minutes === 'number'
                ? `→ ${minutes} min from now`
                : 'set end time'}
            </span>
          </div>
        </div>

        {/* Duration summary */}
        {typeof minutes === 'number' && minutes > 0 && (
          <p className="text-sm text-blue-700 dark:text-blue-400 font-medium -mt-2">
            Timer: {minutes} {minutes === 1 ? 'minute' : 'minutes'}
          </p>
        )}

        {/* Send / Cancel */}
        <div className="flex gap-3">
          <button
            onClick={handleSend}
            disabled={!connected || !fullLabel || !minutes}
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {t('parent.timer.send')}
          </button>
          {active && (
            <button
              onClick={handleCancel}
              className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold py-2.5 rounded-lg transition-colors"
            >
              {t('parent.timer.cancel')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
