import { z } from 'zod';

export const PersonalInfoSchema = z.object({
  fullName: z.string().default(''),
  email: z.string().default(''),
  phone: z.string().optional(),
  currentLocation: z.string().optional(),
  preferredLocations: z.array(z.string()).default([]),
  remotePreference: z.boolean().default(true),
  workAuthorization: z.string().optional(),
  visaSponsorshipPreference: z.boolean().default(false),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  githubUrl: z.string().url().optional().or(z.literal('')),
  portfolioUrl: z.string().url().optional().or(z.literal('')),
});

export const EducationEntrySchema = z.object({
  id: z.string(),
  school: z.string(),
  degree: z.string().optional(),
  fieldOfStudy: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  gpa: z.string().optional(),
  description: z.string().optional(),
});

export const ExperienceEntrySchema = z.object({
  id: z.string(),
  company: z.string(),
  title: z.string(),
  location: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isCurrent: z.boolean().default(false),
  description: z.string().optional(),
  skills: z.array(z.string()).default([]),
});

export const ProfessionalInfoSchema = z.object({
  summary: z.string().optional(),
  currentTitle: z.string().optional(),
  yearsOfExperience: z.number().min(0).max(50).optional(),
  desiredTitles: z.array(z.string()).default([]),
  desiredSalary: z.string().optional(),
  noticePeriod: z.string().optional(),
  employmentType: z
    .enum(['full-time', 'part-time', 'contract', 'freelance', 'internship'])
    .default('full-time'),
  education: z.array(EducationEntrySchema).default([]),
  experience: z.array(ExperienceEntrySchema).default([]),
  skills: z.array(z.string()).default([]),
  programmingLanguages: z.array(z.string()).default([]),
  frameworks: z.array(z.string()).default([]),
  databases: z.array(z.string()).default([]),
  cloud: z.array(z.string()).default([]),
  tools: z.array(z.string()).default([]),
});

export const ApplicationAnswersSchema = z.object({
  authorizedToWork: z.string().optional(),
  requireSponsorship: z.string().optional(),
  yearsOfExperienceAnswer: z.string().optional(),
  noticePeriodAnswer: z.string().optional(),
  salaryExpectation: z.string().optional(),
  whyInterested: z.string().optional(),
  whyHireYou: z.string().optional(),
  remoteExperience: z.string().optional(),
  relocationPreference: z.string().optional(),
  customAnswers: z.record(z.string(), z.string()).default({}),
});

export const ProfileSchema = z.object({
  schemaVersion: z.number().default(1),
  personal: PersonalInfoSchema,
  professional: ProfessionalInfoSchema,
  applicationAnswers: ApplicationAnswersSchema,
  resumeText: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type PersonalInfo = z.infer<typeof PersonalInfoSchema>;
export type EducationEntry = z.infer<typeof EducationEntrySchema>;
export type ExperienceEntry = z.infer<typeof ExperienceEntrySchema>;
export type ProfessionalInfo = z.infer<typeof ProfessionalInfoSchema>;
export type ApplicationAnswers = z.infer<typeof ApplicationAnswersSchema>;
export type Profile = z.infer<typeof ProfileSchema>;

export function createEmptyProfile(): Profile {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    personal: {
      fullName: '',
      email: '',
      phone: '',
      currentLocation: '',
      preferredLocations: [],
      remotePreference: true,
      workAuthorization: '',
      visaSponsorshipPreference: false,
      linkedinUrl: '',
      githubUrl: '',
      portfolioUrl: '',
    },
    professional: {
      summary: '',
      currentTitle: '',
      yearsOfExperience: 0,
      desiredTitles: [],
      desiredSalary: '',
      noticePeriod: '',
      employmentType: 'full-time',
      education: [],
      experience: [],
      skills: [],
      programmingLanguages: [],
      frameworks: [],
      databases: [],
      cloud: [],
      tools: [],
    },
    applicationAnswers: {
      authorizedToWork: '',
      requireSponsorship: '',
      yearsOfExperienceAnswer: '',
      noticePeriodAnswer: '',
      salaryExpectation: '',
      whyInterested: '',
      whyHireYou: '',
      remoteExperience: '',
      relocationPreference: '',
      customAnswers: {},
    },
    createdAt: now,
    updatedAt: now,
  };
}
