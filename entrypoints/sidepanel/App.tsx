import { useEffect, useState } from 'react';
import { useSidePanelStore } from '../../lib/store';
import type { Application, ApplicationStatusType } from '../../lib/schemas/application';
import type { Job } from '../../lib/schemas/job';
import { getScoreLabel } from '../../lib/matching/scorer';

const STATUS_COLORS: Record<string, string> = {
  saved: 'bg-zinc-700 text-zinc-300',
  applied: 'bg-blue-900/50 text-blue-400 border border-blue-800',
  interviewing: 'bg-purple-900/50 text-purple-400 border border-purple-800',
  offer: 'bg-green-900/50 text-green-400 border border-green-800',
  rejected: 'bg-red-900/50 text-red-400 border border-red-800',
  withdrawn: 'bg-zinc-800 text-zinc-400 border border-zinc-700',
  ghosted: 'bg-orange-900/30 text-orange-400 border border-orange-800',
};

const NEXT_STATUSES: Record<ApplicationStatusType, ApplicationStatusType[]> = {
  saved: ['applied'],
  applied: ['interviewing', 'rejected', 'withdrawn'],
  interviewing: ['offer', 'rejected', 'withdrawn'],
  offer: [],
  rejected: [],
  withdrawn: [],
  ghosted: [],
};

export function SidePanelApp() {
  const {
    tab, setTab, profile, job, match, extractedData, loading, error,
    applications, jobs, selectedApp, setSelectedApp,
    statusFilter, setStatusFilter, answers, answerLoading,
    loadProfile, loadApplications, extractJob, saveJob,
    updateStatus, deleteApp, generateAnswers, editAnswer, resetExtracted,
  } = useSidePanelStore();

  useEffect(() => { loadProfile(); }, [loadProfile]);
  useEffect(() => { if (tab === 'tracker') loadApplications(); }, [tab, loadApplications]);

  const filteredApps = statusFilter === 'all'
    ? applications
    : applications.filter((a) => a.status === statusFilter);

  const statusCounts = applications.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  const scoreColor = (score: number) => {
    if (score >= 85) return 'text-green-400';
    if (score >= 75) return 'text-blue-400';
    if (score >= 65) return 'text-yellow-400';
    if (score >= 50) return 'text-orange-400';
    return 'text-red-400';
  };

  const getJobForApp = (app: Application) => jobs.find((j) => j.id === app.jobId);

  return (
    <div className="w-full min-h-screen bg-zinc-950 text-zinc-100 p-4">
      <header className="mb-4 flex items-center gap-2">
        <span className="text-blue-500 text-lg">⚡</span>
        <h1 className="text-lg font-bold">OpenApply</h1>
      </header>

      <nav className="flex gap-1 mb-4 bg-zinc-900 rounded-lg p-1">
        {(['analyze', 'tracker', 'answers'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium capitalize transition-colors ${
              tab === t ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {t}
            {t === 'tracker' && applications.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-zinc-700 rounded-full text-[10px]">
                {applications.length}
              </span>
            )}
          </button>
        ))}
      </nav>

      {tab === 'analyze' && (
        <AnalyzeTab
          job={job}
          match={match}
          extractedData={extractedData}
          loading={loading}
          error={error}
          scoreColor={scoreColor}
          onExtract={extractJob}
          onSave={saveJob}
          onReset={resetExtracted}
          onOpenJob={(url) => window.open(url, '_blank')}
        />
      )}

      {tab === 'tracker' && (
        <TrackerTab
          applications={filteredApps}
          jobs={jobs}
          selectedApp={selectedApp}
          statusFilter={statusFilter}
          statusCounts={statusCounts}
          onSelect={setSelectedApp}
          onFilter={setStatusFilter}
          onUpdateStatus={updateStatus}
          onDelete={deleteApp}
          getJob={getJobForApp}
        />
      )}

      {tab === 'answers' && (
        <AnswerReviewTab
          answers={answers}
          loading={answerLoading}
          onEdit={editAnswer}
          onGenerate={generateAnswers}
          job={job}
        />
      )}
    </div>
  );
}

