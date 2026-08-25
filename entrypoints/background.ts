import { initMessageListener, registerHandlers } from '../lib/messaging';
import { createProvider } from '../lib/ai';
import { generateAnswer, generateJobAnalysis } from '../lib/ai/answer-engine';
import {
  getProfile,
  saveProfile,
  getJobs,
  saveJob,
  getSavedJobs,
  saveSavedJob,
  removeSavedJob,
  getApplications,
  saveApplication,
  updateApplicationStatus,
  deleteApplication,
  getAIConfig,
  saveAIConfig,
  getSettings,
  saveSettings,
  clearAllData,
  exportAllData,
  migrateIfNeeded,
  type AppSettings,
} from '../lib/storage';

async function extractJobFromActiveTab(): Promise<unknown> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error('No active tab found');

  const response = await chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_JOB' });
  if (!response?.success) throw new Error(response?.error || 'Extraction failed');
  return response.data;
}

export default defineBackground(() => {
  console.log('[OpenApply] Background service worker started');

  migrateIfNeeded().catch(console.error);

  // Periodic migration check via chrome.alarms
  chrome.alarms.create('openapply-migrate', { periodInMinutes: 60 });
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'openapply-migrate') {
      migrateIfNeeded().catch(console.error);
    }
  });

  registerHandlers({
    GET_PROFILE: () => getProfile(),
    SAVE_PROFILE: (profile) => saveProfile(profile),
    GET_JOBS: () => getJobs(),
    SAVE_JOB: (job) => saveJob(job),
    GET_SAVED_JOBS: () => getSavedJobs(),
    SAVE_SAVED_JOB: (savedJob) => saveSavedJob(savedJob),
    REMOVE_SAVED_JOB: (payload) => removeSavedJob(payload.jobId),
    GET_APPLICATIONS: () => getApplications(),
    SAVE_APPLICATION: (app) => saveApplication(app),
    UPDATE_APPLICATION_STATUS: (payload) => updateApplicationStatus(payload.id, payload.status, payload.note),
    DELETE_APPLICATION: (payload) => deleteApplication(payload.id),
    GET_AI_CONFIG: () => getAIConfig(),
    SAVE_AI_CONFIG: (config) => saveAIConfig(config),
    GET_SETTINGS: () => getSettings(),
    SAVE_SETTINGS: (settings) => saveSettings(settings as AppSettings),
    EXPORT_DATA: () => exportAllData(),
    CLEAR_ALL_DATA: () => clearAllData(),
    EXTRACT_JOB: () => extractJobFromActiveTab(),
    AI_ANALYZE_JOB: async (payload) => {
      const config = await getAIConfig();
      const provider = createProvider(config);
      const profile = await getProfile();
      if (!profile) throw new Error('No profile configured');
      return generateJobAnalysis(
        provider, profile,
        payload.jobTitle, payload.jobDescription, payload.skills
      );
    },
    AI_ANSWER_QUESTION: async (payload) => {
      const config = await getAIConfig();
      const provider = createProvider(config);
      const profile = await getProfile();
      if (!profile) throw new Error('No profile configured');
      return generateAnswer(
        provider, payload.question, profile, payload.jobDescription
      );
    },
  });

  initMessageListener();

  chrome.runtime.onInstalled.addListener((details) => {
    console.log('[OpenApply] Extension installed / reloaded', details.reason);
    chrome.contextMenus?.removeAll(() => {
      chrome.contextMenus?.create({
        id: 'openapply-analyze',
        title: 'Analyze this job with OpenApply',
        contexts: ['page', 'selection'],
      });
      chrome.contextMenus?.create({
        id: 'openapply-save',
        title: 'Save job to OpenApply',
        contexts: ['page', 'selection'],
      });
    });
    if (details.reason === 'install') {
      chrome.tabs.create({ url: chrome.runtime.getURL('onboarding.html') });
    }
  });

  chrome.commands?.onCommand?.addListener((command) => {
    if (command === 'open-side-panel') {
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        if (tab?.id) {
          chrome.sidePanel.open({ tabId: tab.id });
        }
      });
    }
    if (command === 'analyze-job') {
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        if (tab?.id) {
          chrome.sidePanel.open({ tabId: tab.id });
          chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_JOB' });
        }
      });
    }
    if (command === 'autofill-form') {
      chrome.tabs.query({ active: true, currentWindow: true }, async ([tab]) => {
        if (tab?.id) {
          const profile = await getProfile();
          if (!profile) return;

          const fields = await chrome.tabs.sendMessage(tab.id, { type: 'DETECT_FORM' });
          if (fields?.data) {
            const fieldMap: Record<string, string> = {};
            for (const field of fields.data) {
              const values: Record<string, string> = {
                first_name: profile.personal.fullName.split(' ')[0] || '',
                last_name: profile.personal.fullName.split(' ').slice(1).join(' ') || '',
                full_name: profile.personal.fullName,
                email: profile.personal.email,
                phone: profile.personal.phone || '',
                location: profile.personal.currentLocation || '',
                linkedin: profile.personal.linkedinUrl || '',
                github: profile.personal.githubUrl || '',
                portfolio: profile.personal.portfolioUrl || '',
                current_company: '',
                current_title: profile.professional.currentTitle || '',
                years_experience: profile.professional.yearsOfExperience?.toString() || '',
                education: '',
                degree: '',
                bio: profile.applicationAnswers.whyHireYou || '',
              };
              if (values[field.fieldType]) {
                fieldMap[field.fieldType] = values[field.fieldType];
              }
            }
            chrome.tabs.sendMessage(tab.id, { type: 'FILL_FORM', payload: fieldMap });
          }
        }
      });
    }
  });

  chrome.contextMenus?.onClicked?.addListener((info, tab) => {
    if (info.menuItemId === 'openapply-analyze') {
      if (tab?.id) {
        chrome.sidePanel.open({ tabId: tab.id });
      }
    }
    if (info.menuItemId === 'openapply-save') {
      if (tab?.id) {
        chrome.sidePanel.open({ tabId: tab.id });
        chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_JOB' });
      }
    }
  });
});
