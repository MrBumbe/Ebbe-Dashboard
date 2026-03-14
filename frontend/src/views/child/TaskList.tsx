import { useTranslation } from 'react-i18next';
import type { TaskItem } from '../../api/child';

interface Props {
  tasks: TaskItem[];
  routine: 'morning' | 'evening';
  onComplete: (taskId: string) => Promise<void>;
}

export default function TaskList({ tasks, routine, onComplete }: Props) {
  const { t } = useTranslation();

  const filtered = tasks.filter((t) => t.routine === routine || t.routine === 'custom');
  const done = filtered.filter((t) => t.isCompletedToday).length;
  const total = filtered.length;
  const allDone = done === total && total > 0;

  return (
    <div className="bg-white/10 rounded-2xl p-4 xl:p-6 flex flex-col gap-3 xl:gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl md:text-2xl xl:text-3xl font-bold">
          {routine === 'morning' ? t('child.tasks.morning') : t('child.tasks.evening')}
        </h2>
        {!allDone && (
          <span className="text-sm xl:text-base opacity-75">
            {t('child.tasks.progress', { done, total })}
          </span>
        )}
      </div>

      {allDone ? (
        <p className="text-xl xl:text-2xl text-center py-4">{t('child.tasks.allDone')}</p>
      ) : (
        <ul className="flex flex-col gap-2 xl:gap-3">
          {filtered.map((task) => (
            <li key={task.id}>
              <button
                onClick={() => !task.isCompletedToday && onComplete(task.id)}
                disabled={task.isCompletedToday}
                className={`
                  task-card w-full flex items-center gap-4 rounded-xl px-4
                  min-h-[64px] xl:min-h-[80px] text-left transition-all
                  ${task.isCompletedToday
                    ? 'bg-green-500/40 border-2 border-green-400'
                    : 'bg-white/10 hover:bg-white/20 active:scale-98 border-2 border-transparent'
                  }
                `}
              >
                <span className="text-3xl xl:text-4xl flex-shrink-0">{task.emoji}</span>
                <span className={`flex-1 text-lg xl:text-2xl font-medium ${task.isCompletedToday ? 'line-through opacity-60' : ''}`}>
                  {task.title}
                </span>
                <span className="flex-shrink-0 w-8 h-8 xl:w-10 xl:h-10 rounded-full border-2 border-white/40 flex items-center justify-center">
                  {task.isCompletedToday ? (
                    <span className="text-green-300 text-xl">✓</span>
                  ) : (
                    <span className="opacity-30 text-sm">○</span>
                  )}
                </span>
                {task.isCompletedToday && (
                  <span className="text-sm xl:text-base opacity-70">+{task.starValue}⭐</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
