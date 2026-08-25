import { z } from 'zod';

export const JobSchema = z.object({
  schemaVersion: z.number().default(1),
  id: z.string(),
  sourceId: z.string().optional(),
  source: z.enum(['linkedin', 'greenhouse', 'lever', 'ashby', 'workable', 'manual']),
  title: z.string(),
  company: z.string(),
  location: z.string().optional(),
  workMode: z.enum(['remote', 'hybrid', 'onsite', 'unknown']).default('unknown'),
  description: z.string().optional(),
  skills: z.array(z.string()).default([]),
  url: z.string(),
  applicationUrl: z.string().optional(),
  easyApply: z.boolean().default(false),
  salary: z.string().optional(),
  employmentType: z.string().optional(),
  postedAt: z.string().optional(),
  fingerprint: z.string(),
  createdAt: z.string().datetime(),
});

export const JobMatchSchema = z.object({
  jobId: z.string(),
  deterministicScore: z.number().min(0).max(100),
  aiScore: z.number().min(0).max(100).optional(),
  finalScore: z.number().min(0).max(100),
  matchedSkills: z.array(z.string()),
  missingSkills: z.array(z.string()),
  strengths: z.array(z.string()),
  concerns: z.array(z.string()),
  recommendation: z.enum(['apply', 'review', 'skip']),
  scoreBreakdown: z.object({
    titleRelevance: z.number(),
    technologyMatch: z.number(),
    experienceMatch: z.number(),
    remoteLocationMatch: z.number(),
    employmentType: z.number(),
    salaryMatch: z.number(),
    seniorityMatch: z.number(),
    jobFreshness: z.number(),
  }),
  analyzedAt: z.string().datetime(),
});

export type Job = z.infer<typeof JobSchema>;
export type JobMatch = z.infer<typeof JobMatchSchema>;

export type JobStatus = 'discovered' | 'matched' | 'saved' | 'started' | 'ready_for_review' | 'submitted' | 'interview' | 'rejected' | 'withdrawn';

export interface SavedJob {
  job: Job;
  match: JobMatch | null;
  status: JobStatus;
  savedAt: string;
  updatedAt: string;
}
