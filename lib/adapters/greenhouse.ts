import type { JobAdapter, ExtractedJob } from './base';

const GREENHOUSE_SELECTORS = {
  title: [
    'h1[data-role="job-title"]',
    '.app-title',
    'h1.section-header__title',
  ],
  company: [
    '.company-name',
    'a[href*="greenhouse"]',
  ],
  location: [
    '.location',
    'li.location',
    '.app-location',
  ],
  description: [
    '#content',
    '.content',
    '.section-wrapper',
  ],
  salary: [
    '.salary',
    '[class*="salary"]',
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

export class GreenhouseAdapter implements JobAdapter {
  readonly source = 'greenhouse' as const;
  private adapterVersion = '1.0.0';

  canHandle(url: string): boolean {
    return url.includes('boards.greenhouse.io') || url.includes('greenhouse.io');
  }

  extract(): ExtractedJob | null {
    const title = querySelectorText(GREENHOUSE_SELECTORS.title);
    if (!title) return null;

    const company = querySelectorText(GREENHOUSE_SELECTORS.company) || document.title.split(' - ')[0]?.trim() || '';
    const location = querySelectorText(GREENHOUSE_SELECTORS.location);
    const description = querySelectorText(GREENHOUSE_SELECTORS.description);
    const salary = querySelectorText(GREENHOUSE_SELECTORS.salary);

    return {
      source: 'greenhouse',
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
