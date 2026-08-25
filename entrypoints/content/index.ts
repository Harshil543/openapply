export default defineContentScript({
  matches: ['https://www.linkedin.com/*', 'https://boards.greenhouse.io/*', 'https://jobs.lever.co/*'],
  main() {
    console.log('[OpenApply] Content script loaded on', window.location.hostname);

    const existing = document.querySelector('[data-openapply-host]');
    if (existing) return;

    const host = document.createElement('div');
    host.id = 'openapply-host';
    host.setAttribute('data-openapply-host', 'true');
    document.body.appendChild(host);

    chrome.runtime.onMessage.addListener(
      (
        message: { type: string; payload?: unknown },
        _sender: chrome.runtime.MessageSender,
        sendResponse: (response: { success: boolean; data: unknown; error?: string }) => void
      ) => {
        if (message.type === 'EXTRACT_JOB') {
          const job = extractJobFromPage();
          if (job) {
            sendResponse({ success: true, data: job });
          } else {
            sendResponse({ success: false, data: null, error: 'Could not extract job from this page' });
          }
          return true;
        }

        if (message.type === 'DETECT_FORM') {
          const fields = detectFieldsOnPage();
          sendResponse({ success: true, data: fields });
          return true;
        }

        if (message.type === 'FILL_FORM') {
          const result = fillFieldsOnPage(message.payload as Record<string, string>);
          sendResponse({ success: true, data: result });
          return true;
        }

        return false;
      }
    );
  },
});

function querySelectorText(selectors: string[]): string {
  for (const sel of selectors) {
    try {
      const el = document.querySelector(sel);
      const text = el?.textContent?.trim();
      if (text) return text;
    } catch { /* invalid selector, skip */ }
  }
  return '';
}

function querySelectorAllText(selectors: string[]): string[] {
  for (const sel of selectors) {
    try {
      const els = document.querySelectorAll(sel);
      if (els.length > 0) {
        return Array.from(els).map((el) => el.textContent?.trim() || '').filter(Boolean);
      }
    } catch { /* invalid selector, skip */ }
  }
  return [];
}

function detectWorkMode(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('remote')) return 'remote';
  if (lower.includes('hybrid')) return 'hybrid';
  if (lower.includes('onsite') || lower.includes('on-site') || lower.includes('in-office')) return 'onsite';
  return 'unknown';
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

function extractLinkedIn() {
  const title = querySelectorText([
    'h1.job-details-jobs-unified-top-card__job-title a',
    'h1.job-details-jobs-unified-top-card__job-title',
    'h1.topcard__org-name-link',
    'h1[class*="job-title"]',
    'h1[class*="job-title-link"]',
    'h1',
  ]);
  const company = querySelectorText([
    'span.job-details-jobs-unified-top-card__company-name a',
    'span.job-details-jobs-unified-top-card__company-name',
    'a.topcard__org-name-link',
    'span[class*="company-name"]',
    'span[class*="company"]',
    '.job-details-jobs-unified-top-card__company-name',
  ]);

  if (!title) {
    const metaTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
    if (!metaTitle) return null;
  }

  const location = querySelectorText([
    'span.job-details-jobs-unified-top-card__bullet',
    'span[class*="bullet"]',
    'span[class*="location"]',
    '.job-details-jobs-unified-top-card__primary-description-container span',
  ]);
  const description = querySelectorText([
    'div.job-description__content',
    'div[class*="description__content"]',
    'div[class*="job-description"]',
    'div[class*="show-more-less-html"]',
    'section.description',
  ]);
  const skills = querySelectorAllText([
    'span.job-details-jobs-unified-top-card__skills-match .job-details-skills-match__skill',
    'span[class*="skills-match"] span[class*="skill"]',
    'li.skill-item',
  ]);
  const easyApply = !!document.querySelector('span.jobs-apply-button, button[aria-label*="Easy Apply"], button[class*="jobs-apply"]');

  const resolvedTitle = title || document.querySelector('meta[property="og:title"]')?.getAttribute('content') || '';
  const resolvedCompany = company || document.title.split(' - ')[0]?.trim() || document.title.split(' | ')[0]?.trim() || '';

  if (!resolvedTitle) return null;

  return {
    source: 'linkedin',
    title: resolvedTitle,
    company: resolvedCompany,
    location,
    workMode: detectWorkMode(`${location} ${description}`),
    description,
    skills,
    url: window.location.href,
    easyApply,
  };
}

