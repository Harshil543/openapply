import type { Application } from '../schemas/application';

export interface AnalyticsData {
  totalApplications: number;
  statusCounts: Record<string, number>;
  weeklyTrend: Array<{ week: string; count: number }>;
  averageTimeToResponse: number | null;
  topCompanies: Array<{ company: string; count: number }>;
  matchScoreDistribution: Array<{ range: string; count: number }>;
}

export function computeAnalytics(applications: Application[], jobs: Array<{ id: string; company: string }>): AnalyticsData {
  const statusCounts: Record<string, number> = {};
  for (const app of applications) {
    statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
  }

  const weeklyTrend = computeWeeklyTrend(applications);
  const averageTimeToResponse = computeAverageResponseTime(applications);
  const topCompanies = computeTopCompanies(applications, jobs);

  return {
    totalApplications: applications.length,
    statusCounts,
    weeklyTrend,
    averageTimeToResponse,
    topCompanies,
    matchScoreDistribution: [],
  };
}

function computeWeeklyTrend(applications: Application[]): Array<{ week: string; count: number }> {
  const weeks: Record<string, number> = {};
  for (const app of applications) {
    const date = new Date(app.createdAt);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const key = weekStart.toISOString().split('T')[0];
    weeks[key] = (weeks[key] || 0) + 1;
  }

  return Object.entries(weeks)
    .map(([week, count]) => ({ week, count }))
    .sort((a, b) => a.week.localeCompare(b.week))
    .slice(-12);
}

function computeAverageResponseTime(applications: Application[]): number | null {
  const responseTimes: number[] = [];

  for (const app of applications) {
    const applied = app.appliedAt ? new Date(app.appliedAt) : null;
    const responded = app.timeline.find(
      (t) => ['interviewing', 'offer', 'rejected'].includes(t.status)
    );

    if (applied && responded) {
      const diff = new Date(responded.timestamp).getTime() - applied.getTime();
      if (diff > 0) {
        responseTimes.push(diff / (1000 * 60 * 60 * 24));
      }
    }
  }

  if (responseTimes.length === 0) return null;
  return Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length);
}

function computeTopCompanies(
  applications: Application[],
  jobs: Array<{ id: string; company: string }>
): Array<{ company: string; count: number }> {
  const companyCounts: Record<string, number> = {};

  for (const app of applications) {
    const job = jobs.find((j) => j.id === app.jobId);
    if (job) {
      companyCounts[job.company] = (companyCounts[job.company] || 0) + 1;
    }
  }

  return Object.entries(companyCounts)
    .map(([company, count]) => ({ company, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}
