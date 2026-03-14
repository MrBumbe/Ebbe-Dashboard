import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/useAuthStore';
import { connectParentWs } from '../../api/websocket';

export default function Timer() {
  const { t } = useTranslation();
  const accessToken = useAuthStore((s) => s.accessToken);
  const wsRef = useRef<WebSocket | null>(null);
  const [minutes, setMinutes] = useState(5);
  const [label, setLabel] = useState('');
  const [active, setActive] = useState(false);
  const [connected, setConnected] = useState(false);

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

  function handleSend() {
    send({ type: 'TRIGGER_TIMER', payload: { seconds: minutes * 60, label } });
    setActive(true);
  }

  function handleCancel() {
    send({ type: 'CANCEL_TIMER' });
    setActive(false);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">{t('parent.timer.title')}</h1>
      <p className="text-sm text-gray-500 mb-6">
        {connected ? '🟢 Connected to screen' : '🔴 Not connected'}
      </p>

      <div className="bg-white rounded-xl border border-gray-100 p-6 max-w-md flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('parent.timer.label')}</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Dinner"
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('parent.timer.minutes')}</label>
          <div className="flex items-center gap-3">
            {[2, 5, 10, 15, 30].map((m) => (
              <button
                key={m}
                onClick={() => setMinutes(m)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${minutes === m ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSend}
            disabled={!connected || !label}
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {t('parent.timer.send')}
          </button>
          {active && (
            <button
              onClick={handleCancel}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2.5 rounded-lg transition-colors"
            >
              {t('parent.timer.cancel')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
