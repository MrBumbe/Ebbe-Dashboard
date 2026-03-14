import { Router, Response } from 'express';
import { eq, and } from 'drizzle-orm';
import { getDb } from '../../db';
import { modules } from '../../db/schema';
import { requireAuth, AuthRequest } from '../../middleware/auth';
import type { WeatherModule, WeatherData, WeatherCondition } from '../core/types';

// ── WMO weather code → condition mapping ─────────────────────
function wmoToCondition(code: number): WeatherCondition {
  if (code === 0 || code === 1) return 'sunny';
  if (code <= 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 67) return 'rain';
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 80 && code <= 82) return 'rain';
  if (code === 85 || code === 86) return 'snow';
  if (code >= 95) return 'storm';
  return 'cloudy';
}

function conditionToIcon(condition: WeatherCondition): string {
  const map: Record<WeatherCondition, string> = {
    sunny: 'sunny.svg',
    cloudy: 'cloudy.svg',
    rain: 'rain.svg',
    snow: 'snow.svg',
    storm: 'storm.svg',
    fog: 'fog.svg',
  };
  return map[condition];
}

// ── Simple in-memory cache (keyed by "lat,lon") ───────────────
interface CacheEntry {
  data: WeatherData;
  expiresAt: number;
}

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const _cache = new Map<string, CacheEntry>();

async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const cacheKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;
  const cached = _cache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }

  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,apparent_temperature,weather_code` +
    `&wind_speed_unit=ms` +
    `&timezone=auto`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Open-Meteo API error: ${response.status}`);
  }

  const json = await response.json() as {
    current: {
      temperature_2m: number;
      apparent_temperature: number;
      weather_code: number;
    };
  };

  const condition = wmoToCondition(json.current.weather_code);
  const data: WeatherData = {
    temperature: Math.round(json.current.temperature_2m),
    feelsLike: Math.round(json.current.apparent_temperature),
    condition,
    icon: conditionToIcon(condition),
    locationName: '',     // filled in by the route from stored config
    updatedAt: new Date(),
  };

  _cache.set(cacheKey, { data, expiresAt: Date.now() + CACHE_TTL_MS });
  return data;
}

// ── Routes ────────────────────────────────────────────────────
const router = Router();
router.use(requireAuth);

// GET /api/v1/modules/weather-openmeteo/current
// Returns current weather using the family's stored lat/lon config.
router.get('/current', async (req: AuthRequest, res: Response) => {
  const familyId = req.user!.familyId;
  const db = getDb();

  const row = db.select().from(modules)
    .where(and(eq(modules.familyId, familyId), eq(modules.moduleId, 'weather-openmeteo')))
    .get();

  if (!row || !row.isEnabled) {
    res.status(404).json({ error: { code: 'MODULE_DISABLED', message: 'Weather module is not enabled for this family' } });
    return;
  }

  let cfg: { lat?: number; lon?: number; locationName?: string } = {};
  try {
    cfg = JSON.parse(row.config);
  } catch {
    // malformed config — fall through to validation error
  }

  if (cfg.lat === undefined || cfg.lon === undefined) {
    res.status(400).json({ error: { code: 'MODULE_NOT_CONFIGURED', message: 'Weather module requires lat and lon in config' } });
    return;
  }

  try {
    const weather = await fetchWeather(cfg.lat, cfg.lon);
    res.json({ data: { ...weather, locationName: cfg.locationName ?? '', updatedAt: weather.updatedAt.toISOString() } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch weather';
    res.status(502).json({ error: { code: 'UPSTREAM_ERROR', message } });
  }
});

// PUT /api/v1/modules/weather-openmeteo/config
// Saves lat/lon/locationName for this family and enables the module.
router.put('/config', async (req: AuthRequest, res: Response) => {
  const familyId = req.user!.familyId;
  const { lat, lon, locationName } = req.body as {
    lat?: number;
    lon?: number;
    locationName?: string;
  };

  if (lat === undefined || lon === undefined) {
    res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'lat and lon are required' } });
    return;
  }
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    res.status(400).json({ error: { code: 'INVALID_COORDS', message: 'lat must be -90–90, lon must be -180–180' } });
    return;
  }

  const db = getDb();
  const config = JSON.stringify({ lat, lon, locationName: locationName ?? '' });

  db.insert(modules)
    .values({ familyId, moduleId: 'weather-openmeteo', isEnabled: true, config })
    .onConflictDoUpdate({
      target: [modules.familyId, modules.moduleId],
      set: { isEnabled: true, config },
    })
    .run();

  res.json({ data: { lat, lon, locationName: locationName ?? '' } });
});

// ── Module export ─────────────────────────────────────────────
export const weatherOpenMeteo: WeatherModule = {
  id: 'weather-openmeteo',
  type: 'weather',
  version: '1.0.0',
  name: { en: 'Open-Meteo Weather', sv: 'Open-Meteo Väder' },
  fetchWeather,
  routes: router,
};
