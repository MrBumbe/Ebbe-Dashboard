import type { EbbeModule } from './types';

const _modules = new Map<string, EbbeModule>();

export function registerModule(mod: EbbeModule): void {
  if (_modules.has(mod.id)) {
    throw new Error(`Module '${mod.id}' is already registered`);
  }
  _modules.set(mod.id, mod);
}

export function getModule(id: string): EbbeModule | undefined {
  return _modules.get(id);
}

export function getAllModules(): EbbeModule[] {
  return Array.from(_modules.values());
}
