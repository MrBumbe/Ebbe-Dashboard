import { useTranslation } from 'react-i18next';

const ALL_MOODS = [
  { id: 'happy',   emoji: '😄' },
  { id: 'okay',    emoji: '🙂' },
  { id: 'sad',     emoji: '😔' },
  { id: 'angry',   emoji: '😡' },
  { id: 'tired',   emoji: '😴' },
  { id: 'excited', emoji: '🤩' },
  { id: 'anxious', emoji: '😰' },
] as const;

interface Props {
  cooldownEndsAt: number | null;
  onMood: (mood: string) => Promise<void>;
  activeMoods?: string[]; // which moods to show; undefined = all
}

export default function MoodCheckIn({ cooldownEndsAt, onMood, activeMoods }: Props) {
  const { t } = useTranslation();

  const moods = activeMoods
    ? ALL_MOODS.filter(m => activeMoods.includes(m.id))
    : ALL_MOODS;

  const isCoolingDown = cooldownEndsAt !== null && Date.now() < cooldownEndsAt;

  if (isCoolingDown) {
    const minutesLeft = Math.ceil((cooldownEndsAt! - Date.now()) / 60000);
    return (
      <div className="bg-white/10 rounded-2xl px-6 py-4 xl:py-6 text-center">
        <p className="text-2xl mb-1">😊</p>
        <p className="text-lg xl:text-xl font-medium">{t('child.mood.logged')}</p>
        <p className="text-sm xl:text-base opacity-70 mt-1">
          {minutesLeft <= 1
            ? t('child.mood.cooldownSoon')
            : t('child.mood.cooldownMinutes', { minutes: minutesLeft })}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/10 rounded-2xl px-3 py-3 xl:py-5">
      <p className="text-base md:text-lg xl:text-xl font-medium mb-3 text-center">
        {t('child.mood.prompt')}
      </p>
      {/* Single row — all moods fit at any supported width using flex-1 */}
      <div className="flex gap-1 xl:gap-2">
        {moods.map(({ id, emoji }) => (
          <button
            key={id}
            onClick={() => void onMood(id)}
            className="flex-1 flex flex-col items-center justify-center min-h-[60px] xl:min-h-[80px] bg-white/10 hover:bg-white/25 active:scale-95 rounded-xl py-2 transition-all"
          >
            <span className="text-2xl xl:text-3xl leading-none">{emoji}</span>
            <span className="text-[9px] xl:text-xs mt-0.5 opacity-80 leading-tight text-center px-0.5">
              {t(`child.mood.${id}`)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
