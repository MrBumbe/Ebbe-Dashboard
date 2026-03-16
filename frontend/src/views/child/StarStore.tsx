import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { RewardItem } from '../../api/child';

interface Props {
  balance: number;
  rewards: RewardItem[];
  onRequest: (rewardId: string) => Promise<void>;
  onClose: () => void;
  accentColor?: string;
}

const INACTIVITY_MS = 45_000;

export default function StarStore({ balance, rewards, onRequest, onClose, accentColor }: Props) {
  const { t } = useTranslation();
  const [requested, setRequested] = useState<Set<string>>(new Set());
  const [requesting, setRequesting] = useState<string | null>(null);
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

  async function handleRequest(rewardId: string) {
    resetTimer();
    if (requesting || requested.has(rewardId)) return;
    setRequesting(rewardId);
    try {
      await onRequest(rewardId);
      setRequested(prev => new Set([...prev, rewardId]));
    } catch {
      // Already requested or error — silently mark as requested
      setRequested(prev => new Set([...prev, rewardId]));
    } finally {
      setRequesting(null);
    }
  }

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
        <div className="flex-1">
          <h1 className="text-2xl xl:text-3xl font-bold">{t('child.store.title')}</h1>
          <p className="text-sm xl:text-base opacity-75">{t('child.store.balance', { count: balance })}</p>
        </div>
        <div className="text-3xl xl:text-5xl font-bold tabular-nums flex items-center gap-2">
          <span>⭐</span>
          <span>{balance}</span>
        </div>
      </div>

      {/* Reward list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 xl:px-8 xl:py-6">
        {rewards.length === 0 ? (
          <p className="text-center opacity-60 text-lg mt-12">{t('child.store.empty')}</p>
        ) : (
          <div className="flex flex-col gap-3 xl:gap-4 max-w-2xl mx-auto">
            {rewards.map((r) => {
              const canAfford = balance >= r.starCost;
              const isRequested = requested.has(r.id);
              const isLoading = requesting === r.id;

              return (
                <div
                  key={r.id}
                  className="flex items-center gap-4 bg-white/10 rounded-2xl px-5 py-4 xl:py-5"
                >
                  <span className="text-4xl xl:text-5xl flex-shrink-0">{r.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg xl:text-xl font-semibold leading-tight">{r.title}</p>
                    <p className="text-sm xl:text-base opacity-75 mt-0.5">
                      {r.starCost} ⭐
                    </p>
                  </div>
                  <button
                    onClick={() => void handleRequest(r.id)}
                    disabled={!canAfford || isRequested || isLoading}
                    className={`
                      flex-shrink-0 min-w-[120px] xl:min-w-[140px] min-h-[52px] xl:min-h-[60px]
                      px-4 py-2 rounded-xl font-semibold text-sm xl:text-base transition-all
                      ${isRequested
                        ? 'bg-green-500/60 text-white cursor-default'
                        : !canAfford
                          ? 'bg-white/10 text-white/40 cursor-not-allowed'
                          : 'bg-white text-gray-800 hover:bg-white/90 active:scale-95'
                      }
                    `}
                  >
                    {isLoading ? '...' : isRequested ? `✓ ${t('child.store.requested')}` : t('child.store.want')}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Inactivity hint */}
      <p className="text-center text-xs opacity-40 py-3">{t('child.store.autoClose', { seconds: countdown })}</p>
    </div>
  );
}
