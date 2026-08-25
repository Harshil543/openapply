import type { Profile } from '../schemas/profile';
import type { DetectedField, FieldType } from './detector';

export interface FillResult {
  field: DetectedField;
  value: string;
  source: string;
  confidence: number;
}

function getFieldValues(profile: Profile): Record<FieldType, { value: string; source: string }> {
  const latestExp = profile.professional.experience[0];
  const latestEdu = profile.professional.education[0];

  return {
    first_name: { value: profile.personal.fullName.split(' ')[0] || '', source: 'profile' },
    last_name: { value: profile.personal.fullName.split(' ').slice(1).join(' ') || '', source: 'profile' },
    full_name: { value: profile.personal.fullName, source: 'profile' },
    email: { value: profile.personal.email, source: 'profile' },
    phone: { value: profile.personal.phone || '', source: 'profile' },
    location: { value: profile.personal.currentLocation || '', source: 'profile' },
    city: { value: profile.personal.currentLocation?.split(',')[0] || '', source: 'profile' },
    state: { value: profile.personal.currentLocation?.split(',')[1]?.trim() || '', source: 'profile' },
    zip: { value: '', source: 'profile' },
    country: { value: '', source: 'profile' },
    linkedin: { value: profile.personal.linkedinUrl || '', source: 'profile' },
    github: { value: profile.personal.githubUrl || '', source: 'profile' },
    portfolio: { value: profile.personal.portfolioUrl || '', source: 'profile' },
    website: { value: profile.personal.portfolioUrl || '', source: 'profile' },
    current_company: { value: latestExp?.company || '', source: 'profile' },
    current_title: { value: latestExp?.title || profile.professional.currentTitle || '', source: 'profile' },
    years_experience: { value: profile.professional.yearsOfExperience?.toString() || '', source: 'profile' },
    education: { value: latestEdu?.school || '', source: 'profile' },
    degree: { value: latestEdu?.degree || '', source: 'profile' },
    gpa: { value: latestEdu?.gpa || '', source: 'profile' },
    salary_expectation: { value: profile.professional.desiredSalary || profile.applicationAnswers.salaryExpectation || '', source: 'profile' },
    start_date: { value: profile.professional.noticePeriod || '', source: 'profile' },
    cover_letter: { value: '', source: 'ai' },
    bio: { value: profile.applicationAnswers.whyHireYou || profile.professional.summary || '', source: 'profile' },
    diversity_gender: { value: '', source: 'skip' },
    work_authorization: { value: profile.personal.workAuthorization || '', source: 'profile' },
    sponsorship: { value: profile.personal.visaSponsorshipPreference ? 'Yes' : '', source: 'profile' },
    disability: { value: '', source: 'skip' },
    veteran: { value: '', source: 'skip' },
    unknown: { value: '', source: 'skip' },
  };
}

export function mapFieldsToProfile(
  fields: DetectedField[],
  profile: Profile
): FillResult[] {
  const values = getFieldValues(profile);
  const results: FillResult[] = [];

  for (const field of fields) {
    const mapping = values[field.fieldType];
    if (mapping && mapping.value && mapping.source !== 'skip') {
      results.push({
        field,
        value: mapping.value,
        source: mapping.source,
        confidence: field.confidence,
      });
    }
  }

  return results;
}

export function fillFields(results: FillResult[]): { filled: number; skipped: number; errors: number } {
  let filled = 0;
  let skipped = 0;
  let errors = 0;

  for (const result of results) {
    try {
      if (!result.field.element) {
        errors++;
        continue;
      }

      const el = result.field.element;
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value'
      )?.set;
      const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype, 'value'
      )?.set;

      if (el.tagName === 'SELECT') {
        const select = el as HTMLSelectElement;
        const options = Array.from(select.options);
        const match = options.find(
          (opt) => opt.value.toLowerCase() === result.value.toLowerCase() ||
                   opt.text.toLowerCase() === result.value.toLowerCase()
        );
        if (match) {
          select.value = match.value;
          select.dispatchEvent(new Event('change', { bubbles: true }));
          filled++;
        } else {
          skipped++;
        }
      } else if (el.tagName === 'TEXTAREA') {
        if (nativeTextAreaValueSetter) {
          nativeTextAreaValueSetter.call(el, result.value);
        } else {
          el.value = result.value;
        }
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        filled++;
      } else {
        const input = el as HTMLInputElement;
        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(input, result.value);
        } else {
          input.value = result.value;
        }
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        filled++;
      }
    } catch {
      errors++;
    }
  }

  return { filled, skipped, errors };
}
