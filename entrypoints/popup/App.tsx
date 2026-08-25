import { useState, useEffect, useCallback } from 'react';
import { sendMessage } from '../../lib/messaging';
import type { Profile } from '../../lib/schemas/profile';
import type { SavedJob } from '../../lib/schemas/job';
import type { Application } from '../../lib/schemas/application';

type View = 'home' | 'profile' | 'settings';

export function App() {
  const [view, setView] = useState<View>('home');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ jobsToday: 0, matched: 0, saved: 0 });

  const loadProfile = useCallback(async () => {
    const response = await sendMessage({ type: 'GET_PROFILE' });
    if (response.success && response.data) {
      setProfile(response.data as Profile);
    }
    setLoading(false);
  }, []);

  const loadStats = useCallback(async () => {
    const [savedJobsRes, appsRes] = await Promise.all([
      sendMessage({ type: 'GET_SAVED_JOBS' }),
      sendMessage({ type: 'GET_APPLICATIONS' }),
    ]);
    const savedJobs = (savedJobsRes.success ? savedJobsRes.data : []) as SavedJob[];
    const applications = (appsRes.success ? appsRes.data : []) as Application[];

    const today = new Date().toDateString();
    const jobsToday = savedJobs.filter((s) => new Date(s.savedAt).toDateString() === today).length;
    const matched = savedJobs.filter((s) => s.match && s.match.finalScore >= 70).length;

    setStats({ jobsToday, matched, saved: applications.length });
  }, []);

  useEffect(() => {
    loadProfile();
    loadStats();
  }, [loadProfile, loadStats]);

  const profileComplete = profile
    ? Math.round(
        ((profile.personal.fullName ? 1 : 0) +
          (profile.personal.email ? 1 : 0) +
          (profile.professional.currentTitle ? 1 : 0) +
          (profile.professional.skills.length ? 1 : 0) +
          (profile.professional.desiredTitles.length ? 1 : 0)) /
          5 *
          100
      )
    : 0;

  if (loading) {
    return (
      <div className="w-80 min-h-[400px] flex items-center justify-center bg-zinc-950 text-zinc-400">
        <div className="text-center">
          <div className="animate-spin w-6 h-6 border-2 border-zinc-700 border-t-blue-500 rounded-full mx-auto mb-3" />
          <p className="text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (view === 'profile') {
    return <ProfileView profile={profile} onBack={() => setView('home')} onSave={setProfile} />;
  }

  if (view === 'settings') {
    return <SettingsView onBack={() => setView('home')} />;
  }

  return (
    <div className="w-80 min-h-[400px] bg-zinc-950 text-zinc-100 p-4">
      <header className="mb-4">
        <h1 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="text-blue-500">⚡</span> OpenApply
        </h1>
        <div className="flex items-center gap-2 mt-2 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            AI Ready
          </span>
          <span className="text-zinc-500">•</span>
          <span>Profile: {profileComplete}%</span>
        </div>
      </header>

      <div className="space-y-3 mb-4">
        <StatCard label="Jobs Today" value={stats.jobsToday} sub="discovered" />
        <StatCard label="Matched" value={stats.matched} sub="jobs" />
        <StatCard label="Saved" value={stats.saved} sub="jobs" />
      </div>

      <div className="space-y-2">
        <ActionButton label="Find Jobs" onClick={() => {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id) {
              chrome.sidePanel.open({ tabId: tabs[0].id });
            }
          });
        }} />
        <ActionButton
          label="Analyze Current Job"
          onClick={() => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              if (tabs[0]?.id) {
                chrome.sidePanel.open({ tabId: tabs[0].id });
              }
            });
          }}
        />
        <ActionButton label="Application Tracker" onClick={() => {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id) {
              chrome.sidePanel.open({ tabId: tabs[0].id });
            }
          });
        }} />
        <div className="flex gap-2">
          <button
            onClick={() => setView('profile')}
            className="flex-1 py-2 px-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors"
          >
            Profile
          </button>
          <button
            onClick={() => setView('settings')}
            className="flex-1 py-2 px-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors"
          >
            Settings
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <div className="bg-zinc-900 rounded-lg p-3 flex items-center justify-between">
      <span className="text-sm text-zinc-400">{label}</span>
      <div className="text-right">
        <span className="text-xl font-bold text-white">{value}</span>
        <span className="text-xs text-zinc-500 ml-1">{sub}</span>
      </div>
    </div>
  );
}

function ActionButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
    >
      {label}
    </button>
  );
}

function ProfileView({
  profile,
  onBack,
  onSave,
}: {
  profile: Profile | null;
  onBack: () => void;
  onSave: (p: Profile) => void;
}) {
  const [form, setForm] = useState({
    fullName: profile?.personal.fullName || '',
    email: profile?.personal.email || '',
    phone: profile?.personal.phone || '',
    currentTitle: profile?.professional.currentTitle || '',
    skills: profile?.professional.skills.join(', ') || '',
    desiredTitles: profile?.professional.desiredTitles.join(', ') || '',
  });

  const handleSave = async () => {
    const now = new Date().toISOString();
    const updated: Profile = {
      schemaVersion: 1,
      personal: {
        ...profile?.personal,
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        preferredLocations: profile?.personal.preferredLocations || [],
        remotePreference: profile?.personal.remotePreference ?? true,
        workAuthorization: profile?.personal.workAuthorization || '',
        visaSponsorshipPreference: profile?.personal.visaSponsorshipPreference ?? false,
        linkedinUrl: profile?.personal.linkedinUrl || '',
        githubUrl: profile?.personal.githubUrl || '',
        portfolioUrl: profile?.personal.portfolioUrl || '',
      },
      professional: {
        ...profile?.professional,
        currentTitle: form.currentTitle,
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
        desiredTitles: form.desiredTitles.split(',').map((s) => s.trim()).filter(Boolean),
        education: profile?.professional.education || [],
        experience: profile?.professional.experience || [],
        programmingLanguages: profile?.professional.programmingLanguages || [],
        frameworks: profile?.professional.frameworks || [],
        databases: profile?.professional.databases || [],
        cloud: profile?.professional.cloud || [],
        tools: profile?.professional.tools || [],
        employmentType: profile?.professional.employmentType || 'full-time',
      },
      applicationAnswers: profile?.applicationAnswers || {
        customAnswers: {},
      },
      createdAt: profile?.createdAt || now,
      updatedAt: now,
    };
    await sendMessage({ type: 'SAVE_PROFILE', payload: updated });
    onSave(updated);
    onBack();
  };

  return (
    <div className="w-80 min-h-[400px] bg-zinc-950 text-zinc-100 p-4">
      <header className="flex items-center gap-2 mb-4">
        <button onClick={onBack} className="text-zinc-400 hover:text-white">←</button>
        <h2 className="text-lg font-bold">Profile</h2>
      </header>

      <div className="space-y-3">
        <Field label="Full Name" value={form.fullName} onChange={(v) => setForm({ ...form, fullName: v })} />
        <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
        <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
        <Field label="Current Title" value={form.currentTitle} onChange={(v) => setForm({ ...form, currentTitle: v })} />
        <Field label="Skills (comma separated)" value={form.skills} onChange={(v) => setForm({ ...form, skills: v })} />
        <Field label="Desired Titles (comma separated)" value={form.desiredTitles} onChange={(v) => setForm({ ...form, desiredTitles: v })} />
      </div>

      <button
        onClick={handleSave}
        className="w-full mt-4 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
      >
        Save Profile
      </button>
    </div>
  );
}

function SettingsView({ onBack }: { onBack: () => void }) {
  return (
    <div className="w-80 min-h-[400px] bg-zinc-950 text-zinc-100 p-4">
      <header className="flex items-center gap-2 mb-4">
        <button onClick={onBack} className="text-zinc-400 hover:text-white">←</button>
        <h2 className="text-lg font-bold">Settings</h2>
      </header>
      <div className="space-y-3 text-sm text-zinc-400">
        <p>Settings will be available in Phase 1.8</p>
      </div>
    </div>
  );
}

function Field({
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
        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
      />
    </div>
  );
}