function extractGreenhouse() {
  const title = querySelectorText([
    'h1[data-role="job-title"]',
    '.app-title',
    'h1[class*="job-title"]',
    'h1',
  ]);
  if (!title) return null;

  const company = querySelectorText([
    '.company-name',
    'a[data-role="company-name"]',
    'span[class*="company"]',
  ]) || document.title.split(' - ')[0]?.trim() || document.title.split(' | ')[0]?.trim() || '';
  const location = querySelectorText(['.location', 'li.location', '[class*="location"]']);
  const description = querySelectorText(['#content', '.content', '[class*="description"]']);
  const salary = querySelectorText(['.salary', '[class*="salary"]']);

  return {
    source: 'greenhouse',
    title,
    company,
    location,
    workMode: detectWorkMode(`${location} ${description}`),
    description,
    skills: extractSkillsFromDescription(description),
    url: window.location.href,
    salary: salary || undefined,
  };
}

function extractLever() {
  const title = querySelectorText([
    '.posting-headline h2',
    '.posting-header .posting-title h2',
    'h2[class*="posting-title"]',
    'h2[class*="posting"]',
    'h2',
  ]);
  if (!title) return null;

  const company = querySelectorText([
    '.posting-headline .company-name',
    '.postings-header .company',
    '.company-name',
    'a[class*="company"]',
  ]);
  const location = querySelectorText([
    '.posting-headline .location',
    '.postings-header .location',
    '.posting-headline .location',
    '[class*="location"]',
  ]);
  const description = querySelectorText([
    '.posting-page .content',
    '.section-wrapper .content',
    '.posting-page section',
    '[class*="content"]',
  ]);
  const salary = querySelectorText(['.posting-salary', '[class*="salary"]']);

  return {
    source: 'lever',
    title,
    company: company || '',
    location,
    workMode: detectWorkMode(`${location} ${description}`),
    description,
    skills: extractSkillsFromDescription(description),
    url: window.location.href,
    salary: salary || undefined,
  };
}

function extractGenericFallback() {
  const title = querySelectorText([
    'meta[property="og:title"]',
    'meta[name="title"]',
  ]) || document.title.split(' - ')[0]?.trim() || '';
  if (!title) return null;

  const description = querySelectorText([
    'meta[property="og:description"]',
    'meta[name="description"]',
  ]);
  const company = document.title.split(' - ')[1]?.trim() || document.title.split(' | ')[1]?.trim() || '';

  return {
    source: 'manual' as const,
    title,
    company,
    location: '',
    workMode: 'unknown',
    description,
    skills: extractSkillsFromDescription(description),
    url: window.location.href,
  };
}

function extractJobFromPage() {
  const url = window.location.hostname;
  let result;
  if (url.includes('linkedin.com')) result = extractLinkedIn();
  else if (url.includes('greenhouse.io')) result = extractGreenhouse();
  else if (url.includes('lever.co')) result = extractLever();
  else result = null;

  if (!result) result = extractGenericFallback();

  if (result) {
    console.log(`[OpenApply] Extracted "${result.title}" at "${result.company}" from ${url}`);
  } else {
    console.warn(`[OpenApply] Failed to extract job from ${url} — no selectors matched`);
  }
  return result;
}

type FieldType = 'first_name' | 'last_name' | 'full_name' | 'email' | 'phone' | 'location' | 'city' | 'state' | 'zip' | 'country' | 'linkedin' | 'github' | 'portfolio' | 'website' | 'current_company' | 'current_title' | 'years_experience' | 'education' | 'degree' | 'gpa' | 'salary_expectation' | 'start_date' | 'cover_letter' | 'bio' | 'unknown';

const FIELD_PATTERNS: Record<FieldType, RegExp[]> = {
  first_name: [/first.?name/i, /given.?name/i, /fname/i],
  last_name: [/last.?name/i, /family.?name/i, /surname/i, /lname/i],
  full_name: [/full.?name/i, /your.?name/i, /name(?!s)/i],
  email: [/e-?mail/i, /email.?address/i],
  phone: [/phone|mobile|cell|tel/i],
  location: [/location|address|region/i],
  city: [/\bcity\b/i],
  state: [/\bstate\b|province/i],
  zip: [/zip|postal|postcode/i],
  country: [/country|nation/i],
  linkedin: [/linkedin/i],
  github: [/github/i],
  portfolio: [/portfolio/i],
  website: [/website|url|homepage|blog/i],
  current_company: [/company|employer|organization/i],
  current_title: [/title|position|role|job.?title/i],
  years_experience: [/year.*experience|experience.*year/i],
  education: [/education|school|university|college/i],
  degree: [/degree|diploma|qualification/i],
  gpa: [/gpa|grade/i],
  salary_expectation: [/salary|compensation|pay|wage/i],
  start_date: [/start.?date|available|join|begin/i],
  cover_letter: [/cover.?letter|message|additional|notes/i],
  bio: [/bio|about|summary|tell.?us/i],
  unknown: [],
};

