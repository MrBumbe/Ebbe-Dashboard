import { useTranslation } from 'react-i18next';

const MOODS = [
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
}

export default function MoodCheckIn({ cooldownEndsAt, onMood }: Props) {
  const { t } = useTranslation();

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
    <div className="bg-white/10 rounded-2xl px-4 py-4 xl:py-6">
      <p className="text-lg md:text-xl xl:text-2xl font-medium mb-4 text-center">
        {t('child.mood.prompt')}
      </p>
      <div className="flex flex-wrap justify-center gap-3 xl:gap-4">
        {MOODS.map(({ id, emoji }) => (
          <button
            key={id}
            onClick={() => void onMood(id)}
            className="flex flex-col items-center justify-center min-w-[60px] min-h-[60px] xl:min-w-[80px] xl:min-h-[80px] bg-white/10 hover:bg-white/25 active:scale-95 rounded-2xl px-3 py-2 xl:px-4 xl:py-3 transition-all"
          >
            <span className="text-3xl xl:text-4xl">{emoji}</span>
            <span className="text-xs xl:text-sm mt-1 opacity-80">
              {t(`child.mood.${id}`)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
