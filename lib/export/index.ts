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

export function formatApplicationsCSV(applications: Application[], jobs: Job[]): string {
  const header = 'Company,Title,Status,Applied At,Created,Last Updated,URL';
  const rows = applications.map((app) => {
    const job = jobs.find((j) => j.id === app.jobId);
    const escape = (s: string) => `"${s.replace(/"/g, '""')}"`;
    return [
      escape(job?.company || ''),
      escape(job?.title || ''),
      app.status,
      app.appliedAt || '',
      app.createdAt,
      app.updatedAt,
      job?.url || '',
    ].join(',');
  });
  return [header, ...rows].join('\n');
}

export function downloadExport(data: string, filename: string, mime = 'application/json'): void {
  const blob = new Blob([data], { type: mime });
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
