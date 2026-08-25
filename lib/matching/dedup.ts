import { generateFingerprint } from '../utils';
import type { ExtractedJob } from '../adapters/base';
import type { Job } from '../schemas/job';

export function isDuplicate(job: ExtractedJob, existingJobs: Job[]): boolean {
  const fingerprint = generateFingerprint(job.company, job.title, job.location);

  for (const existing of existingJobs) {
    if (existing.sourceId && job.url.includes(existing.sourceId)) return true;
    if (existing.url === job.url) return true;
    if (existing.fingerprint === fingerprint) return true;
    if (
      existing.company.toLowerCase() === job.company.toLowerCase() &&
      existing.title.toLowerCase() === job.title.toLowerCase() &&
      existing.location?.toLowerCase() === job.location.toLowerCase()
    ) {
      return true;
    }
  }
  return false;
}

export function deduplicateJobs(jobs: Job[]): Job[] {
  const seen = new Map<string, Job>();
  for (const job of jobs) {
    const key = job.fingerprint || job.url;
    if (!seen.has(key)) {
      seen.set(key, job);
    }
  }
  return Array.from(seen.values());
}
