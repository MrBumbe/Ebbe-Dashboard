import { useTranslation } from 'react-i18next';

interface Props {
  balance: number;
}

export default function RewardDisplay({ balance }: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center gap-1 bg-white/10 rounded-2xl px-6 py-4 xl:py-6">
      <div className="text-4xl md:text-5xl xl:text-7xl">⭐</div>
      <div className="text-3xl md:text-4xl xl:text-6xl font-bold tabular-nums">{balance}</div>
      <div className="text-sm md:text-base xl:text-lg opacity-80">{t('child.stars.label')}</div>
    </div>
  );
}
