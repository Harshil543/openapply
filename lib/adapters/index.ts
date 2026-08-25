import type { JobAdapter } from './base';
import { LinkedInAdapter } from './linkedin';
import { GreenhouseAdapter } from './greenhouse';
import { LeverAdapter } from './lever';

const adapters: JobAdapter[] = [
  new LinkedInAdapter(),
  new GreenhouseAdapter(),
  new LeverAdapter(),
];

export function getAdapterForUrl(url: string): JobAdapter | null {
  return adapters.find((adapter) => adapter.canHandle(url)) || null;
}

export function getAdapter(source: string): JobAdapter | null {
  return adapters.find((adapter) => adapter.source === source) || null;
}

export function getAllAdapters(): readonly JobAdapter[] {
  return adapters;
}

export { LinkedInAdapter } from './linkedin';
export { GreenhouseAdapter } from './greenhouse';
export { LeverAdapter } from './lever';
