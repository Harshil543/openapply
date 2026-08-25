import { z } from 'zod';

export const ApplicationStatus = z.enum([
  'saved', 'applied', 'interviewing', 'offer', 'rejected', 'withdrawn', 'ghosted',
]);

export const ApplicationTimelineEntrySchema = z.object({
  status: ApplicationStatus,
  timestamp: z.string().datetime(),
  note: z.string().optional(),
});

export const ApplicationSchema = z.object({
  id: z.string(),
  jobId: z.string(),
  status: ApplicationStatus.default('saved'),
  appliedAt: z.string().datetime().optional(),
  lastStatusChange: z.string().datetime(),
  timeline: z.array(ApplicationTimelineEntrySchema),
  notes: z.string().optional(),
  followUpDate: z.string().datetime().optional(),
  salary: z.string().optional(),
  recruiter: z.object({
    name: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
  }).optional(),
  interviewDate: z.string().datetime().optional(),
  tags: z.array(z.string()).default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ApplicationStatusType = z.infer<typeof ApplicationStatus>;
export type ApplicationTimelineEntry = z.infer<typeof ApplicationTimelineEntrySchema>;
export type Application = z.infer<typeof ApplicationSchema>;

export function createApplication(jobId: string): Application {
  const now = new Date().toISOString();
  return {
    id: `app_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    jobId,
    status: 'saved',
    lastStatusChange: now,
    timeline: [{ status: 'saved', timestamp: now }],
    tags: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function updateApplicationStatus(
  application: Application,
  newStatus: ApplicationStatusType,
  note?: string
): Application {
  const now = new Date().toISOString();
  const timelineEntry: ApplicationTimelineEntry = {
    status: newStatus,
    timestamp: now,
    note,
  };

  const updated = {
    ...application,
    status: newStatus,
    lastStatusChange: now,
    timeline: [...application.timeline, timelineEntry],
    updatedAt: now,
    ...(newStatus === 'applied' ? { appliedAt: now } : {}),
  };

  return ApplicationSchema.parse(updated);
}