function classifyFieldLocal(name: string, id: string, type: string, label: string, placeholder: string): { fieldType: FieldType; confidence: number } {
  const allText = `${name} ${id} ${label} ${placeholder}`.toLowerCase();

  for (const [fieldType, patterns] of Object.entries(FIELD_PATTERNS)) {
    if (fieldType === 'unknown') continue;
    for (const pattern of patterns) {
      if (pattern.test(allText)) {
        return { fieldType: fieldType as FieldType, confidence: 0.9 };
      }
    }
  }

  if (type === 'email') return { fieldType: 'email', confidence: 0.7 };
  if (type === 'tel') return { fieldType: 'phone', confidence: 0.7 };

  return { fieldType: 'unknown', confidence: 0 };
}

function detectFieldsOnPage() {
  const inputs = document.querySelectorAll('input, select, textarea');
  const fields: Array<{
    name: string; id: string; type: string; label: string;
    placeholder: string; required: boolean; fieldType: FieldType; confidence: number;
  }> = [];

  for (const el of Array.from(inputs)) {
    const input = el as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    const name = input.name || '';
    const id = input.id || '';
    const type = (input as HTMLInputElement).type || 'text';
    const placeholder = (input as HTMLInputElement).placeholder || '';
    const required = input.required;

    if (['hidden', 'submit', 'button', 'checkbox', 'radio'].includes(type)) continue;

    let label = '';
    if (id) {
      const labelEl = document.querySelector(`label[for="${id}"]`);
      if (labelEl) label = labelEl.textContent?.trim() || '';
    }
    if (!label) {
      const parent = input.closest('label');
      if (parent) label = parent.textContent?.trim() || '';
    }
    if (!label) {
      const ariaLabel = input.getAttribute('aria-label');
      if (ariaLabel) label = ariaLabel;
    }

    const { fieldType, confidence } = classifyFieldLocal(name, id, type, label, placeholder);

    if (confidence > 0) {
      fields.push({ name, id, type, label, placeholder, required, fieldType, confidence });
    }
  }

  return fields;
}

function fillFieldsOnPage(fieldValues: Record<string, string>): { filled: number; skipped: number; errors: number } {
  let filled = 0;
  let skipped = 0;
  let errors = 0;

  for (const [fieldType, value] of Object.entries(fieldValues)) {
    if (!value || fieldType === 'unknown') {
      skipped++;
      continue;
    }

    const inputs = document.querySelectorAll('input, select, textarea');
    let matched = false;

    for (const el of Array.from(inputs)) {
      const input = el as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
      const name = input.name || '';
      const id = input.id || '';
      const type = (input as HTMLInputElement).type || 'text';

      if (['hidden', 'submit', 'button', 'checkbox', 'radio'].includes(type)) continue;

      let label = '';
      if (id) {
        const labelEl = document.querySelector(`label[for="${id}"]`);
        if (labelEl) label = labelEl.textContent?.trim() || '';
      }
      if (!label) {
        const parent = input.closest('label');
        if (parent) label = parent.textContent?.trim() || '';
      }

      const { fieldType: detected } = classifyFieldLocal(name, id, type, label, (input as HTMLInputElement).placeholder || '');

      if (detected === fieldType) {
        try {
          if (input.tagName === 'SELECT') {
            const select = input as HTMLSelectElement;
            const options = Array.from(select.options);
            const match = options.find(
              (opt) => opt.value.toLowerCase() === value.toLowerCase() ||
                       opt.text.toLowerCase() === value.toLowerCase()
            );
            if (match) {
              select.value = match.value;
              select.dispatchEvent(new Event('change', { bubbles: true }));
              matched = true;
            }
          } else if (input.tagName === 'TEXTAREA') {
            const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
            if (setter) setter.call(input, value);
            else input.value = value;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            matched = true;
          } else {
            const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
            if (setter) setter.call(input, value);
            else input.value = value;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            matched = true;
          }
        } catch {
          errors++;
        }
        break;
      }
    }

    if (matched) filled++;
    else skipped++;
  }

  return { filled, skipped, errors };
}
