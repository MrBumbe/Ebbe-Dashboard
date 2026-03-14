import type { Application } from 'express';
import { registerModule, getAllModules } from './registry';
import { weatherOpenMeteo } from '../weather-openmeteo';

// Built-in modules — add new ones here
const BUILT_IN_MODULES = [weatherOpenMeteo];

export function initModules(app: Application): void {
  // Register all built-in modules
  for (const mod of BUILT_IN_MODULES) {
    registerModule(mod);
    console.log(`Module registered: ${mod.id} v${mod.version}`);
  }

  // Mount each module's router at /api/v1/modules/:moduleId
  for (const mod of getAllModules()) {
    if (mod.routes) {
      app.use(`/api/v1/modules/${mod.id}`, mod.routes);
      console.log(`Module routes mounted: /api/v1/modules/${mod.id}`);
    }
    mod.onStart?.({});
  }
}