function AnalyzeTab({
  job, match, extractedData, loading, error, scoreColor, onExtract, onSave, onReset, onOpenJob,
}: {
  job: ReturnType<typeof useSidePanelStore.getState>['job'];
  match: ReturnType<typeof useSidePanelStore.getState>['match'];
  extractedData: ReturnType<typeof useSidePanelStore.getState>['extractedData'];
  loading: boolean; error: string | null; scoreColor: (s: number) => string;
  onExtract: () => void; onSave: () => void; onReset: () => void; onOpenJob: (url: string) => void;
}) {
  if (!extractedData && !loading) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-zinc-400 mb-4">Click below to analyze the current job posting.</p>
        <button onClick={onExtract} className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors">
          Analyze Current Job
        </button>
        {error && (
          <div className="mt-3 p-3 bg-red-900/30 border border-red-800 rounded-lg text-sm text-red-400">{error}</div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-6 h-6 border-2 border-zinc-700 border-t-blue-500 rounded-full mx-auto mb-3" />
        <p className="text-sm text-zinc-400">Extracting job data...</p>
      </div>
    );
  }

  if (!extractedData || !match) return null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-white">{extractedData.title}</h2>
        <p className="text-sm text-zinc-400">{extractedData.company}</p>
        <p className="text-xs text-zinc-500">{extractedData.location} • {extractedData.workMode}</p>
      </div>

      <div className="bg-zinc-900 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-zinc-400">Match Score</span>
          <span className={`text-2xl font-bold ${scoreColor(match.finalScore)}`}>{match.finalScore}%</span>
        </div>
        <div className="text-xs text-zinc-500 uppercase tracking-wide">
          {getScoreLabel(match.finalScore).replace(/^\w/, (c) => c.toUpperCase())} Match
        </div>
        <div className="mt-2 h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${match.finalScore}%` }} />
        </div>
      </div>

      {match.matchedSkills.length > 0 && (
        <div className="bg-zinc-900 rounded-lg p-3">
          <h3 className="text-xs font-semibold text-green-400 uppercase mb-2">Matched Skills</h3>
          <div className="flex flex-wrap gap-1.5">
            {match.matchedSkills.map((s) => (
              <span key={s} className="px-2 py-0.5 bg-green-900/30 border border-green-800 rounded text-xs text-green-400">{s}</span>
            ))}
          </div>
        </div>
      )}

      {match.missingSkills.length > 0 && (
        <div className="bg-zinc-900 rounded-lg p-3">
          <h3 className="text-xs font-semibold text-orange-400 uppercase mb-2">Missing Skills</h3>
          <div className="flex flex-wrap gap-1.5">
            {match.missingSkills.map((s) => (
              <span key={s} className="px-2 py-0.5 bg-orange-900/30 border border-orange-800 rounded text-xs text-orange-400">{s}</span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-zinc-900 rounded-lg p-3">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase mb-2">Recommendation</h3>
        <p className={`text-sm font-bold ${
          match.recommendation === 'apply' ? 'text-green-400' :
          match.recommendation === 'review' ? 'text-yellow-400' : 'text-red-400'
        }`}>
          {match.recommendation === 'apply' ? '✓ STRONG MATCH — Consider Applying' :
           match.recommendation === 'review' ? '⚠ REVIEW — May Be Worth Exploring' :
           '✗ WEAK MATCH — May Not Be Ideal'}
        </p>
      </div>

      <div className="flex gap-2">
        <button onClick={onSave} className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors">
          Save & Track
        </button>
        <button onClick={() => onOpenJob(extractedData.url)} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm transition-colors">
          Open Job
        </button>
      </div>

      <button onClick={onReset} className="w-full py-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
        Analyze Another Job
      </button>
    </div>
  );
}

function TrackerTab({
  applications, jobs, selectedApp, statusFilter, statusCounts,
  onSelect, onFilter, onUpdateStatus, onDelete, getJob,
}: {
  applications: Application[]; jobs: Job[]; selectedApp: Application | null;
  statusFilter: string; statusCounts: Record<string, number>;
  onSelect: (app: Application | null) => void; onFilter: (f: string) => void;
  onUpdateStatus: (id: string, s: ApplicationStatusType) => void;
  onDelete: (id: string) => void;
  getJob: (app: Application) => Job | undefined;
}) {
  if (selectedApp) {
    return <AppDetail app={selectedApp} job={getJob(selectedApp)} onBack={() => onSelect(null)} onUpdateStatus={onUpdateStatus} onDelete={onDelete} />;
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-1 flex-wrap">
        {['all', 'saved', 'applied', 'interviewing', 'offer', 'rejected'].map((s) => (
          <button
            key={s}
            onClick={() => onFilter(s)}
            className={`px-2 py-1 rounded text-[10px] font-medium capitalize transition-colors ${
              statusFilter === s ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            {s}{s !== 'all' && statusCounts[s] ? ` (${statusCounts[s]})` : ''}
          </button>
        ))}
      </div>

      {applications.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-zinc-500">
            {statusFilter === 'all' ? 'No applications yet. Analyze a job and save it to start tracking.' : `No ${statusFilter} applications.`}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {applications.map((app) => {
            const job = getJob(app);
            return (
              <button
                key={app.id}
                onClick={() => onSelect(app)}
                className="w-full text-left bg-zinc-900 hover:bg-zinc-800 rounded-lg p-3 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{job?.title || 'Unknown Job'}</div>
                    <div className="text-xs text-zinc-400 truncate">{job?.company || 'Unknown Company'}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ml-2 flex-shrink-0 ${STATUS_COLORS[app.status] || ''}`}>
                    {app.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-[10px] text-zinc-500">
                  <span>{new Date(app.createdAt).toLocaleDateString()}</span>
                  {app.timeline.length > 1 && <span>{app.timeline.length} events</span>}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AppDetail({
  app, job, onBack, onUpdateStatus, onDelete,
}: {
  app: Application; job: Job | undefined;
  onBack: () => void; onUpdateStatus: (id: string, s: ApplicationStatusType) => void;
  onDelete: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const nextStatuses = NEXT_STATUSES[app.status];

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-xs text-zinc-400 hover:text-white transition-colors">
        ← Back to list
      </button>

      <div>
        <h2 className="text-base font-bold text-white">{job?.title || 'Unknown Job'}</h2>
        <p className="text-sm text-zinc-400">{job?.company}</p>
        <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${STATUS_COLORS[app.status]}`}>
          {app.status}
        </span>
      </div>

      {nextStatuses.length > 0 && (
        <div className="bg-zinc-900 rounded-lg p-3">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase mb-2">Update Status</h3>
          <div className="flex flex-wrap gap-1.5">
            {nextStatuses.map((s) => (
              <button
                key={s}
                onClick={() => onUpdateStatus(app.id, s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${STATUS_COLORS[s]}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {job?.url && (
        <button
          onClick={() => window.open(job.url, '_blank')}
          className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm transition-colors"
        >
          Open Job Posting
        </button>
      )}

      <div className="bg-zinc-900 rounded-lg p-3">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase mb-2">Timeline</h3>
        <div className="space-y-2">
          {app.timeline.map((entry, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-2 h-2 rounded-full ${i === app.timeline.length - 1 ? 'bg-blue-500' : 'bg-zinc-700'}`} />
                {i < app.timeline.length - 1 && <div className="w-px flex-1 bg-zinc-800" />}
              </div>
              <div className="pb-2">
                <div className="text-xs font-medium text-white capitalize">{entry.status}</div>
                <div className="text-[10px] text-zinc-500">{new Date(entry.timestamp).toLocaleString()}</div>
                {entry.note && <div className="text-[10px] text-zinc-400 mt-0.5">{entry.note}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {confirmDelete ? (
        <div className="flex gap-2">
          <button onClick={() => onDelete(app.id)} className="flex-1 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm text-white transition-colors">
            Confirm Delete
          </button>
          <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors">
            Cancel
          </button>
        </div>
      ) : (
        <button onClick={() => setConfirmDelete(true)} className="w-full py-2 text-xs text-red-400 hover:text-red-300 transition-colors">
          Delete Application
        </button>
      )}
    </div>
  );
}

const DEFAULT_QUESTIONS = [
  'Why are you interested in this position?',
  'Why should we hire you?',
  'What is your expected salary?',
  'When can you start?',
  'Are you authorized to work in this country?',
];

function AnswerReviewTab({
  answers,
  loading,
  onEdit,
  onGenerate,
  job,
}: {
  answers: Record<string, { answer: string; confidence: number; source: string[]; requires_review: boolean; edited?: string }>;
  loading: boolean;
  onEdit: (q: string, val: string) => void;
  onGenerate: (questions: string[]) => void;
  job: { id: string } | null;
}) {
  const questions = Object.keys(answers);
  const hasAnswers = questions.length > 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">AI Answers</h3>
        {!hasAnswers && !loading && (
          <button
            onClick={() => onGenerate(DEFAULT_QUESTIONS)}
            disabled={!job}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-lg text-xs font-medium transition-colors"
          >
            Generate Answers
          </button>
        )}
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin w-6 h-6 border-2 border-zinc-700 border-t-blue-500 rounded-full mx-auto mb-3" />
          <p className="text-sm text-zinc-400">Generating answers...</p>
        </div>
      )}

      {!loading && !hasAnswers && (
        <div className="text-center py-6">
          <p className="text-sm text-zinc-500 mb-3">
            Generate AI answers for common application questions.
            Review and edit before using.
          </p>
          <p className="text-xs text-zinc-600">
            Requires an AI provider configured in Settings.
          </p>
        </div>
      )}

      {hasAnswers && (
        <div className="space-y-3">
          {questions.map((q) => {
            const a = answers[q];
            const displayAnswer = a.edited ?? a.answer;
            return (
              <div key={q} className="bg-zinc-900 rounded-lg p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium text-zinc-300 flex-1">{q}</p>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      a.confidence >= 0.8 ? 'bg-green-900/30 text-green-400' :
                      a.confidence >= 0.5 ? 'bg-yellow-900/30 text-yellow-400' :
                      'bg-red-900/30 text-red-400'
                    }`}>
                      {Math.round(a.confidence * 100)}%
                    </span>
                    {a.requires_review && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-orange-900/30 text-orange-400 rounded">
                        Review
                      </span>
                    )}
                  </div>
                </div>
                <textarea
                  value={displayAnswer}
                  onChange={(e) => onEdit(q, e.target.value)}
                  rows={3}
                  className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-white focus:outline-none focus:border-blue-500 resize-none"
                />
                <div className="flex gap-1">
                  {a.source.map((s) => (
                    <span key={s} className="text-[10px] px-1.5 py-0.5 bg-zinc-800 text-zinc-500 rounded">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
          <button
            onClick={() => onGenerate(questions)}
            className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-zinc-400 transition-colors"
          >
            Regenerate All
          </button>
        </div>
      )}
    </div>
  );
}
