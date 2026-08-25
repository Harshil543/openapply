import type { JobAdapter, ExtractedJob } from './base';

const LEVER_SELECTORS = {
  title: [
    '.posting-headline h2',
    '.posting-header .posting-title h2',
    '[data-qa="job-title"]',
  ],
  company: [
    '.posting-headline .company-name',
    '.postings-header .company',
    '.posting-headline .company',
  ],
  location: [
    '.posting-headline .location',
    '.postings-header .location',
    '[data-qa="job-location"]',
  ],
  description: [
    '.posting-page .content',
    '.section-wrapper .content',
    '.posting-content',
  ],
  salary: [
    '.posting-salary',
    '[data-qa="job-salary"]',
  ],
};

function querySelectorText(selectors: string[]): string {
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    const text = el?.textContent?.trim();
    if (text) return text;
  }
  return '';
}

function extractSkillsFromDescription(description: string): string[] {
  const techKeywords = [
    'javascript', 'typescript', 'python', 'java', 'react', 'node', 'angular', 'vue',
    'aws', 'gcp', 'azure', 'docker', 'kubernetes', 'postgresql', 'mysql', 'mongodb',
    'redis', 'graphql', 'rest', 'git', 'ci/cd', 'linux', 'ruby', 'go', 'rust',
    'swift', 'kotlin', 'c++', 'c#', '.net', 'terraform', 'ansible', 'jenkins',
  ];
  const lower = description.toLowerCase();
  return techKeywords.filter((kw) => lower.includes(kw));
}

export class LeverAdapter implements JobAdapter {
  readonly source = 'lever' as const;
  private adapterVersion = '1.0.0';

  canHandle(url: string): boolean {
    return url.includes('jobs.lever.co');
  }

  extract(): ExtractedJob | null {
    const title = querySelectorText(LEVER_SELECTORS.title);
    if (!title) return null;

    const company = querySelectorText(LEVER_SELECTORS.company);
    const location = querySelectorText(LEVER_SELECTORS.location);
    const description = querySelectorText(LEVER_SELECTORS.description);
    const salary = querySelectorText(LEVER_SELECTORS.salary);

    return {
      source: 'lever',
      title,
      company,
      location,
      workMode: 'unknown',
      description,
      skills: extractSkillsFromDescription(description),
      url: window.location.href,
      salary: salary || undefined,
    };
  }

  getVersion(): string {
    return this.adapterVersion;
  }
}
