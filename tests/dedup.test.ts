import { describe, it, expect } from 'vitest';
import { isDuplicate, deduplicateJobs } from '../lib/matching/dedup';
import type { ExtractedJob } from '../lib/adapters/base';
import type { Job } from '../lib/schemas/job';

function makeExtractedJob(overrides: Partial<ExtractedJob> = {}): ExtractedJob {
  return {
    source: 'linkedin',
    title: 'Senior Developer',
    company: 'Tech Corp',
    location: 'Remote',
    workMode: 'remote',
    description: 'A great job',
    skills: ['React'],
    url: 'https://linkedin.com/jobs/123',
    ...overrides,
  };
}

function makeSavedJob(overrides: Partial<Job> = {}): Job {
  return {
    id: 'saved-1',
    source: 'linkedin',
    title: 'Senior Developer',
    company: 'Tech Corp',
    location: 'Remote',
    workMode: 'remote',
    description: 'A great job',
    skills: ['React'],
    url: 'https://linkedin.com/jobs/123',
    easyApply: false,
    fingerprint: 'abc123',
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('isDuplicate', () => {
  it('should detect duplicate by URL', () => {
    const job = makeExtractedJob({ url: 'https://linkedin.com/jobs/123' });
    const existing = [makeSavedJob({ url: 'https://linkedin.com/jobs/123' })];
    expect(isDuplicate(job, existing)).toBe(true);
  });

  it('should detect duplicate by fingerprint', () => {
    const job = makeExtractedJob();
    const existing = [makeSavedJob({ fingerprint: 'abc123' })];
    expect(isDuplicate(job, existing)).toBe(true);
  });

  it('should not flag different jobs as duplicates', () => {
    const job = makeExtractedJob({ title: 'Different Job', url: 'https://linkedin.com/jobs/456' });
    const existing = [makeSavedJob()];
    expect(isDuplicate(job, existing)).toBe(false);
  });

  it('should return false for empty existing list', () => {
    const job = makeExtractedJob();
    expect(isDuplicate(job, [])).toBe(false);
  });
});

describe('deduplicateJobs', () => {
  it('should remove duplicate jobs', () => {
    const jobs = [
      makeSavedJob({ id: '1', fingerprint: 'abc' }),
      makeSavedJob({ id: '2', fingerprint: 'abc' }),
      makeSavedJob({ id: '3', fingerprint: 'def' }),
    ];
    const result = deduplicateJobs(jobs);
    expect(result).toHaveLength(2);
  });

  it('should return all jobs when no duplicates', () => {
    const jobs = [
      makeSavedJob({ id: '1', fingerprint: 'abc' }),
      makeSavedJob({ id: '2', fingerprint: 'def' }),
    ];
    const result = deduplicateJobs(jobs);
    expect(result).toHaveLength(2);
  });

  it('should handle empty list', () => {
    expect(deduplicateJobs([])).toHaveLength(0);
  });
});
