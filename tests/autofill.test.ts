import { describe, it, expect } from 'vitest';
import { createEmptyProfile } from '../lib/schemas/profile';
import { mapFieldsToProfile } from '../lib/autofill/filler';
import type { DetectedField, FieldType } from '../lib/autofill/detector';

function makeField(fieldType: FieldType, overrides: Partial<DetectedField> = {}): DetectedField {
  return {
    element: document.createElement('input'),
    name: '',
    id: '',
    type: 'text',
    label: '',
    placeholder: '',
    required: false,
    value: '',
    fieldType,
    confidence: 0.9,
    ...overrides,
  };
}

describe('mapFieldsToProfile', () => {
  it('should map first_name from profile', () => {
    const profile = createEmptyProfile();
    profile.personal.fullName = 'John Doe';

    const fields = [makeField('first_name')];
    const results = mapFieldsToProfile(fields, profile);

    expect(results).toHaveLength(1);
    expect(results[0].value).toBe('John');
    expect(results[0].source).toBe('profile');
  });

  it('should map last_name from profile', () => {
    const profile = createEmptyProfile();
    profile.personal.fullName = 'John Doe';

    const fields = [makeField('last_name')];
    const results = mapFieldsToProfile(fields, profile);

    expect(results).toHaveLength(1);
    expect(results[0].value).toBe('Doe');
  });

  it('should map email from profile', () => {
    const profile = createEmptyProfile();
    profile.personal.email = 'john@example.com';

    const fields = [makeField('email')];
    const results = mapFieldsToProfile(fields, profile);

    expect(results).toHaveLength(1);
    expect(results[0].value).toBe('john@example.com');
  });

  it('should map phone from profile', () => {
    const profile = createEmptyProfile();
    profile.personal.phone = '555-1234';

    const fields = [makeField('phone')];
    const results = mapFieldsToProfile(fields, profile);

    expect(results).toHaveLength(1);
    expect(results[0].value).toBe('555-1234');
  });

  it('should map linkedin from profile', () => {
    const profile = createEmptyProfile();
    profile.personal.linkedinUrl = 'https://linkedin.com/in/johndoe';

    const fields = [makeField('linkedin')];
    const results = mapFieldsToProfile(fields, profile);

    expect(results).toHaveLength(1);
    expect(results[0].value).toBe('https://linkedin.com/in/johndoe');
  });

  it('should map github from profile', () => {
    const profile = createEmptyProfile();
    profile.personal.githubUrl = 'https://github.com/johndoe';

    const fields = [makeField('github')];
    const results = mapFieldsToProfile(fields, profile);

    expect(results).toHaveLength(1);
    expect(results[0].value).toBe('https://github.com/johndoe');
  });

  it('should skip diversity fields', () => {
    const profile = createEmptyProfile();
    const fields = [makeField('diversity_gender')];
    const results = mapFieldsToProfile(fields, profile);

    expect(results).toHaveLength(0);
  });

  it('should skip work_authorization fields', () => {
    const profile = createEmptyProfile();
    const fields = [makeField('work_authorization')];
    const results = mapFieldsToProfile(fields, profile);

    expect(results).toHaveLength(0);
  });

  it('should skip unknown fields', () => {
    const profile = createEmptyProfile();
    const fields = [makeField('unknown')];
    const results = mapFieldsToProfile(fields, profile);

    expect(results).toHaveLength(0);
  });

  it('should map multiple fields', () => {
    const profile = createEmptyProfile();
    profile.personal.fullName = 'Jane Smith';
    profile.personal.email = 'jane@example.com';
    profile.personal.phone = '555-5678';

    const fields = [
      makeField('full_name'),
      makeField('email'),
      makeField('phone'),
    ];

    const results = mapFieldsToProfile(fields, profile);
    expect(results).toHaveLength(3);
    expect(results.map((r) => r.value)).toContain('Jane Smith');
    expect(results.map((r) => r.value)).toContain('jane@example.com');
    expect(results.map((r) => r.value)).toContain('555-5678');
  });

  it('should skip fields with empty values', () => {
    const profile = createEmptyProfile();
    profile.personal.phone = '';

    const fields = [makeField('phone')];
    const results = mapFieldsToProfile(fields, profile);

    expect(results).toHaveLength(0);
  });
});
