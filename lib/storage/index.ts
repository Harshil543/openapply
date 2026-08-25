import { ProfileSchema, type Profile } from '../schemas/profile';
import { JobSchema, type Job, type SavedJob } from '../schemas/job';
import { AIProviderConfigSchema, type AIProviderConfig } from '../schemas/ai';
import { ApplicationSchema, type Application, type ApplicationStatusType } from '../schemas/application';
import { encryptSecret, decryptSecret } from '../crypto';

const STORAGE_KEYS = {
  PROFILE: 'openapply_profile',
  JOBS: 'openapply_jobs',
  SAVED_JOBS: 'openapply_saved_jobs',
  APPLICATIONS: 'openapply_applications',
  AI_CONFIG: 'openapply_ai_config',
  SETTINGS: 'openapply_settings',
  SCHEMA_VERSION: 'openapply_schema_version',
} as const;

const CURRENT_SCHEMA_VERSION = 1;

export interface AppSettings {
  schemaVersion: number;
  minimumMatchScore: number;
  autoFillSafeFields: boolean;
  generateAIAnswers: boolean;
  requireReviewBeforeSubmit: boolean;
  showConfidence: boolean;
  localOnlyMode: boolean;
  theme: 'dark' | 'light' | 'system';
}

function createDefaultSettings(): AppSettings {
  return {
    schemaVersion: 1,
    minimumMatchScore: 70,
    autoFillSafeFields: true,
    generateAIAnswers: true,
    requireReviewBeforeSubmit: true,
    showConfidence: true,
    localOnlyMode: false,
    theme: 'dark',
  };
}

async function getStorage<T>(key: string): Promise<T | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result: Record<string, unknown>) => {
      resolve((result[key] as T) ?? null);
    });
  });
}

async function setStorage<T>(key: string, value: T): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, resolve);
  });
}

async function removeStorage(key: string): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.remove([key], resolve);
  });
}

// Profile
export async function getProfile(): Promise<Profile | null> {
  const raw = await getStorage<unknown>(STORAGE_KEYS.PROFILE);
  if (!raw) return null;
  const result = ProfileSchema.safeParse(raw);
  if (!result.success) {
    console.warn('[OpenApply] Invalid profile data, returning null');
    return null;
  }
  return result.data;
}

export async function saveProfile(profile: Profile): Promise<void> {
  const validated = ProfileSchema.parse(profile);
  await setStorage(STORAGE_KEYS.PROFILE, validated);
}

// Jobs
export async function getJobs(): Promise<Job[]> {
  const raw = await getStorage<unknown[]>(STORAGE_KEYS.JOBS);
  if (!raw || !Array.isArray(raw)) return [];
  return raw
    .map((item) => JobSchema.safeParse(item))
    .filter((r) => r.success)
    .map((r) => r.data);
}

export async function saveJob(job: Job): Promise<void> {
  const jobs = await getJobs();
  const existing = jobs.findIndex((j) => j.id === job.id);
  const validated = JobSchema.parse(job);
  if (existing >= 0) {
    jobs[existing] = validated;
  } else {
    jobs.push(validated);
  }
  await setStorage(STORAGE_KEYS.JOBS, jobs);
}

// Saved Jobs
export async function getSavedJobs(): Promise<SavedJob[]> {
  const raw = await getStorage<unknown[]>(STORAGE_KEYS.SAVED_JOBS);
  if (!raw || !Array.isArray(raw)) return [];
  return raw as SavedJob[];
}

export async function saveSavedJob(savedJob: SavedJob): Promise<void> {
  const saved = await getSavedJobs();
  const existing = saved.findIndex((s) => s.job.id === savedJob.job.id);
  if (existing >= 0) {
    saved[existing] = savedJob;
  } else {
    saved.push(savedJob);
  }
  await setStorage(STORAGE_KEYS.SAVED_JOBS, saved);
}

export async function removeSavedJob(jobId: string): Promise<void> {
  const saved = await getSavedJobs();
  const filtered = saved.filter((s) => s.job.id !== jobId);
  await setStorage(STORAGE_KEYS.SAVED_JOBS, filtered);
}

// Applications
export async function getApplications(): Promise<Application[]> {
  const raw = await getStorage<unknown[]>(STORAGE_KEYS.APPLICATIONS);
  if (!raw || !Array.isArray(raw)) return [];
  return raw
    .map((item) => ApplicationSchema.safeParse(item))
    .filter((r) => r.success)
    .map((r) => r.data);
}

