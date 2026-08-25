import { useState, useEffect, useCallback } from 'react';
import { sendMessage } from '../../lib/messaging';
import type { Profile } from '../../lib/schemas/profile';
import type { AIProviderConfig } from '../../lib/schemas/ai';
import type { Application } from '../../lib/schemas/application';
import type { Job } from '../../lib/schemas/job';
import { computeAnalytics } from '../../lib/analytics';
import { formatExportData, formatApplicationsCSV, downloadExport } from '../../lib/export';
import type { AppSettings } from '../../lib/storage';

type Tab = 'profile' | 'preferences' | 'ai' | 'privacy' | 'data';

export function OptionsApp() {
  const [tab, setTab] = useState<Tab>('profile');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [aiConfig, setAiConfig] = useState<AIProviderConfig | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');

  const loadData = useCallback(async () => {
    const [profileRes, aiRes, appsRes, jobsRes, settingsRes] = await Promise.all([
      sendMessage({ type: 'GET_PROFILE' }),
      sendMessage({ type: 'GET_AI_CONFIG' }),
      sendMessage({ type: 'GET_APPLICATIONS' }),
      sendMessage({ type: 'GET_JOBS' }),
      sendMessage({ type: 'GET_SETTINGS' }),
    ]);
    if (profileRes.success && profileRes.data) setProfile(profileRes.data as Profile);
    if (aiRes.success && aiRes.data) setAiConfig(aiRes.data as AIProviderConfig);
    if (appsRes.success && appsRes.data) setApplications(appsRes.data as Application[]);
    if (jobsRes.success && jobsRes.data) setJobs(jobsRes.data as Job[]);
    if (settingsRes.success && settingsRes.data) setTheme((settingsRes.data as { theme?: 'dark' | 'light' | 'system' }).theme || 'dark');
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const showSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-zinc-700 border-t-blue-500 rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-3xl mx-auto p-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span className="text-blue-500">⚡</span> OpenApply Settings
          </h1>
        </header>

        <nav className="flex gap-1 mb-6 bg-zinc-900 rounded-lg p-1">
          {(['profile', 'preferences', 'ai', 'privacy', 'data'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 px-3 rounded-md text-sm capitalize transition-colors ${
                tab === t ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </nav>

        {saved && (
          <div className="mb-4 p-3 bg-green-900/30 border border-green-800 rounded-lg text-sm text-green-400">
            Saved successfully!
          </div>
        )}

        {tab === 'profile' && profile && (
          <ProfileTab profile={profile} setProfile={setProfile} onSave={showSaved} />
        )}
        {tab === 'ai' && (
          <AITab config={aiConfig} setConfig={setAiConfig} onSave={showSaved} />
        )}
        {tab === 'preferences' && profile && (
          <PreferencesTab profile={profile} setProfile={setProfile} theme={theme} onThemeChange={setTheme} onSave={showSaved} />
        )}
        {tab === 'privacy' && <PrivacyTab />}
        {tab === 'data' && <DataTab applications={applications} jobs={jobs} profile={profile} onRefresh={loadData} />}
      </div>
    </div>
  );
}

function ProfileTab({
  profile,
  setProfile,
  onSave,
}: {
  profile: Profile;
  setProfile: (p: Profile) => void;
  onSave: () => void;
}) {
  const [form, setForm] = useState({
    fullName: profile.personal.fullName,
    email: profile.personal.email,
    phone: profile.personal.phone || '',
    currentLocation: profile.personal.currentLocation || '',
    linkedinUrl: profile.personal.linkedinUrl || '',
    githubUrl: profile.personal.githubUrl || '',
    portfolioUrl: profile.personal.portfolioUrl || '',
    currentTitle: profile.professional.currentTitle || '',
    yearsOfExperience: profile.professional.yearsOfExperience || 0,
    desiredTitles: profile.professional.desiredTitles.join(', '),
    skills: profile.professional.skills.join(', '),
    programmingLanguages: profile.professional.programmingLanguages.join(', '),
    frameworks: profile.professional.frameworks.join(', '),
    databases: profile.professional.databases.join(', '),
    cloud: profile.professional.cloud.join(', '),
    tools: profile.professional.tools.join(', '),
  });

  const handleSave = async () => {
    const now = new Date().toISOString();
    const updated: Profile = {
      ...profile,
      personal: {
        ...profile.personal,
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        currentLocation: form.currentLocation,
        linkedinUrl: form.linkedinUrl,
        githubUrl: form.githubUrl,
        portfolioUrl: form.portfolioUrl,
      },
      professional: {
        ...profile.professional,
        currentTitle: form.currentTitle,
        yearsOfExperience: form.yearsOfExperience,
        desiredTitles: form.desiredTitles.split(',').map((s) => s.trim()).filter(Boolean),
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
        programmingLanguages: form.programmingLanguages.split(',').map((s) => s.trim()).filter(Boolean),
        frameworks: form.frameworks.split(',').map((s) => s.trim()).filter(Boolean),
        databases: form.databases.split(',').map((s) => s.trim()).filter(Boolean),
        cloud: form.cloud.split(',').map((s) => s.trim()).filter(Boolean),
        tools: form.tools.split(',').map((s) => s.trim()).filter(Boolean),
      },
      updatedAt: now,
    };
    await sendMessage({ type: 'SAVE_PROFILE', payload: updated });
    setProfile(updated);
    onSave();
  };

  return (
    <div className="space-y-4">
      <Section title="Personal Information">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Full Name" value={form.fullName} onChange={(v) => setForm({ ...form, fullName: v })} />
          <Input label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          <Input label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          <Input label="Location" value={form.currentLocation} onChange={(v) => setForm({ ...form, currentLocation: v })} />
          <Input label="LinkedIn URL" value={form.linkedinUrl} onChange={(v) => setForm({ ...form, linkedinUrl: v })} />
          <Input label="GitHub URL" value={form.githubUrl} onChange={(v) => setForm({ ...form, githubUrl: v })} />
        </div>
      </Section>

      <Section title="Professional">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Current Title" value={form.currentTitle} onChange={(v) => setForm({ ...form, currentTitle: v })} />
          <Input label="Years of Experience" value={String(form.yearsOfExperience)} onChange={(v) => setForm({ ...form, yearsOfExperience: Number(v) || 0 })} type="number" />
        </div>
        <TextArea label="Desired Titles" value={form.desiredTitles} onChange={(v) => setForm({ ...form, desiredTitles: v })} />
        <TextArea label="Skills" value={form.skills} onChange={(v) => setForm({ ...form, skills: v })} />
        <TextArea label="Programming Languages" value={form.programmingLanguages} onChange={(v) => setForm({ ...form, programmingLanguages: v })} />
        <TextArea label="Frameworks" value={form.frameworks} onChange={(v) => setForm({ ...form, frameworks: v })} />
        <div className="grid grid-cols-3 gap-3">
          <TextArea label="Databases" value={form.databases} onChange={(v) => setForm({ ...form, databases: v })} />
          <TextArea label="Cloud" value={form.cloud} onChange={(v) => setForm({ ...form, cloud: v })} />
          <TextArea label="Tools" value={form.tools} onChange={(v) => setForm({ ...form, tools: v })} />
        </div>
      </Section>

      <button onClick={handleSave} className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors">
        Save Profile
      </button>
    </div>
  );
}

function AITab({
  config,
  setConfig,
  onSave,
}: {
  config: AIProviderConfig | null;
  setConfig: (c: AIProviderConfig) => void;
  onSave: () => void;
}) {
  const [form, setForm] = useState({
    provider: config?.provider || 'mock' as const,
    apiKey: config?.apiKey || '',
    model: config?.model || '',
    baseUrl: config?.baseUrl || '',
    temperature: config?.temperature ?? 0.3,
    maxTokens: config?.maxTokens ?? 1024,
    localEndpoint: config?.localEndpoint || 'http://localhost:11434',
  });

  const handleSave = async () => {
    const updated: AIProviderConfig = {
      provider: form.provider,
      apiKey: form.apiKey,
      model: form.model,
      baseUrl: form.baseUrl,
      temperature: form.temperature,
      maxTokens: form.maxTokens,
      localEndpoint: form.localEndpoint,
    };
    await sendMessage({ type: 'SAVE_AI_CONFIG', payload: updated });
    setConfig(updated);
    onSave();
  };

  return (
    <div className="space-y-4">
      <Section title="AI Provider">
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Provider"
            value={form.provider}
            options={[
              { value: 'mock', label: 'Mock (Testing)' },
              { value: 'groq', label: 'Groq' },
              { value: 'openai-compatible', label: 'OpenAI Compatible' },
              { value: 'local', label: 'Local AI' },
            ]}
            onChange={(v) => setForm({ ...form, provider: v as typeof form.provider })}
          />
          <Input label="Model" value={form.model} onChange={(v) => setForm({ ...form, model: v })} />
        </div>
        {form.provider !== 'local' && form.provider !== 'mock' && (
          <Input label="API Key" value={form.apiKey} onChange={(v) => setForm({ ...form, apiKey: v })} type="password" />
        )}
        {form.provider === 'openai-compatible' && (
          <Input label="Base URL" value={form.baseUrl} onChange={(v) => setForm({ ...form, baseUrl: v })} />
        )}
        {form.provider === 'local' && (
          <Input label="Local Endpoint" value={form.localEndpoint} onChange={(v) => setForm({ ...form, localEndpoint: v })} />
        )}
        <div className="grid grid-cols-2 gap-3">
          <Input label="Temperature" value={String(form.temperature)} onChange={(v) => setForm({ ...form, temperature: Number(v) || 0.3 })} type="number" />
          <Input label="Max Tokens" value={String(form.maxTokens)} onChange={(v) => setForm({ ...form, maxTokens: Number(v) || 1024 })} type="number" />
        </div>
      </Section>
      <button onClick={handleSave} className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors">
        Save AI Settings
      </button>
    </div>
  );
}

function PreferencesTab({
  profile,
  setProfile,
  theme,
  onThemeChange,
  onSave,
}: {
  profile: Profile;
  setProfile: (p: Profile) => void;
  theme: 'dark' | 'light' | 'system';
  onThemeChange: (t: 'dark' | 'light' | 'system') => void;
  onSave: () => void;
}) {
  const [prefs, setPrefs] = useState({
    desiredTitles: profile.professional.desiredTitles.join(', '),
    preferredLocations: profile.personal.preferredLocations.join(', '),
    remoteOnly: profile.personal.remotePreference,
    employmentType: profile.professional.employmentType || 'full-time',
  });

  const handleSave = async () => {
    const now = new Date().toISOString();
    const updated: Profile = {
      ...profile,
      personal: {
        ...profile.personal,
        preferredLocations: prefs.preferredLocations.split(',').map((s) => s.trim()).filter(Boolean),
        remotePreference: prefs.remoteOnly,
      },
      professional: {
        ...profile.professional,
        desiredTitles: prefs.desiredTitles.split(',').map((s) => s.trim()).filter(Boolean),
        employmentType: prefs.employmentType as Profile['professional']['employmentType'],
      },
      updatedAt: now,
    };
    await sendMessage({ type: 'SAVE_PROFILE', payload: updated });
    setProfile(updated);
    onSave();
  };

  const handleThemeChange = async (t: 'dark' | 'light' | 'system') => {
    onThemeChange(t);
    const res = await sendMessage({ type: 'GET_SETTINGS' });
    if (res.success && res.data) {
      const current = res.data as AppSettings;
      await sendMessage({ type: 'SAVE_SETTINGS', payload: { ...current, theme: t } });
    }
  };

  return (
    <div className="space-y-4">
      <Section title="Appearance">
        <div className="space-y-2">
          {(['dark', 'light', 'system'] as const).map((t) => (
            <button
              key={t}
              onClick={() => handleThemeChange(t)}
              className={`w-full py-2 rounded-lg text-sm transition-colors capitalize ${
                theme === t ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              {t === 'system' ? 'System (auto)' : t}
            </button>
          ))}
        </div>
      </Section>
      <Section title="Job Preferences">
        <div className="space-y-3">
          <TextArea label="Desired Titles" value={prefs.desiredTitles} onChange={(v) => setPrefs({ ...prefs, desiredTitles: v })} />
          <TextArea label="Preferred Locations" value={prefs.preferredLocations} onChange={(v) => setPrefs({ ...prefs, preferredLocations: v })} />
          <div className="flex items-center justify-between bg-zinc-800 rounded-lg p-3">
            <span className="text-sm text-zinc-300">Remote Only</span>
            <button
              onClick={() => setPrefs({ ...prefs, remoteOnly: !prefs.remoteOnly })}
              className={`w-10 h-5 rounded-full transition-colors relative ${prefs.remoteOnly ? 'bg-blue-600' : 'bg-zinc-700'}`}
            >
              <span className={`absolute w-4 h-4 rounded-full bg-white top-0.5 transition-transform ${prefs.remoteOnly ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <Select
            label="Employment Type"
            value={prefs.employmentType}
            options={[
              { value: 'full-time', label: 'Full-time' },
              { value: 'part-time', label: 'Part-time' },
              { value: 'contract', label: 'Contract' },
              { value: 'freelance', label: 'Freelance' },
              { value: 'internship', label: 'Internship' },
            ]}
            onChange={(v) => setPrefs({ ...prefs, employmentType: v as typeof prefs.employmentType })}
          />
        </div>
      </Section>
      <button onClick={handleSave} className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors">
        Save Preferences
      </button>
    </div>
  );
}

function DataTab({
  applications,
  jobs,
  profile,
  onRefresh,
}: {
  applications: Application[];
  jobs: Job[];
  profile: Profile | null;
  onRefresh: () => void;
}) {
  const [exporting, setExporting] = useState(false);

  const analytics = computeAnalytics(applications, jobs);

  const handleExport = async () => {
    setExporting(true);
    const data = formatExportData(profile, jobs, applications);
    const filename = `openapply-export-${new Date().toISOString().split('T')[0]}.json`;
    downloadExport(data, filename);
    setTimeout(() => setExporting(false), 1000);
  };

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const data = JSON.parse(text);
        if (data.profile) await sendMessage({ type: 'SAVE_PROFILE', payload: data.profile });
        if (data.jobs) {
          for (const job of data.jobs) {
            await sendMessage({ type: 'SAVE_JOB', payload: job });
          }
        }
        if (data.applications) {
          for (const app of data.applications) {
            await sendMessage({ type: 'SAVE_APPLICATION', payload: app });
          }
        }
        onRefresh();
      } catch {
        alert('Invalid import file');
      }
    };
    input.click();
  };

  return (
    <div className="space-y-4">
      <Section title="Analytics">
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Total Applied" value={analytics.statusCounts['applied'] || 0} />
          <StatCard label="Interviews" value={analytics.statusCounts['interviewing'] || 0} />
          <StatCard label="Offers" value={analytics.statusCounts['offer'] || 0} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Rejected" value={analytics.statusCounts['rejected'] || 0} />
          <StatCard label="Avg Response (days)" value={analytics.averageTimeToResponse ?? 'N/A'} />
        </div>
        {analytics.topCompanies.length > 0 && (
          <div className="mt-3">
            <h4 className="text-xs text-zinc-400 mb-2">Top Companies</h4>
            {analytics.topCompanies.map((c) => (
              <div key={c.company} className="flex justify-between text-sm py-1">
                <span className="text-zinc-300">{c.company}</span>
                <span className="text-zinc-500">{c.count}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Export / Import">
        <p className="text-sm text-zinc-400 mb-3">
          Export all your data as JSON or CSV, or import from a previous JSON export.
        </p>
        <div className="space-y-2">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors"
          >
            {exporting ? 'Exporting...' : 'Export All Data (JSON)'}
          </button>
          <button
            onClick={() => {
              const csv = formatApplicationsCSV(applications, jobs);
              const filename = `openapply-applications-${new Date().toISOString().split('T')[0]}.csv`;
              downloadExport(csv, filename, 'text/csv');
            }}
            className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors"
          >
            Export Applications (CSV)
          </button>
          <button
            onClick={handleImport}
            className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors"
          >
            Import Data
          </button>
        </div>
      </Section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-zinc-800 rounded-lg p-3">
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-zinc-400">{label}</div>
    </div>
  );
}

function PrivacyTab() {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleClearAll = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    await sendMessage({ type: 'CLEAR_ALL_DATA' });
    window.location.reload();
  };

  return (
    <div className="space-y-4">
      <Section title="Privacy Policy">
        <div className="space-y-2 text-sm text-zinc-300">
          <p>OpenApply is designed with privacy as a core principle.</p>
          <ul className="space-y-1 ml-4 list-disc text-zinc-400">
            <li>All profile data is stored locally in your browser via chrome.storage.local</li>
            <li>No data is sent to any server except the AI provider you configure</li>
            <li>No analytics, tracking, or third-party data sharing</li>
            <li>Job page content is read locally to extract job information</li>
            <li>You can delete all data at any time below</li>
          </ul>
        </div>
      </Section>

      <Section title="Data Management">
        <p className="text-sm text-zinc-400">
          All data is stored locally in your browser via chrome.storage.local.
          No data is sent to any server except the AI provider you configure.
        </p>
        <div className="mt-3 space-y-2">
          <button className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors">
            Export All Data
          </button>
          <button
            onClick={handleClearAll}
            className={`w-full py-2 rounded-lg text-sm transition-colors ${
              confirmDelete
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-red-900/30 hover:bg-red-900/50 border border-red-800 text-red-400'
            }`}
          >
            {confirmDelete ? 'Click again to confirm deletion' : 'Delete All Data'}
          </button>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-zinc-900 rounded-lg p-4">
      <h3 className="text-sm font-semibold mb-3 text-white">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-zinc-400 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs text-zinc-400 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="comma separated"
        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
      />
    </div>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs text-zinc-400 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
