import { useState } from 'react';
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
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=${lang}&format=json`
      );
      const json = await res.json() as { results?: GeoResult[] };
      setResults(json.results ?? []);
    } catch {
      setLocationError(t('errors.networkError'));
    } finally {
      setSearching(false);
    }
  }

  async function handleSelectLocation(loc: GeoResult) {
    await client.put('/api/v1/modules/weather-openmeteo/config' as string, {
      lat: loc.latitude,
      lon: loc.longitude,
      locationName: `${loc.name}, ${loc.country}`,
    });
    setSavedLocation(`${loc.name}, ${loc.country}`);
    setResults([]);
    setQuery('');
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
        {savedLocation && (
          <p className="text-xs text-green-600 mb-3">✓ Set to: {savedLocation}</p>
        )}
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void handleSearch()}
            placeholder="Search city..."
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
          <ul className="border rounded-lg overflow-hidden divide-y divide-gray-50">
            {results.map((r) => (
              <li key={r.id}>
                <button
                  onClick={() => void handleSelectLocation(r)}
                  className="w-full text-left px-3 py-2.5 text-sm hover:bg-blue-50 transition-colors"
                >
                  <span className="font-medium text-gray-800">{r.name}</span>
                  <span className="text-gray-500 ml-2">{r.admin1 ? `${r.admin1}, ` : ''}{r.country}</span>
                  <span className="text-xs text-gray-400 ml-2">{r.latitude.toFixed(2)}°, {r.longitude.toFixed(2)}°</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
