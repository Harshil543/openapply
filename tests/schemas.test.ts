import { describe, it, expect } from 'vitest';
import {
  ProfileSchema,
  createEmptyProfile,
} from '../lib/schemas/profile';

describe('Profile Schema', () => {
  it('should validate a complete profile', () => {
    const profile = createEmptyProfile();
    const result = ProfileSchema.safeParse(profile);
    expect(result.success).toBe(true);
  });

  it('should reject profile without required fields', () => {
    const result = ProfileSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should accept any email string (validation at app level)', () => {
    const profile = createEmptyProfile();
    profile.personal.email = 'test@example.com';
    const result = ProfileSchema.safeParse(profile);
    expect(result.success).toBe(true);
  });

  it('should accept empty email for incomplete profiles', () => {
    const profile = createEmptyProfile();
    profile.personal.email = '';
    const result = ProfileSchema.safeParse(profile);
    expect(result.success).toBe(true);
  });

  it('should default schemaVersion to 1', () => {
    const profile = createEmptyProfile();
    expect(profile.schemaVersion).toBe(1);
  });

  it('should default remotePreference to true', () => {
    const profile = createEmptyProfile();
    expect(profile.personal.remotePreference).toBe(true);
  });

  it('should default employmentType to full-time', () => {
    const profile = createEmptyProfile();
    expect(profile.professional.employmentType).toBe('full-time');
  });
});

describe('createEmptyProfile', () => {
  it('should create a profile with empty strings', () => {
    const profile = createEmptyProfile();
    expect(profile.personal.fullName).toBe('');
    expect(profile.personal.email).toBe('');
  });

  it('should create timestamps', () => {
    const profile = createEmptyProfile();
    expect(profile.createdAt).toBeTruthy();
    expect(profile.updatedAt).toBeTruthy();
  });

  it('should have empty arrays for skills', () => {
    const profile = createEmptyProfile();
    expect(profile.professional.skills).toEqual([]);
    expect(profile.professional.desiredTitles).toEqual([]);
  });
});
