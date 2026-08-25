import { create } from 'zustand';
import { sendMessage } from './messaging';
import type { Profile } from './schemas/profile';
import type { Job, JobMatch } from './schemas/job';
import type { Application, ApplicationStatusType } from './schemas/application';
import type { QuestionAnswer } from './schemas/ai';
import { calculateMatch } from './matching/scorer';
import { generateJobId, generateFingerprint } from './utils';
import { createEmptyProfile } from './schemas/profile';
import { createApplication } from './schemas/application';

export type SideTab = 'analyze' | 'tracker' | 'answers';

interface ExtractedJobData {
  source: string;
  title: string;
  company: string;
  location: string;
  description: string;
  skills: string[];
  url: string;
  workMode: string;
  easyApply?: boolean;
}

interface SidePanelState {
  tab: SideTab;
  profile: Profile;
  job: Job | null;
  match: JobMatch | null;
  extractedData: ExtractedJobData | null;
  loading: boolean;
  error: string | null;
  applications: Application[];
  jobs: Job[];
  selectedApp: Application | null;
  statusFilter: string;
  answers: Record<string, QuestionAnswer & { edited?: string }>;
  answerLoading: boolean;

  setTab: (tab: SideTab) => void;
  setStatusFilter: (filter: string) => void;
  setSelectedApp: (app: Application | null) => void;
  loadProfile: () => Promise<void>;
  loadApplications: () => Promise<void>;
  extractJob: () => Promise<void>;
  saveJob: () => Promise<void>;
  updateStatus: (appId: string, status: ApplicationStatusType) => Promise<void>;
  deleteApp: (appId: string) => Promise<void>;
  generateAnswers: (questions: string[]) => Promise<void>;
  editAnswer: (question: string, value: string) => void;
  resetExtracted: () => void;
}

export const useSidePanelStore = create<SidePanelState>((set, get) => ({
  tab: 'analyze',
  profile: createEmptyProfile(),
  job: null,
  match: null,
  extractedData: null,
  loading: false,
  error: null,
  applications: [],
  jobs: [],
  selectedApp: null,
  statusFilter: 'all',
  answers: {},
  answerLoading: false,

  setTab: (tab) => set({ tab }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setSelectedApp: (selectedApp) => set({ selectedApp }),

  loadProfile: async () => {
    const res = await sendMessage({ type: 'GET_PROFILE' });
    if (res.success && res.data) set({ profile: res.data as Profile });
  },

  loadApplications: async () => {
    const [appsRes, jobsRes] = await Promise.all([
      sendMessage({ type: 'GET_APPLICATIONS' }),
      sendMessage({ type: 'GET_JOBS' }),
    ]);
    const updates: Partial<SidePanelState> = {};
    if (appsRes.success && appsRes.data) updates.applications = appsRes.data as Application[];
    if (jobsRes.success && jobsRes.data) updates.jobs = jobsRes.data as Job[];
    set(updates);
  },

  extractJob: async () => {
    set({ loading: true, error: null });
    try {
      const res = await sendMessage({ type: 'EXTRACT_JOB' });
      if (res.success && res.data) {
        const data = res.data as ExtractedJobData;
        const { profile } = get();
        const jobRecord: Job = {
          id: generateJobId(data.source, data.url, data.title, data.company),
          sourceId: data.url.split('/').pop(),
          source: data.source as Job['source'],
          title: data.title,
          company: data.company,
          location: data.location,
          workMode: (data.workMode as Job['workMode']) || 'unknown',
          description: data.description,
          skills: data.skills,
          url: data.url,
          easyApply: data.easyApply || false,
          schemaVersion: 1,
          fingerprint: generateFingerprint(data.company, data.title, data.location),
          createdAt: new Date().toISOString(),
        };
        set({
          extractedData: data,
          job: jobRecord,
          match: calculateMatch(jobRecord, profile),
        });
        await sendMessage({ type: 'SAVE_JOB', payload: jobRecord });
      } else {
        set({ error: (res as { error?: string }).error || 'Could not extract job from this page' });
      }
    } catch (err) {
      set({ error: String(err) });
    }
    set({ loading: false });
  },

  saveJob: async () => {
    const { job, match } = get();
    if (!job || !match) return;
    await sendMessage({
      type: 'SAVE_SAVED_JOB',
      payload: { job, match, status: 'saved', savedAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    });
    const app = createApplication(job.id);
    await sendMessage({ type: 'SAVE_APPLICATION', payload: app });
    await get().loadApplications();
    set({ tab: 'tracker' });
  },

  updateStatus: async (appId, status) => {
    await sendMessage({ type: 'UPDATE_APPLICATION_STATUS', payload: { id: appId, status } });
    await get().loadApplications();
  },

  deleteApp: async (appId) => {
    await sendMessage({ type: 'DELETE_APPLICATION', payload: { id: appId } });
    await get().loadApplications();
    set({ selectedApp: null });
  },

  generateAnswers: async (questions) => {
    const { job } = get();
    if (!job) return;
    set({ answerLoading: true });
    const newAnswers: Record<string, QuestionAnswer & { edited?: string }> = {};
    for (const q of questions) {
      try {
        const res = await sendMessage({
          type: 'AI_ANSWER_QUESTION',
          payload: { question: q, jobDescription: job.description || '' },
        });
        if (res.success && res.data) {
          newAnswers[q] = res.data as QuestionAnswer;
        }
      } catch {
        // skip
      }
    }
    set({ answers: newAnswers, answerLoading: false, tab: 'answers' });
  },

  editAnswer: (question, value) => {
    const { answers } = get();
    if (answers[question]) {
      set({ answers: { ...answers, [question]: { ...answers[question], edited: value } } });
    }
  },

  resetExtracted: () => set({ extractedData: null, job: null, match: null, error: null }),
}));
