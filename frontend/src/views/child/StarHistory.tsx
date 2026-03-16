import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TransactionItem } from '../../api/child';

interface Props {
  transactions: TransactionItem[];
  onClose: () => void;
  accentColor?: string;
}

const INACTIVITY_MS = 45_000;

export default function StarHistory({ transactions, onClose, accentColor }: Props) {
  const { t } = useTranslation();
  const [countdown, setCountdown] = useState(45);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function resetTimer() {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    closeTimerRef.current = setTimeout(onClose, INACTIVITY_MS);
    setCountdown(45);
    countdownIntervalRef.current = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
  }

  useEffect(() => {
    resetTimer();
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col text-white"
      style={{ background: `linear-gradient(135deg, ${accentColor ?? '#1565C0'}ee 0%, ${accentColor ?? '#1565C0'}99 100%)` }}
      onPointerMove={resetTimer}
      onPointerDown={resetTimer}
    >
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-5 border-b border-white/20">
        <button
          onClick={onClose}
          className="min-w-[48px] min-h-[48px] flex items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20 text-2xl transition-all"
        >
          ←
        </button>
        <h1 className="text-2xl xl:text-3xl font-bold">{t('child.history.title')}</h1>
      </div>

      {/* Transaction list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 xl:px-8 xl:py-6">
        {transactions.length === 0 ? (
          <p className="text-center opacity-60 text-lg mt-12">{t('child.history.empty')}</p>
        ) : (
          <div className="flex flex-col gap-2 xl:gap-3 max-w-2xl mx-auto">
            {transactions.map((tx) => {
              const isEarn = tx.type === 'earn';
              const date = new Date(tx.createdAt);
              const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });

              return (
                <div
                  key={tx.id}
                  className="flex items-center gap-4 bg-white/10 rounded-2xl px-4 py-3 xl:py-4"
                >
                  <span className="text-2xl xl:text-3xl flex-shrink-0">
                    {isEarn ? '⭐' : tx.description.startsWith('Redeemed:') ? '🎁' : '✂️'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-base xl:text-lg font-medium leading-tight truncate">
                      {tx.description}
                    </p>
                    <p className="text-xs xl:text-sm opacity-60 mt-0.5">{dateStr}</p>
                  </div>
                  <span className={`text-lg xl:text-xl font-bold flex-shrink-0 ${isEarn ? 'text-yellow-300' : 'text-red-300'}`}>
                    {isEarn ? '+' : '-'}{tx.amount} ⭐
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-center text-xs opacity-40 py-3">{t('child.history.autoClose', { seconds: countdown })}</p>
    </div>
  );
}
