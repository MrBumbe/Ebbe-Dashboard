import { useTranslation } from 'react-i18next';

interface Props {
  balance: number;
  storeEnabled?: boolean;
  historyEnabled?: boolean;
  onTap?: () => void;
  compact?: boolean;
}

export default function RewardDisplay({ balance, storeEnabled, historyEnabled, onTap, compact }: Props) {
  const { t } = useTranslation();
  const tappable = (storeEnabled || historyEnabled) && onTap;

  const inner = (
    <>
      <div className={compact ? 'text-2xl xl:text-3xl' : 'text-4xl md:text-5xl xl:text-7xl'}>⭐</div>
      <div className={`font-bold tabular-nums ${compact ? 'text-2xl xl:text-3xl' : 'text-3xl md:text-4xl xl:text-6xl'}`}>
        {balance}
      </div>
      {!compact && (
        <div className="text-sm md:text-base xl:text-lg opacity-80">{t('child.stars.label')}</div>
      )}
      {tappable && !compact && (
        <div className="text-xs opacity-50 mt-1">{t('child.stars.tapToOpen')}</div>
      )}
    </>
  );

  if (tappable) {
    return (
      <button
        onClick={onTap}
        className={`flex flex-col items-center bg-white/10 hover:bg-white/20 active:scale-95 rounded-2xl transition-all w-full ${compact ? 'px-3 py-2' : 'px-6 py-4 xl:py-6'}`}
      >
        {inner}
      </button>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-1 bg-white/10 rounded-2xl ${compact ? 'px-3 py-2' : 'px-6 py-4 xl:py-6'}`}>
      {inner}
    </div>
  );
}
