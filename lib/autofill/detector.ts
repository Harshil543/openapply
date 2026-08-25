export interface DetectedField {
  element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
  name: string;
  id: string;
  type: string;
  label: string;
  placeholder: string;
  required: boolean;
  value: string;
  fieldType: FieldType;
  confidence: number;
}

export type FieldType =
  | 'first_name'
  | 'last_name'
  | 'full_name'
  | 'email'
  | 'phone'
  | 'location'
  | 'city'
  | 'state'
  | 'zip'
  | 'country'
  | 'linkedin'
  | 'github'
  | 'portfolio'
  | 'website'
  | 'current_company'
  | 'current_title'
  | 'years_experience'
  | 'education'
  | 'degree'
  | 'gpa'
  | 'salary_expectation'
  | 'start_date'
  | 'cover_letter'
  | 'bio'
  | 'diversity_gender'
  | 'work_authorization'
  | 'sponsorship'
  | 'disability'
  | 'veteran'
  | 'unknown';

const FIELD_PATTERNS: Record<FieldType, RegExp[]> = {
  first_name: [/first.?name/i, /given.?name/i, /fname/i],
  last_name: [/last.?name/i, /family.?name/i, /surname/i, /lname/i],
  full_name: [/full.?name/i, /your.?name/i, /name(?!s)/i],
  email: [/e-?mail/i, /email.?address/i],
  phone: [/phone|mobile|cell|tel/i],
  location: [/location|city|address|region/i],
  city: [/\bcity\b/i],
  state: [/\bstate\b|province|region/i],
  zip: [/zip|postal|postcode/i],
  country: [/country|nation/i],
  linkedin: [/linkedin/i],
  github: [/github/i],
  portfolio: [/portfolio|作品/i],
  website: [/website|url|homepage|blog/i],
  current_company: [/company|employer|organization|org/i],
  current_title: [/title|position|role|job.?title/i],
  years_experience: [/year.*experience|experience.*year|exp/i],
  education: [/education|school|university|college|institution/i],
  degree: [/degree|diploma|qualification/i],
  gpa: [/gpa|grade|score/i],
  salary_expectation: [/salary|compensation|pay|wage|expected.?pay/i],
  start_date: [/start.?date|available|join|begin/i],
  cover_letter: [/cover.?letter|message|additional|notes|comments/i],
  bio: [/bio|about|summary|intro|description|tell.?us/i],
  diversity_gender: [/gender|sex|pronouns/i],
  work_authorization: [/authorized|right.?to.?work|work.?permit|legal/i],
  sponsorship: [/sponsor|visa|h-?1b|immigration|permit/i],
  disability: [/disability|handicap|ada/i],
  veteran: [/veteran|military|armed/i],
  unknown: [],
};

function getLabel(element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): string {
  const id = element.id;
  if (id) {
    const label = document.querySelector(`label[for="${id}"]`);
    if (label) return label.textContent?.trim() || '';
  }

  const parent = element.closest('label');
  if (parent) return parent.textContent?.trim() || '';

  const prevSibling = element.previousElementSibling;
  if (prevSibling?.tagName === 'LABEL') return prevSibling.textContent?.trim() || '';

  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) return ariaLabel;

  const closestContainer = element.closest('.form-group, .field, .input-group, [class*="field"], [class*="input"]');
  if (closestContainer) {
    const labelEl = closestContainer.querySelector('label, .label, [class*="label"]');
    if (labelEl) return labelEl.textContent?.trim() || '';
  }

  return '';
}

function classifyField(
  name: string,
  id: string,
  type: string,
  label: string,
  placeholder: string
): { fieldType: FieldType; confidence: number } {
  const allText = `${name} ${id} ${label} ${placeholder}`.toLowerCase();

  let bestMatch: FieldType = 'unknown';
  let bestConfidence = 0;

  for (const [fieldType, patterns] of Object.entries(FIELD_PATTERNS)) {
    if (fieldType === 'unknown') continue;

    for (const pattern of patterns) {
      if (pattern.test(allText)) {
        const confidence = 0.9;
        if (confidence > bestConfidence) {
          bestMatch = fieldType as FieldType;
          bestConfidence = confidence;
        }
      }
    }
  }

  if (bestConfidence === 0 && type === 'email') {
    return { fieldType: 'email', confidence: 0.7 };
  }
  if (bestConfidence === 0 && type === 'tel') {
    return { fieldType: 'phone', confidence: 0.7 };
  }

  return { fieldType: bestMatch, confidence: bestConfidence };
}

export function detectFormFields(container: Document = document): DetectedField[] {
  const inputs = container.querySelectorAll('input, select, textarea');
  const fields: DetectedField[] = [];

  for (const el of Array.from(inputs)) {
    const input = el as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    const name = input.name || '';
    const id = input.id || '';
    const type = (input as HTMLInputElement).type || 'text';
    const label = getLabel(input);
    const placeholder = (input as HTMLInputElement).placeholder || '';
    const required = input.required || input.getAttribute('aria-required') === 'true';
    const value = input.value || '';

    if (type === 'hidden' || type === 'submit' || type === 'button' || type === 'checkbox' || type === 'radio') continue;

    const { fieldType, confidence } = classifyField(name, id, type, label, placeholder);

    if (confidence > 0) {
      fields.push({
        element: input,
        name,
        id,
        type,
        label,
        placeholder,
        required,
        value,
        fieldType,
        confidence,
      });
    }
  }

  return fields;
}

export function getFieldSuggestions(field: DetectedField): string[] {
  const suggestions: string[] = [];

  if (field.fieldType === 'first_name' || field.fieldType === 'full_name') {
    suggestions.push('From your profile');
  }

  return suggestions;
}
