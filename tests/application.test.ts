import { describe, it, expect } from 'vitest';
import {
  ApplicationSchema,
  createApplication,
  updateApplicationStatus,
  type Application,
  type ApplicationStatusType,
} from '../lib/schemas/application';

describe('Application schema', () => {
  it('should validate a valid application', () => {
    const app = createApplication('job_123');
    const result = ApplicationSchema.safeParse(app);
    expect(result.success).toBe(true);
  });

  it('should require id and jobId', () => {
    const result = ApplicationSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should default status to saved', () => {
    const app = createApplication('job_123');
    expect(app.status).toBe('saved');
  });

  it('should have timeline with initial entry', () => {
    const app = createApplication('job_123');
    expect(app.timeline).toHaveLength(1);
    expect(app.timeline[0].status).toBe('saved');
  });

  it('should default tags to empty array', () => {
    const app = createApplication('job_123');
    expect(app.tags).toEqual([]);
  });
});

describe('createApplication', () => {
  it('should create an application with correct jobId', () => {
    const app = createApplication('job_456');
    expect(app.jobId).toBe('job_456');
    expect(app.id).toMatch(/^app_/);
  });

  it('should set timestamps', () => {
    const app = createApplication('job_123');
    expect(app.createdAt).toBeDefined();
    expect(app.updatedAt).toBeDefined();
    expect(app.lastStatusChange).toBeDefined();
  });
});

describe('updateApplicationStatus', () => {
  it('should update status and add timeline entry', () => {
    const app = createApplication('job_123');
    const updated = updateApplicationStatus(app, 'applied');

    expect(updated.status).toBe('applied');
    expect(updated.timeline).toHaveLength(2);
    expect(updated.timeline[1].status).toBe('applied');
    expect(updated.appliedAt).toBeDefined();
  });

  it('should add note to timeline entry', () => {
    const app = createApplication('job_123');
    const updated = updateApplicationStatus(app, 'interviewing', 'Phone screen scheduled');

    expect(updated.timeline[1].note).toBe('Phone screen scheduled');
  });

  it('should set appliedAt only on first apply', () => {
    const app = createApplication('job_123');
    const applied = updateApplicationStatus(app, 'applied');
    const updated = updateApplicationStatus(applied, 'interviewing');

    expect(updated.appliedAt).toBe(applied.appliedAt);
  });

  it('should handle all status transitions', () => {
    const statuses: ApplicationStatusType[] = [
      'applied', 'interviewing', 'offer', 'rejected', 'withdrawn', 'ghosted',
    ];

    let app = createApplication('job_123');
    for (const status of statuses) {
      app = updateApplicationStatus(app, status);
      expect(app.status).toBe(status);
    }
    expect(app.timeline).toHaveLength(statuses.length + 1);
  });
});
