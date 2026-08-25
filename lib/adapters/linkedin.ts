import type { JobAdapter, ExtractedJob } from './base';

const LINKEDIN_SELECTORS = {
  title: [
    'h1.job-details-jobs-unified-top-card__job-title a',
    'h1.job-details-jobs-unified-top-card__job-title',
    'h1.top-card-layout__title',
    '.job-details-jobs-unified-top-card__job-title',
  ],
  company: [
    'span.job-details-jobs-unified-top-card__company-name a',
    'span.job-details-jobs-unified-top-card__company-name',
    '.topcard__org-name-link',
  ],
  location: [
    'span.job-details-jobs-unified-top-card__bullet',
    '.topcard__flavor--bullet',
  ],
  description: [
    'div.job-description__content',
    '.description__text',
    'div.jobs-description__content',
  ],
  skills: [
    'span.job-details-jobs-unified-top-card__skills-match .job-details-skills-match__skill',
    '.skills-section .skill-text',
  ],
  easyApply: [
    'span.jobs-apply-button',
    'button[aria-label*="Easy Apply"]',
  ],
};

function querySelector(selectors: string[]): Element | null {
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) return el;
  }
  return null;
}

function querySelectorText(selectors: string[]): string {
  const el = querySelector(selectors);
  return el?.textContent?.trim() || '';
}

function querySelectorAll(selectors: string[]): string[] {
  for (const sel of selectors) {
    const els = document.querySelectorAll(sel);
    if (els.length > 0) {
      return Array.from(els).map((el) => el.textContent?.trim() || '').filter(Boolean);
    }
  }
  return [];
}

function detectWorkMode(text: string): ExtractedJob['workMode'] {
  const lower = text.toLowerCase();
  if (lower.includes('remote')) return 'remote';
  if (lower.includes('hybrid')) return 'hybrid';
  if (lower.includes('onsite') || lower.includes('on-site') || lower.includes('in-office')) return 'onsite';
  return 'unknown';
}

function extractPostedAt(): string | undefined {
  const timeEl = document.querySelector('span.job-details-jobs-unified-top-card__date span, span[class*="posted"]');
  if (timeEl) {
    const text = timeEl.textContent?.toLowerCase() || '';
    const now = new Date();
    if (text.includes('hour')) return now.toISOString();
    if (text.includes('day')) {
      const days = parseInt(text.match(/\d+/)?.[0] || '1');
      now.setDate(now.getDate() - days);
      return now.toISOString();
    }
    if (text.includes('week')) {
      const weeks = parseInt(text.match(/\d+/)?.[0] || '1');
      now.setDate(now.getDate() - weeks * 7);
      return now.toISOString();
    }
  }
  return undefined;
}

export class LinkedInAdapter implements JobAdapter {
  readonly source = 'linkedin' as const;
  private adapterVersion = '1.0.0';

  canHandle(url: string): boolean {
    return url.includes('linkedin.com/jobs');
  }

  extract(): ExtractedJob | null {
    const title = querySelectorText(LINKEDIN_SELECTORS.title);
    const company = querySelectorText(LINKEDIN_SELECTORS.company);

    if (!title || !company) return null;

    const location = querySelectorText(LINKEDIN_SELECTORS.location);
    const description = querySelectorText(LINKEDIN_SELECTORS.description);
    const skills = querySelectorAll(LINKEDIN_SELECTORS.skills);
    const easyApplyEl = querySelector(LINKEDIN_SELECTORS.easyApply);
    const postedAt = extractPostedAt();

    return {
      source: 'linkedin',
      title,
      company,
      location,
      workMode: detectWorkMode(`${location} ${description}`),
      description,
      skills,
      url: window.location.href,
      easyApply: !!easyApplyEl,
      postedAt,
    };
  }

  getVersion(): string {
    return this.adapterVersion;
  }
}
