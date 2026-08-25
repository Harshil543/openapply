import type { Job } from '../schemas/job';
import type { Profile } from '../schemas/profile';
import type { JobMatch } from '../schemas/job';

const WEIGHTS = {
  titleRelevance: 0.25,
  technologyMatch: 0.20,
  experienceMatch: 0.15,
  remoteLocationMatch: 0.15,
  employmentType: 0.10,
  salaryMatch: 0.05,
  seniorityMatch: 0.05,
  jobFreshness: 0.05,
} as const;

function calculateTitleRelevance(jobTitle: string, desiredTitles: string[]): number {
  if (!desiredTitles.length || !jobTitle) return 50;
  const normalized = jobTitle.toLowerCase();
  for (const dt of desiredTitles) {
    if (normalized.includes(dt.toLowerCase())) return 100;
  }
  const words = jobTitle.toLowerCase().split(/\s+/);
  const jobWords = normalized.split(/\s+/);
  const overlap = words.filter((w: string) => jobWords.includes(w)).length;
  return Math.min(100, (overlap / Math.max(words.length, 1)) * 100);
}

function calculateTechnologyMatch(jobSkills: string[], profileSkills: string[]): number {
  if (!jobSkills.length) return 50;
  const profileSet = new Set(profileSkills.map((s) => s.toLowerCase()));
  const matched = jobSkills.filter((s) => profileSet.has(s.toLowerCase()));
  return Math.round((matched.length / jobSkills.length) * 100);
}

function calculateExperienceMatch(jobDescription: string, yearsOfExperience: number | undefined): number {
  if (!yearsOfExperience) return 50;
  const desc = jobDescription.toLowerCase();
  const seniorKeywords = ['senior', 'lead', 'principal', 'staff', 'architect'];
  const juniorKeywords = ['junior', 'entry', 'associate', 'intern', 'trainee'];
  const isSenior = seniorKeywords.some((k) => desc.includes(k));
  const isJunior = juniorKeywords.some((k) => desc.includes(k));
  if (isSenior && yearsOfExperience >= 5) return 90;
  if (isJunior && yearsOfExperience <= 3) return 90;
  if (isSenior && yearsOfExperience < 3) return 30;
  return 60;
}

function calculateRemoteLocationMatch(
  jobWorkMode: string,
  jobLocation: string,
  remotePreference: boolean,
  preferredLocations: string[]
): number {
  if (remotePreference && jobWorkMode === 'remote') return 100;
  if (!remotePreference && jobWorkMode === 'onsite') return 80;
  if (jobWorkMode === 'hybrid') return 60;
  if (preferredLocations.length && jobLocation) {
    const loc = jobLocation.toLowerCase();
    if (preferredLocations.some((p) => loc.includes(p.toLowerCase()))) return 90;
  }
  return 40;
}

function calculateEmploymentTypeMatch(jobType: string | undefined, prefType: string): number {
  if (!jobType) return 50;
  return jobType.toLowerCase() === prefType.toLowerCase() ? 100 : 40;
}

function calculateSalaryMatch(jobSalary: string | undefined, desiredSalary: string | undefined): number {
  if (!jobSalary || !desiredSalary) return 50;
  const extract = (s: string) => {
    const nums = s.replace(/[^0-9-]/g, '-').split('-').filter(Boolean).map(Number);
    return nums.length >= 2 ? { min: nums[0], max: nums[1] } : { min: nums[0], max: nums[0] };
  };
  const job = extract(jobSalary);
  const desired = extract(desiredSalary);
  if (job.min >= desired.min && job.max <= desired.max * 1.2) return 90;
  if (job.min > desired.max) return 20;
  return 50;
}

function calculateSeniorityMatch(jobTitle: string, yearsOfExperience: number | undefined): number {
  if (!yearsOfExperience) return 50;
  const title = jobTitle.toLowerCase();
  if (title.includes('senior') || title.includes('lead')) return yearsOfExperience >= 5 ? 90 : 30;
  if (title.includes('junior') || title.includes('entry')) return yearsOfExperience <= 3 ? 90 : 40;
  return 60;
}

function calculateFreshness(postedAt: string | undefined): number {
  if (!postedAt) return 50;
  const posted = new Date(postedAt);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - posted.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 1) return 100;
  if (diffDays <= 7) return 80;
  if (diffDays <= 30) return 60;
  return 30;
}

function getScoreLabel(score: number): 'poor' | 'weak' | 'good' | 'strong' | 'excellent' {
  if (score >= 85) return 'excellent';
  if (score >= 75) return 'strong';
  if (score >= 65) return 'good';
  if (score >= 50) return 'weak';
  return 'poor';
}

function getRecommendation(score: number): 'apply' | 'review' | 'skip' {
  if (score >= 75) return 'apply';
  if (score >= 50) return 'review';
  return 'skip';
}

export function calculateMatch(job: Job, profile: Profile): JobMatch {
  const allProfileSkills = [
    ...profile.professional.skills,
    ...profile.professional.programmingLanguages,
    ...profile.professional.frameworks,
    ...profile.professional.databases,
    ...profile.professional.cloud,
    ...profile.professional.tools,
  ];

  const scoreBreakdown = {
    titleRelevance: calculateTitleRelevance(job.title, profile.professional.desiredTitles),
    technologyMatch: calculateTechnologyMatch(job.skills, allProfileSkills),
    experienceMatch: calculateExperienceMatch(job.description || '', profile.professional.yearsOfExperience),
    remoteLocationMatch: calculateRemoteLocationMatch(
      job.workMode,
      job.location || '',
      profile.personal.remotePreference,
      profile.personal.preferredLocations
    ),
    employmentType: calculateEmploymentTypeMatch(job.employmentType || '', profile.professional.employmentType),
    salaryMatch: calculateSalaryMatch(job.salary, profile.professional.desiredSalary),
    seniorityMatch: calculateSeniorityMatch(job.title, profile.professional.yearsOfExperience),
    jobFreshness: calculateFreshness(job.postedAt),
  };

  const deterministicScore = Math.round(
    scoreBreakdown.titleRelevance * WEIGHTS.titleRelevance +
    scoreBreakdown.technologyMatch * WEIGHTS.technologyMatch +
    scoreBreakdown.experienceMatch * WEIGHTS.experienceMatch +
    scoreBreakdown.remoteLocationMatch * WEIGHTS.remoteLocationMatch +
    scoreBreakdown.employmentType * WEIGHTS.employmentType +
    scoreBreakdown.salaryMatch * WEIGHTS.salaryMatch +
    scoreBreakdown.seniorityMatch * WEIGHTS.seniorityMatch +
    scoreBreakdown.jobFreshness * WEIGHTS.jobFreshness
  );

  const profileSkillSet = new Set(allProfileSkills.map((s) => s.toLowerCase()));
  const matchedSkills = job.skills.filter((s) => profileSkillSet.has(s.toLowerCase()));
  const missingSkills = job.skills.filter((s) => !profileSkillSet.has(s.toLowerCase()));

  return {
    jobId: job.id,
    deterministicScore,
    finalScore: deterministicScore,
    matchedSkills,
    missingSkills,
    strengths: scoreBreakdown.titleRelevance > 70 ? ['Strong title match'] : [],
    concerns: scoreBreakdown.experienceMatch < 40 ? ['Experience level may not match'] : [],
    recommendation: getRecommendation(deterministicScore),
    scoreBreakdown,
    analyzedAt: new Date().toISOString(),
  };
}

export function isHighMatch(score: number, minimumScore: number): boolean {
  return score >= minimumScore;
}

export { getScoreLabel };
