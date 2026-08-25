import { describe, it, expect } from 'vitest';
import { JobSchema } from '../lib/schemas/job';
import { generateJobId, generateFingerprint } from '../lib/utils';

describe('Job Schema', () => {
  const validJob = {
    id: 'test-123',
    source: 'linkedin',
    title: 'Senior Full Stack Developer',
    company: 'Example Corp',
    location: 'Remote',
    workMode: 'remote',
    description: 'We are looking for a senior full stack developer...',
    skills: ['React', 'Node.js', 'TypeScript'],
    url: 'https://linkedin.com/jobs/123',
    fingerprint: 'abc123',
    createdAt: new Date().toISOString(),
  };

  it('should validate a complete job', () => {
    const result = JobSchema.safeParse(validJob);
    expect(result.success).toBe(true);
  });

  it('should reject job without required fields', () => {
    const result = JobSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should default workMode to unknown', () => {
    const job = { ...validJob, workMode: undefined };
    const result = JobSchema.safeParse(job);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.workMode).toBe('unknown');
    }
  });
});

describe('generateJobId', () => {
  it('should generate consistent IDs', () => {
    const id1 = generateJobId('linkedin', 'https://example.com', 'Dev', 'Corp');
    const id2 = generateJobId('linkedin', 'https://example.com', 'Dev', 'Corp');
    expect(id1).toBe(id2);
  });

  it('should generate different IDs for different inputs', () => {
    const id1 = generateJobId('linkedin', 'https://example.com', 'Dev', 'Corp');
    const id2 = generateJobId('linkedin', 'https://example.com', 'Dev', 'Other');
    expect(id1).not.toBe(id2);
  });

  it('should include source in ID', () => {
    const id = generateJobId('linkedin', 'https://example.com', 'Dev', 'Corp');
    expect(id).toMatch(/^linkedin-/);
  });
});

describe('generateFingerprint', () => {
  it('should generate consistent fingerprints', () => {
    const fp1 = generateFingerprint('Corp', 'Dev', 'Remote');
    const fp2 = generateFingerprint('Corp', 'Dev', 'Remote');
    expect(fp1).toBe(fp2);
  });

  it('should be case-insensitive', () => {
    const fp1 = generateFingerprint('Corp', 'Dev', 'Remote');
    const fp2 = generateFingerprint('corp', 'dev', 'remote');
    expect(fp1).toBe(fp2);
  });
});
