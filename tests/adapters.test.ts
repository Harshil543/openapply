import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LinkedInAdapter } from '../lib/adapters/linkedin';
import { GreenhouseAdapter } from '../lib/adapters/greenhouse';
import { LeverAdapter } from '../lib/adapters/lever';
import { getAdapterForUrl } from '../lib/adapters/index';

describe('LinkedIn Adapter', () => {
  const adapter = new LinkedInAdapter();

  it('should handle linkedin.com/jobs URLs', () => {
    expect(adapter.canHandle('https://www.linkedin.com/jobs/view/123')).toBe(true);
    expect(adapter.canHandle('https://www.linkedin.com/jobs/search/?keywords=react')).toBe(true);
  });

  it('should not handle non-LinkedIn URLs', () => {
    expect(adapter.canHandle('https://www.google.com')).toBe(false);
    expect(adapter.canHandle('https://github.com')).toBe(false);
  });

  it('should return linkedin as source', () => {
    expect(adapter.source).toBe('linkedin');
  });

  it('should return version', () => {
    expect(adapter.getVersion()).toBe('1.0.0');
  });
});

describe('Greenhouse Adapter', () => {
  const adapter = new GreenhouseAdapter();

  it('should handle greenhouse URLs', () => {
    expect(adapter.canHandle('https://boards.greenhouse.io/company/jobs/123')).toBe(true);
    expect(adapter.canHandle('https://example.greenhouse.io/jobs/123')).toBe(true);
  });

  it('should not handle non-Greenhouse URLs', () => {
    expect(adapter.canHandle('https://www.google.com')).toBe(false);
  });

  it('should return greenhouse as source', () => {
    expect(adapter.source).toBe('greenhouse');
  });
});

describe('Lever Adapter', () => {
  const adapter = new LeverAdapter();

  it('should handle lever URLs', () => {
    expect(adapter.canHandle('https://jobs.lever.co/company/123')).toBe(true);
  });

  it('should not handle non-Lever URLs', () => {
    expect(adapter.canHandle('https://www.google.com')).toBe(false);
  });

  it('should return lever as source', () => {
    expect(adapter.source).toBe('lever');
  });
});

describe('getAdapterForUrl', () => {
  it('should return LinkedIn adapter for LinkedIn URLs', () => {
    const adapter = getAdapterForUrl('https://www.linkedin.com/jobs/view/123');
    expect(adapter).toBeInstanceOf(LinkedInAdapter);
  });

  it('should return Greenhouse adapter for Greenhouse URLs', () => {
    const adapter = getAdapterForUrl('https://boards.greenhouse.io/company/jobs/123');
    expect(adapter).toBeInstanceOf(GreenhouseAdapter);
  });

  it('should return Lever adapter for Lever URLs', () => {
    const adapter = getAdapterForUrl('https://jobs.lever.co/company/123');
    expect(adapter).toBeInstanceOf(LeverAdapter);
  });

  it('should return null for unknown URLs', () => {
    const adapter = getAdapterForUrl('https://www.google.com');
    expect(adapter).toBeNull();
  });
});