export async function saveApplication(application: Application): Promise<void> {
  const apps = await getApplications();
  const existing = apps.findIndex((a) => a.id === application.id);
  const validated = ApplicationSchema.parse(application);
  if (existing >= 0) {
    apps[existing] = validated;
  } else {
    apps.push(validated);
  }
  await setStorage(STORAGE_KEYS.APPLICATIONS, apps);
}

export async function getApplicationById(id: string): Promise<Application | null> {
  const apps = await getApplications();
  return apps.find((a) => a.id === id) ?? null;
}

export async function getApplicationByJobId(jobId: string): Promise<Application | null> {
  const apps = await getApplications();
  return apps.find((a) => a.jobId === jobId) ?? null;
}

export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatusType,
  note?: string
): Promise<Application | null> {
  const apps = await getApplications();
  const idx = apps.findIndex((a) => a.id === id);
  if (idx === -1) return null;

  const app = apps[idx];
  const now = new Date().toISOString();
  const updated: Application = {
    ...app,
    status,
    lastStatusChange: now,
    timeline: [...app.timeline, { status, timestamp: now, note }],
    updatedAt: now,
    ...(status === 'applied' && !app.appliedAt ? { appliedAt: now } : {}),
  };

  apps[idx] = ApplicationSchema.parse(updated);
  await setStorage(STORAGE_KEYS.APPLICATIONS, apps);
  return updated;
}

export async function deleteApplication(id: string): Promise<void> {
  const apps = await getApplications();
  const filtered = apps.filter((a) => a.id !== id);
  await setStorage(STORAGE_KEYS.APPLICATIONS, filtered);
}

// AI Config (with API key encryption)
export async function getAIConfig(): Promise<AIProviderConfig | null> {
  const raw = await getStorage<unknown>(STORAGE_KEYS.AI_CONFIG);
  if (!raw) return null;
  const result = AIProviderConfigSchema.safeParse(raw);
  if (!result.success) return null;
  const config = result.data;
  if (config.apiKey && config.apiKey.startsWith('enc:')) {
    try {
      config.apiKey = await decryptSecret(config.apiKey.slice(4));
    } catch {
      console.warn('[OpenApply] Failed to decrypt API key');
    }
  }
  return config;
}

export async function saveAIConfig(config: AIProviderConfig): Promise<void> {
  const toStore = { ...config };
  if (toStore.apiKey && !toStore.apiKey.startsWith('enc:')) {
    try {
      toStore.apiKey = 'enc:' + (await encryptSecret(toStore.apiKey));
    } catch {
      console.warn('[OpenApply] Failed to encrypt API key, storing plaintext');
    }
  }
  const validated = AIProviderConfigSchema.parse(toStore);
  await setStorage(STORAGE_KEYS.AI_CONFIG, validated);
}

// Settings
export async function getSettings(): Promise<AppSettings> {
  const raw = await getStorage<unknown>(STORAGE_KEYS.SETTINGS);
  if (!raw) return createDefaultSettings();
  return { ...createDefaultSettings(), ...(raw as Partial<AppSettings>) };
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await setStorage(STORAGE_KEYS.SETTINGS, settings);
}

// Data management
export async function clearAllData(): Promise<void> {
  await new Promise<void>((resolve) => {
    chrome.storage.local.clear(resolve);
  });
}

export async function exportAllData(): Promise<Record<string, unknown>> {
  const [profile, jobs, savedJobs, applications, aiConfig, settings] = await Promise.all([
    getProfile(),
    getJobs(),
    getSavedJobs(),
    getApplications(),
    getAIConfig(),
    getSettings(),
  ]);
  return { profile, jobs, savedJobs, applications, aiConfig, settings };
}

// Schema migration
export async function migrateIfNeeded(): Promise<void> {
  const storedVersion = await getStorage<number>(STORAGE_KEYS.SCHEMA_VERSION);
  if (!storedVersion || storedVersion >= CURRENT_SCHEMA_VERSION) {
    await setStorage(STORAGE_KEYS.SCHEMA_VERSION, CURRENT_SCHEMA_VERSION);
    return;
  }

  // v0 -> v1: Add education/experience arrays to existing profiles
  if (storedVersion < 1) {
    const profile = await getStorage<Profile>(STORAGE_KEYS.PROFILE);
    if (profile && !profile.professional.education) {
      profile.professional.education = [];
      profile.professional.experience = [];
      profile.professional.summary = '';
      await setStorage(STORAGE_KEYS.PROFILE, profile);
    }
  }

  await setStorage(STORAGE_KEYS.SCHEMA_VERSION, CURRENT_SCHEMA_VERSION);
  console.log(`[OpenApply] Schema migrated from v${storedVersion} to v${CURRENT_SCHEMA_VERSION}`);
}
