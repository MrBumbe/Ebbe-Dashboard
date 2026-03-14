import type { Router } from 'express';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

export type WeatherCondition = 'sunny' | 'cloudy' | 'rain' | 'snow' | 'storm' | 'fog';

export interface WeatherData {
  temperature: number;      // Celsius
  feelsLike: number;
  condition: WeatherCondition;
  icon: string;             // filename in frontend/public/icons/weather/
  locationName: string;
  updatedAt: Date;
}

export interface ModuleConfig {
  [key: string]: unknown;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface EbbeModule {
  id: string;               // "weather-openmeteo"
  type: 'weather' | 'game' | 'widget' | 'ai' | 'integration';
  version: string;
  name: Record<string, string>;  // { en: '...', sv: '...' }

  onInstall?(db: BetterSQLite3Database): void;
  onStart?(config: ModuleConfig): void;
  onStop?(): void;
  routes?: Router;
}

export interface WeatherModule extends EbbeModule {
  type: 'weather';
  fetchWeather(lat: number, lon: number): Promise<WeatherData>;
}
