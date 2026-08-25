import type { Profile } from '../schemas/profile';
import type { Job } from '../schemas/job';
import type { Application } from '../schemas/application';

export interface ExportData {
  version: string;
  exportedAt: string;
  profile: Profile | null;
  jobs: Job[];
  applications: Application[];
}

export function formatExportData(
  profile: Profile | null,
  jobs: Job[],
  applications: Application[]
): string {
  const data: ExportData = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    profile,
    jobs,
    applications,
  };
  return JSON.stringify(data, null, 2);
}

export function downloadExport(data: string, filename: string): void {
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseImportData(json: string): ExportData | null {
  try {
    const data = JSON.parse(json);
    if (!data.version || !data.exportedAt) return null;
    return data as ExportData;
  } catch {
    return null;
  }
}
