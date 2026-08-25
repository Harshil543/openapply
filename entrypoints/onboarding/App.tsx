import { useState } from 'react';
import { sendMessage } from '../../lib/messaging';
import { createEmptyProfile, type Profile } from '../../lib/schemas/profile';

type Step = 'welcome' | 'consent' | 'profile' | 'done';

export function OnboardingApp() {
  const [step, setStep] = useState<Step>('welcome');
  const [consented, setConsented] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    currentTitle: '',
    skills: '',
    desiredTitles: '',
  });

  const handleComplete = async () => {
    const profile = createEmptyProfile();
    profile.personal.fullName = form.fullName;
    profile.personal.email = form.email;
    profile.professional.currentTitle = form.currentTitle;
    profile.professional.skills = form.skills.split(',').map((s) => s.trim()).filter(Boolean);
    profile.professional.desiredTitles = form.desiredTitles.split(',').map((s) => s.trim()).filter(Boolean);
    profile.updatedAt = new Date().toISOString();
    await sendMessage({ type: 'SAVE_PROFILE', payload: profile });
    setStep('done');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        {step === 'welcome' && (
          <div className="text-center space-y-6">
            <div className="text-5xl">⚡</div>
            <h1 className="text-2xl font-bold">Welcome to OpenApply</h1>
            <p className="text-zinc-400">
              A free, privacy-first AI job application assistant.
              All your data stays on your device.
            </p>
            <button
              onClick={() => setStep('consent')}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
            >
              Get Started
            </button>
          </div>
        )}

        {step === 'consent' && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold">Your Privacy Matters</h2>
            <div className="bg-zinc-900 rounded-lg p-4 space-y-3 text-sm text-zinc-300">
              <div className="flex gap-3">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>All profile data is stored locally in your browser only</span>
              </div>
              <div className="flex gap-3">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>Job pages you visit are analyzed locally for matching</span>
              </div>
              <div className="flex gap-3">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>AI features only send data to the provider YOU configure</span>
              </div>
              <div className="flex gap-3">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>No analytics, no tracking, no data sold to third parties</span>
              </div>
              <div className="flex gap-3">
                <span className="text-yellow-400 mt-0.5">!</span>
                <span>The extension reads visible page content on job sites to extract job data</span>
              </div>
            </div>
            <label className="flex items-center gap-3 bg-zinc-900 rounded-lg p-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consented}
                onChange={(e) => setConsented(e.target.checked)}
                className="w-4 h-4 rounded bg-zinc-800 border-zinc-700"
              />
              <span className="text-sm text-zinc-300">I understand and consent to the above</span>
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setStep('welcome')}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep('profile')}
                disabled={!consented}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 'profile' && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold">Quick Profile Setup</h2>
            <p className="text-sm text-zinc-400">Optional — you can fill this in later from the extension popup.</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Full Name</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Current Title</label>
                <input
                  type="text"
                  value={form.currentTitle}
                  onChange={(e) => setForm({ ...form, currentTitle: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Skills (comma separated)</label>
                <input
                  type="text"
                  value={form.skills}
                  onChange={(e) => setForm({ ...form, skills: e.target.value })}
                  placeholder="React, TypeScript, Node.js..."
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Desired Titles (comma separated)</label>
                <input
                  type="text"
                  value={form.desiredTitles}
                  onChange={(e) => setForm({ ...form, desiredTitles: e.target.value })}
                  placeholder="Software Engineer, Frontend Developer..."
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep('consent')}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleComplete}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
              >
                {form.fullName ? 'Save & Finish' : 'Skip for Now'}
              </button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="text-center space-y-6">
            <div className="text-5xl">🎉</div>
            <h2 className="text-xl font-bold">You're All Set!</h2>
            <p className="text-zinc-400 text-sm">
              OpenApply is ready. Visit a job posting on LinkedIn, Greenhouse, or Lever
              and click the extension icon to get started.
            </p>
            <div className="space-y-2 text-sm text-zinc-500">
              <p><kbd className="px-2 py-0.5 bg-zinc-800 rounded text-zinc-300">Ctrl+Shift+J</kbd> Open side panel</p>
              <p><kbd className="px-2 py-0.5 bg-zinc-800 rounded text-zinc-300">Ctrl+Shift+A</kbd> Analyze job</p>
              <p><kbd className="px-2 py-0.5 bg-zinc-800 rounded text-zinc-300">Ctrl+Shift+F</kbd> Autofill form</p>
            </div>
            <button
              onClick={() => window.close()}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
            >
              Start Using OpenApply
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
