import { describe, it, expect } from 'vitest';
import { calculateMatch } from '../lib/matching/scorer';
import { createEmptyProfile } from '../lib/schemas/profile';
import type { Job } from '../lib/schemas/job';

function makeJob(overrides: Partial<Job> = {}): Job {
  return {
    id: 'test-1',
    source: 'linkedin',
    title: 'Senior Full Stack Developer',
    company: 'Example Corp',
    location: 'Remote',
    workMode: 'remote',
    description: 'Senior full stack developer with 5+ years experience',
    skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
    url: 'https://example.com/job/1',
    easyApply: false,
    fingerprint: 'abc',
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    ...overrides,
  } satisfies Job;
}

describe('calculateMatch', () => {
  it('should calculate a match score between 0 and 100', () => {
    const profile = createEmptyProfile();
    profile.professional.desiredTitles = ['Full Stack Developer'];
    profile.professional.skills = ['React', 'Node.js'];
    const job = makeJob();
    const match = calculateMatch(job, profile);
    expect(match.finalScore).toBeGreaterThanOrEqual(0);
    expect(match.finalScore).toBeLessThanOrEqual(100);
  });

  it('should return higher score for better matches', () => {
    const profile = createEmptyProfile();
    profile.professional.desiredTitles = ['Senior Full Stack Developer'];
    profile.professional.skills = ['React', 'Node.js', 'TypeScript', 'PostgreSQL'];
    profile.professional.yearsOfExperience = 6;
    profile.personal.remotePreference = true;
    const job = makeJob();
    const match = calculateMatch(job, profile);
    expect(match.finalScore).toBeGreaterThanOrEqual(70);
  });

  it('should identify matched skills', () => {
    const profile = createEmptyProfile();
    profile.professional.skills = ['React', 'Node.js'];
    const job = makeJob({ skills: ['React', 'Node.js', 'Python'] });
    const match = calculateMatch(job, profile);
    expect(match.matchedSkills).toContain('React');
    expect(match.matchedSkills).toContain('Node.js');
  });

  it('should identify missing skills', () => {
    const profile = createEmptyProfile();
    profile.professional.skills = ['React'];
    const job = makeJob({ skills: ['React', 'Python', 'Go'] });
    const match = calculateMatch(job, profile);
    expect(match.missingSkills).toContain('Python');
    expect(match.missingSkills).toContain('Go');
  });

  it('should return apply recommendation for high scores', () => {
    const profile = createEmptyProfile();
    profile.professional.desiredTitles = ['Senior Full Stack Developer'];
    profile.professional.skills = ['React', 'Node.js', 'TypeScript', 'PostgreSQL'];
    profile.professional.yearsOfExperience = 6;
    profile.personal.remotePreference = true;
    const job = makeJob();
    const match = calculateMatch(job, profile);
    expect(['apply', 'review']).toContain(match.recommendation);
  });

  it('should have score breakdown with all components', () => {
    const profile = createEmptyProfile();
    const job = makeJob();
    const match = calculateMatch(job, profile);
    expect(match.scoreBreakdown).toHaveProperty('titleRelevance');
    expect(match.scoreBreakdown).toHaveProperty('technologyMatch');
    expect(match.scoreBreakdown).toHaveProperty('experienceMatch');
    expect(match.scoreBreakdown).toHaveProperty('remoteLocationMatch');
    expect(match.scoreBreakdown).toHaveProperty('employmentType');
    expect(match.scoreBreakdown).toHaveProperty('salaryMatch');
    expect(match.scoreBreakdown).toHaveProperty('seniorityMatch');
    expect(match.scoreBreakdown).toHaveProperty('jobFreshness');
  });
});
