import type { AIProvider, QuestionAnswer } from '../schemas/ai';
import type { Profile } from '../schemas/profile';
import { sanitizeInput, filterSensitiveData, buildSecureSystemPrompt } from './safety';

export type QuestionCategory =
  | 'personal'
  | 'experience'
  | 'skills'
  | 'salary'
  | 'work_authorization'
  | 'sponsorship'
  | 'relocation'
  | 'availability'
  | 'behavioral'
  | 'technical'
  | 'company_motivation'
  | 'cover_letter'
  | 'unknown';

export function classifyQuestion(question: string): QuestionCategory {
  const lower = question.toLowerCase();

  if (/\bage\b|\bname\b|\bemail\b|\bphone\b|\baddress\b|\bbirthday\b|\bgender\b/.test(lower)) return 'personal';
  if (/\bexperience\b|\bworked\b|\bprevious\b|\bcareer\b|\bhistory\b|\byears\b/.test(lower)) return 'experience';
  if (/\bskill|\btechnology\b|\bprogramming\b|\bframework\b|\btool\b|\blanguage|\bproficien/.test(lower)) return 'skills';
  if (/\bsalary\b|\bcompensation\b|\bpay\b|\bexpectation\b|\bbudget\b|\brate\b/.test(lower)) return 'salary';
  if (/\bauthorized\b|\bwork\s*permit|\blegal\b|\bright\s+to\s+work|\bcitizen\b/.test(lower)) return 'work_authorization';
  if (/\bsponsor|\bvisa\b|\bh1b\b|\bimmigration\b/.test(lower)) return 'sponsorship';
  if (/\brelocat|\bmove\b|\blocation\b|\bwilling\s+to/.test(lower)) return 'relocation';
  if (/\bavailable\b|\bstart\b|\bnotice\s*period|\bjoin\b|\bimmediately\b/.test(lower)) return 'availability';
  if (/\btell\s+me\s+about|\bdescribe\b|\bchallenge\b|\bconflict\b|\bgoal\b|\bweakness\b|\bstrength\b/.test(lower)) return 'behavioral';
  if (/\btechnical\b|\balgorithm\b|\bsystem\s+design|\barchitecture\b|\bcode\b|\bimplement\b/.test(lower)) return 'technical';
  if (/\bwhy.*company|\bwhy.*us\b|\bwhy.*join|\binterest\b|\bmotivat|\bpassion\b/.test(lower)) return 'company_motivation';
  if (/\bcover\s*letter|\bsummary\b|\bintroduct/.test(lower)) return 'cover_letter';
  return 'unknown';
}

function getProfileContext(profile: Profile): string {
  return JSON.stringify(filterSensitiveData({
    name: profile.personal.fullName,
    email: profile.personal.email,
    title: profile.professional.currentTitle,
    experience: `${profile.professional.yearsOfExperience} years`,
    skills: profile.professional.skills,
    languages: profile.professional.programmingLanguages,
    frameworks: profile.professional.frameworks,
    answers: profile.applicationAnswers,
  }), null, 2);
}

export async function generateAnswer(
  provider: AIProvider,
  question: string,
  profile: Profile,
  jobDescription?: string
): Promise<QuestionAnswer> {
  const category = classifyQuestion(question);
  const safeQuestion = sanitizeInput(question);

  if (category === 'personal') {
    const answer = getPersonalAnswer(question, profile);
    if (answer) {
      return {
        answer,
        confidence: 0.95,
        source: ['profile'],
        requires_review: false,
      };
    }
  }

  if (category === 'experience' || category === 'skills') {
    const answer = getResumeAnswer(question, profile);
    if (answer) {
      return {
        answer,
        confidence: 0.85,
        source: ['profile', 'resume'],
        requires_review: false,
      };
    }
  }

  const profileContext = getProfileContext(profile);
  const result = await provider.answerQuestion({
    question: safeQuestion,
    category,
    context: {
      profile: profileContext,
      jobDescription: jobDescription ? sanitizeInput(jobDescription.substring(0, 2000)) : undefined,
    },
  });

  return {
    ...result,
    requires_review: result.requires_review || result.confidence < 0.80,
  };
}

function getPersonalAnswer(question: string, profile: Profile): string | null {
  const lower = question.toLowerCase();
  if (/name/.test(lower) && profile.personal.fullName) return profile.personal.fullName;
  if (/email/.test(lower) && profile.personal.email) return profile.personal.email;
  if (/phone/.test(lower) && profile.personal.phone) return profile.personal.phone;
  if (/location|city/.test(lower) && profile.personal.currentLocation) return profile.personal.currentLocation;
  if (/linkedin/.test(lower) && profile.personal.linkedinUrl) return profile.personal.linkedinUrl;
  if (/github/.test(lower) && profile.personal.githubUrl) return profile.personal.githubUrl;
  return null;
}

function getResumeAnswer(question: string, profile: Profile): string | null {
  const lower = question.toLowerCase();
  if (/years.*experience|experience.*years/.test(lower) && profile.professional.yearsOfExperience) {
    return `${profile.professional.yearsOfExperience} years`;
  }
  if (/skills/.test(lower) && profile.professional.skills.length) {
    return profile.professional.skills.join(', ');
  }
  if (/programming|languages/.test(lower) && profile.professional.programmingLanguages.length) {
    return profile.professional.programmingLanguages.join(', ');
  }
  if (/frameworks/.test(lower) && profile.professional.frameworks.length) {
    return profile.professional.frameworks.join(', ');
  }
  return null;
}

export async function generateJobAnalysis(
  provider: AIProvider,
  profile: Profile,
  jobTitle: string,
  jobDescription: string,
  skills: string[]
) {
  const safeDescription = sanitizeInput(jobDescription.substring(0, 3000));
  const safeTitle = sanitizeInput(jobTitle);

  return provider.analyzeJob({
    profile: filterSensitiveData(profile as unknown as Record<string, unknown>),
    jobTitle: safeTitle,
    jobDescription: safeDescription,
    skills,
  });
}
