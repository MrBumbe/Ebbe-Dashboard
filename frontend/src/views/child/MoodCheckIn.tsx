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
  alreadyLogged: boolean;
  onMood: (mood: string) => Promise<void>;
}

export default function MoodCheckIn({ alreadyLogged, onMood }: Props) {
  const { t } = useTranslation();

  if (alreadyLogged) {
    return (
      <div className="bg-white/10 rounded-2xl px-6 py-4 xl:py-6 text-center">
        <p className="text-xl xl:text-2xl">😊 {t('child.mood.prompt').replace('?', '')} ✓</p>
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
            onClick={() => onMood(id)}
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
