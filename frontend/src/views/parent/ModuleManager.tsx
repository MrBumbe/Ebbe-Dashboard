import { useTranslation } from 'react-i18next';
import { tw } from '../../lib/theme';

// Module management is handled inline in Settings for now.
// This component is a placeholder for the full module marketplace in v2.
export default function ModuleManager() {
  const { t } = useTranslation();
  return (
    <div>
      <h1 className={`${tw.pageHeading} mb-4`}>{t('parent.nav.settings')}</h1>
      <div className={`${tw.card} p-6`}>
        <div className="flex items-center gap-4">
          <span className="text-3xl">🌤️</span>
          <div className="flex-1">
            <p className={`font-semibold ${tw.body}`}>Open-Meteo Weather</p>
            <p className={tw.secondary}>Free weather data — no API key required</p>
          </div>
          <span className="text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">Built-in</span>
        </div>
      </div>
    </div>
  );
}
