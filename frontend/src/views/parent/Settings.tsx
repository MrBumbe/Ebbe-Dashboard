import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import client from '../../api/client';

interface GeoResult {
  id: number;
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}

const ACCENT_COLOURS = [
  { label: 'Blue',   value: '#1565C0' },
  { label: 'Pink',   value: '#C2185B' },
  { label: 'Green',  value: '#2E7D32' },
  { label: 'Purple', value: '#6A1B9A' },
  { label: 'Orange', value: '#E65100' },
  { label: 'Red',    value: '#C62828' },
  { label: 'Teal',   value: '#00695C' },
  { label: 'Yellow', value: '#F57F17' },
];

export default function Settings() {
  const { t } = useTranslation();

  // Language
  const [lang, setLang] = useState(i18n.language.startsWith('sv') ? 'sv' : 'en');

  function handleLang(l: string) {
    setLang(l);
    void i18n.changeLanguage(l);
    localStorage.setItem('ebbe_lang', l);
    void client.put('/settings/language', { value: l });
  }

  // Weather location search
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [savedLocation, setSavedLocation] = useState<string | null>(null);
  const [locationError, setLocationError] = useState('');

  async function handleSearch() {
    if (!query.trim()) return;
    setSearching(true);
    setLocationError('');
    setResults([]);
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=8&language=${lang}&format=json`
      );
      const json = await res.json() as { results?: GeoResult[] };
      setResults(json.results ?? []);
      if (!json.results?.length) setLocationError('No locations found. Try a different city name.');
    } catch {
      setLocationError(t('errors.networkError'));
    } finally {
      setSearching(false);
    }
  }

  async function handleSelectLocation(loc: GeoResult) {
    setLocationError('');
    try {
      await client.put('/modules/weather-openmeteo/config', {
        lat: loc.latitude,
        lon: loc.longitude,
        locationName: loc.admin1 ? `${loc.name}, ${loc.admin1}, ${loc.country}` : `${loc.name}, ${loc.country}`,
      });
      setSavedLocation(loc.admin1 ? `${loc.name}, ${loc.admin1}, ${loc.country}` : `${loc.name}, ${loc.country}`);
      setResults([]);
      setQuery('');
    } catch {
      setLocationError('Failed to save location. Please try again.');
    }
  }

  // Child accent colour
  const [accentColor, setAccentColor] = useState('#1565C0');
  const [colorSaved, setColorSaved] = useState(false);

  async function handleColorSave(color: string) {
    setAccentColor(color);
    setColorSaved(false);
    try {
      await client.put('/settings/child.accentColor', { value: JSON.stringify(color) });
      setColorSaved(true);
      setTimeout(() => setColorSaved(false), 2000);
    } catch { /* ignore */ }
  }

  // Child screen feature toggles
  const [storeEnabled, setStoreEnabled] = useState(false);
  const [historyEnabled, setHistoryEnabled] = useState(false);
  const [inactivitySeconds, setInactivitySeconds] = useState(45);
  const [featuresSaved, setFeaturesSaved] = useState(false);

  useEffect(() => {
    client.get<{ data: Record<string, unknown> }>('/settings').then((res) => {
      const d = res.data.data;
      if (typeof d['store.enabled'] === 'boolean') setStoreEnabled(d['store.enabled']);
      if (typeof d['history.enabled'] === 'boolean') setHistoryEnabled(d['history.enabled']);
      if (typeof d['inactivity.seconds'] === 'number') setInactivitySeconds(d['inactivity.seconds']);
      if (typeof d['child.accentColor'] === 'string') setAccentColor(d['child.accentColor']);
    }).catch(() => {});
  }, []);

  async function handleFeaturesSave() {
    setFeaturesSaved(false);
    try {
      await Promise.all([
        client.put('/settings/store.enabled', { value: JSON.stringify(storeEnabled) }),
        client.put('/settings/history.enabled', { value: JSON.stringify(historyEnabled) }),
        client.put('/settings/inactivity.seconds', { value: JSON.stringify(inactivitySeconds) }),
      ]);
      setFeaturesSaved(true);
      setTimeout(() => setFeaturesSaved(false), 2000);
    } catch { /* ignore */ }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('parent.settings.title')}</h1>

      {/* Language */}
      <section className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">{t('parent.settings.language')}</h2>
        <div className="flex gap-3">
          {(['sv', 'en'] as const).map((l) => (
            <button
              key={l}
              onClick={() => handleLang(l)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${lang === l ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {l === 'sv' ? '🇸🇪 Svenska' : '🇬🇧 English'}
            </button>
          ))}
        </div>
      </section>

      {/* Weather location */}
      <section className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-1">Weather location</h2>
        <p className="text-xs text-gray-400 mb-3">Search for a city to set the weather location on the child screen.</p>
        {savedLocation && (
          <p className="text-xs text-green-600 mb-3">✓ Saved: {savedLocation}</p>
        )}
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void handleSearch()}
            placeholder="e.g. Mullsjö"
            className="flex-1 border rounded-lg px-3 py-2 text-sm"
          />
          <button
            onClick={() => void handleSearch()}
            disabled={searching}
            className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-800 disabled:opacity-50"
          >
            {searching ? '...' : 'Search'}
          </button>
        </div>
        {locationError && <p className="text-xs text-red-500 mb-2">{locationError}</p>}
        {results.length > 0 && (
          <ul className="border rounded-lg overflow-hidden divide-y divide-gray-100">
            {results.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault(); // prevent blur before click fires
                    void handleSelectLocation(r);
                  }}
                  className="w-full text-left px-3 py-3 text-sm hover:bg-blue-50 active:bg-blue-100 transition-colors cursor-pointer"
                >
                  <span className="font-medium text-gray-800">{r.name}</span>
                  {r.admin1 && <span className="text-gray-500 ml-1.5">{r.admin1}</span>}
                  <span className="text-gray-400 ml-1.5">{r.country}</span>
                  <span className="block text-xs text-gray-400 mt-0.5">{r.latitude.toFixed(2)}°N, {r.longitude.toFixed(2)}°E</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Child accent colour */}
      <section className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-1">Child screen colour theme</h2>
        <p className="text-xs text-gray-400 mb-3">Choose an accent colour for the child's dashboard.</p>
        <div className="flex flex-wrap gap-3">
          {ACCENT_COLOURS.map((c) => (
            <button
              key={c.value}
              title={c.label}
              onClick={() => void handleColorSave(c.value)}
              className="w-10 h-10 rounded-full border-4 transition-all hover:scale-110"
              style={{
                backgroundColor: c.value,
                borderColor: accentColor === c.value ? '#111' : 'transparent',
                outline: accentColor === c.value ? `2px solid ${c.value}` : 'none',
                outlineOffset: '2px',
              }}
            />
          ))}
        </div>
        {colorSaved && <p className="text-xs text-green-600 mt-2">✓ Colour saved</p>}
      </section>

      {/* Child screen features */}
      <section className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-1">{t('parent.settings.childFeatures')}</h2>
        <p className="text-xs text-gray-400 mb-4">{t('parent.settings.childFeaturesHint')}</p>
        <div className="flex flex-col gap-3">
          <label className="flex items-center justify-between gap-4">
            <span className="text-sm text-gray-700">{t('parent.settings.storeEnabled')}</span>
            <input
              type="checkbox"
              checked={storeEnabled}
              onChange={(e) => setStoreEnabled(e.target.checked)}
              className="rounded"
            />
          </label>
          <label className="flex items-center justify-between gap-4">
            <span className="text-sm text-gray-700">{t('parent.settings.historyEnabled')}</span>
            <input
              type="checkbox"
              checked={historyEnabled}
              onChange={(e) => setHistoryEnabled(e.target.checked)}
              className="rounded"
            />
          </label>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-gray-700">{t('parent.settings.inactivitySeconds')}</span>
            <input
              type="number"
              min={10}
              max={300}
              value={inactivitySeconds}
              onChange={(e) => setInactivitySeconds(parseInt(e.target.value))}
              className="w-20 border rounded-lg px-2 py-1.5 text-sm text-center"
            />
          </div>
        </div>
        {featuresSaved && <p className="text-xs text-green-600 mt-3">✓ Saved</p>}
        <div className="flex justify-end mt-3">
          <button
            onClick={() => void handleFeaturesSave()}
            className="bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-800"
          >
            {t('parent.tasks.save')}
          </button>
        </div>
      </section>
    </div>
  );
}
