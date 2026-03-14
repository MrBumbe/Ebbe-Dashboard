import { useTranslation } from 'react-i18next';

// Module management is handled inline in Settings for now.
// This component is a placeholder for the full module marketplace in v2.
export default function ModuleManager() {
  const { t } = useTranslation();
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">{t('parent.nav.settings')}</h1>
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center gap-4">
          <span className="text-3xl">🌤️</span>
          <div className="flex-1">
            <p className="font-semibold text-gray-800">Open-Meteo Weather</p>
            <p className="text-sm text-gray-500">Free weather data — no API key required</p>
          </div>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Built-in</span>
        </div>
      </div>
    </div>
  );
}
