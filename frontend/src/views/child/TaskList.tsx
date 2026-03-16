import { useTranslation } from 'react-i18next';
import type { TaskItem } from '../../api/child';

interface Props {
  tasks: TaskItem[];
  routine: 'morning' | 'evening' | 'custom';
  onComplete: (taskId: string) => Promise<void>;
  compact?: boolean;
}

export default function TaskList({ tasks, routine, onComplete, compact }: Props) {
  const { t } = useTranslation();

  const filtered = tasks.filter((t) => t.routine === routine);
  const done = filtered.filter((t) => t.isCompletedToday).length;
  const total = filtered.length;
  const allDone = done === total && total > 0;

  if (total === 0) return null;

  function routineLabel(): string {
    if (routine === 'morning') return t('child.tasks.morning');
    if (routine === 'evening') return t('child.tasks.evening');
    // For custom: find the first task's routineName, or fall back to 'Custom'
    const first = tasks.find(t => t.routine === 'custom');
    return first?.routineName ?? t('child.tasks.custom');
  }

  return (
    <div className={`bg-white/10 rounded-2xl flex flex-col ${compact ? 'p-3 gap-2 xl:p-4 xl:gap-3' : 'p-4 gap-3 xl:p-6 xl:gap-4'}`}>
      <div className="flex items-center justify-between">
        <h2 className={`font-bold ${compact ? 'text-base xl:text-xl' : 'text-xl md:text-2xl xl:text-3xl'}`}>
          {routineLabel()}
        </h2>
        {!allDone && (
          <span className={`opacity-75 ${compact ? 'text-xs' : 'text-sm xl:text-base'}`}>
            {t('child.tasks.progress', { done, total })}
          </span>
        )}
      </div>

      {allDone ? (
        <p className={`text-center py-2 ${compact ? 'text-base xl:text-lg' : 'text-xl xl:text-2xl py-4'}`}>
          {t('child.tasks.allDone')}
        </p>
      ) : (
        <ul className={`flex flex-col ${compact ? 'gap-1.5 xl:gap-2' : 'gap-2 xl:gap-3'}`}>
          {filtered.map((task) => (
            <li key={task.id}>
              <button
                onClick={() => !task.isCompletedToday && onComplete(task.id)}
                disabled={task.isCompletedToday}
                className={`
                  w-full flex items-center gap-3 rounded-xl px-4 text-left transition-all
                  ${compact ? 'min-h-[52px] xl:min-h-[60px]' : 'min-h-[64px] xl:min-h-[80px]'}
                  ${task.isCompletedToday
                    ? 'bg-green-500/40 border-2 border-green-400'
                    : 'bg-white/10 hover:bg-white/20 active:scale-98 border-2 border-transparent'
                  }
                `}
              >
                <span className={`flex-shrink-0 ${compact ? 'text-2xl xl:text-3xl' : 'text-3xl xl:text-4xl'}`}>{task.emoji}</span>
                <span className={`flex-1 font-medium ${compact ? 'text-base xl:text-lg' : 'text-lg xl:text-2xl'} ${task.isCompletedToday ? 'line-through opacity-60' : ''}`}>
                  {task.title}
                </span>
                <span className={`flex-shrink-0 rounded-full border-2 border-white/40 flex items-center justify-center ${compact ? 'w-6 h-6 xl:w-8 xl:h-8' : 'w-8 h-8 xl:w-10 xl:h-10'}`}>
                  {task.isCompletedToday
                    ? <span className="text-green-300 text-lg">✓</span>
                    : <span className="opacity-30 text-sm">○</span>
                  }
                </span>
                {task.isCompletedToday && (
                  <span className={`opacity-70 ${compact ? 'text-xs' : 'text-sm xl:text-base'}`}>+{task.starValue}⭐</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
