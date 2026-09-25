import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, MetricCard } from './MetricCard';
import { cn } from '../lib/utils';
import {
  buildCandidateFromApplication,
  getApplicationStatsForJob,
  getRecruiterOwnedJobs,
} from '../lib/recruiterData';

function getStatusPill(status) {
  if (status === 'Accepted') return 'bg-success-soft text-success';
  if (status === 'Offered') return 'bg-primary-soft text-primary';
  if (status === 'Interview') return 'bg-primary-soft text-primary';
  if (status === 'Reviewing') return 'bg-secondary-container text-on-secondary-container';
  if (status === 'Rejected' || status === 'Declined') return 'bg-danger-soft text-danger';
  return 'bg-surface-container-high text-slate-600';
}

export function RecruiterDashboard({ setActiveTab, applications = [] }) {
  const [jobs, setJobs] = useState(() => getRecruiterOwnedJobs());
  const [minCgpa, setMinCgpa] = useState('All');
  const [branch, setBranch] = useState('All');
  const [matchPercent, setMatchPercent] = useState('All');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advancedRole, setAdvancedRole] = useState('All');

  useEffect(() => {
    const syncJobs = () => setJobs(getRecruiterOwnedJobs());
    window.addEventListener('careerpilot:jobs-updated', syncJobs);
    return () => window.removeEventListener('careerpilot:jobs-updated', syncJobs);
  }, []);

  const candidates = useMemo(
    () => applications.map((app) => buildCandidateFromApplication(app)),
    [applications]
  );

  const jobStats = useMemo(
    () =>
      jobs.map((job) => ({
        ...job,
        analytics: getApplicationStatsForJob(job, applications),
      })),
    [applications, jobs]
  );

  const filteredCandidates = candidates.filter((candidate) => {
    if (minCgpa !== 'All' && candidate.cgpa < parseFloat(minCgpa)) return false;
    if (branch !== 'All' && candidate.branch !== branch) return false;
    if (matchPercent !== 'All' && candidate.match < parseInt(matchPercent, 10)) return false;
    if (advancedRole !== 'All' && !candidate.skills.some((skill) => skill.toLowerCase().includes(advancedRole.toLowerCase()))) return false;
    return true;
  });

  const branches = Array.from(new Set(candidates.map((candidate) => candidate.branch).filter(Boolean)));
  const skills = Array.from(new Set(candidates.flatMap((candidate) => candidate.skills))).slice(0, 8);
  const recentJobs = [...jobStats]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 4);

  const totalApplicants = applications.length;
  const shortlisted = applications.filter((app) => ['Reviewing', 'Interview', 'Offered', 'Accepted', 'Declined'].includes(app.status)).length;
  const interviews = applications.filter((app) => ['Interview', 'Offered', 'Accepted', 'Declined'].includes(app.status)).length;
  const activeJobs = jobs.filter((job) => ['Active', 'Closing Soon'].includes(job.status)).length;

  const handleExportCSV = () => {
    const headers = ['Candidate', 'Ref', 'University', 'Branch', 'CGPA', 'Match Score', 'Status', 'Role'];
    const rows = filteredCandidates.map((candidate) => [
      candidate.name,
      candidate.ref,
      candidate.university,
      candidate.branch,
      candidate.cgpa,
      `${candidate.match}%`,
      candidate.status,
      candidate.role,
    ]);
    const csvContent = `data:text/csv;charset=utf-8,${[headers.join(','), ...rows.map((entry) => entry.map((value) => `"${value}"`).join(','))].join('\n')}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'careerpilot_recruiter_pipeline.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-8 pb-12 pt-24">
      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard compact label="Total Applicants" value={totalApplicants.toString()} subtext="Shared from one-click apply" color="primary" icon="person_add" />
        <MetricCard compact label="Shortlisted" value={shortlisted.toString()} subtext="Passed resume screen" color="secondary" icon="verified" />
        <MetricCard compact label="Active Jobs" value={activeJobs.toString()} icon="work" />
        <MetricCard compact label="Interviews" value={interviews.toString()} icon="event_note" />
      </section>

      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="min-w-0 flex-1">
          <Card className="overflow-hidden p-0">
            <div className="border-b border-outline-variant/10 p-6">
              <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <h2 className="text-xl font-black text-on-surface">Talent Pipeline</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 rounded-lg bg-surface-container-low px-3 py-1.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-surface-container-high"
                  >
                    <span className="material-symbols-outlined text-sm">filter_list</span>
                    {showAdvanced ? 'Hide Filters' : 'Advanced Filters'}
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 rounded-lg bg-surface-container-low px-3 py-1.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-surface-container-high"
                  >
                    <span className="material-symbols-outlined text-sm">download</span>
                    Export CSV
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mb-6 grid grid-cols-1 gap-4 overflow-hidden rounded-xl border border-slate-100 bg-slate-50 p-4 sm:grid-cols-2"
                  >
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">Required Skill Keywords</label>
                      <select
                        value={advancedRole}
                        onChange={(e) => setAdvancedRole(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white p-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="All">All Skills</option>
                        {skills.map((skill) => (
                          <option key={skill} value={skill}>{skill}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => { setMinCgpa('All'); setBranch('All'); setMatchPercent('All'); setAdvancedRole('All'); }}
                        className="w-full rounded-lg bg-slate-200 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 transition-colors hover:bg-slate-300"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex flex-wrap items-center gap-4">
                <div className="min-w-[120px] flex-1">
                  <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">Min CGPA</label>
                  <select value={minCgpa} onChange={(e) => setMinCgpa(e.target.value)} className="w-full cursor-pointer rounded-lg bg-surface-container-low p-2 text-sm font-medium text-slate-700 focus:ring-primary/20">
                    <option value="All">All Scores</option>
                    <option value="9">9.0+</option>
                    <option value="8">8.0+</option>
                    <option value="7">7.0+</option>
                  </select>
                </div>

                <div className="min-w-[120px] flex-1">
                  <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">Branch</label>
                  <select value={branch} onChange={(e) => setBranch(e.target.value)} className="w-full cursor-pointer rounded-lg bg-surface-container-low p-2 text-sm font-medium text-slate-700 focus:ring-primary/20">
                    <option value="All">All Branches</option>
                    {branches.map((branchName) => (
                      <option key={branchName} value={branchName}>{branchName}</option>
                    ))}
                  </select>
                </div>

                <div className="min-w-[120px] flex-1">
                  <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">Min Match Score</label>
                  <select value={matchPercent} onChange={(e) => setMatchPercent(e.target.value)} className="w-full cursor-pointer rounded-lg bg-surface-container-low p-2 text-sm font-medium text-slate-700 focus:ring-primary/20">
                    <option value="All">All Fits</option>
                    <option value="90">90%+ Match</option>
                    <option value="80">80%+ Match</option>
                    <option value="70">70%+ Match</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-surface-container-low/50">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Candidate</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Education</th>
                    <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">CGPA</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Skills</th>
                    <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Match</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {filteredCandidates.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-sm font-semibold text-slate-400">No candidates match current pipeline filters.</td>
                    </tr>
                  ) : (
                    filteredCandidates.map((candidate) => (
                      <tr key={candidate.id} className="group transition-colors hover:bg-surface-container-low">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img src={candidate.avatar} className="h-10 w-10 rounded-lg object-cover" alt={candidate.name} />
                            <div>
                              <p className="text-sm font-bold text-on-surface">{candidate.name}</p>
                              <p className="text-[10px] text-slate-500">Ref: {candidate.ref}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-semibold text-on-surface">{candidate.university}</p>
                          <p className="text-[10px] text-slate-500">{candidate.branch}</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-bold text-on-surface">{candidate.cgpa || '-'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {candidate.skills.length ? candidate.skills.map((skill) => (
                              <span key={skill} className="rounded bg-primary/5 px-2 py-0.5 text-[10px] font-bold text-primary">{skill}</span>
                            )) : (
                              <span className="text-xs text-slate-400">No tagged skills yet</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center">
                            <div className="relative h-10 w-10">
                              <svg className="h-full w-full -rotate-90">
                                <circle cx="20" cy="20" fill="transparent" r="16" stroke="#eceef0" strokeWidth="4" />
                                <circle cx="20" cy="20" fill="transparent" r="16" stroke="#006b5f" strokeDasharray="100.5" strokeDashoffset={(100 - candidate.match)} strokeWidth="4" />
                              </svg>
                              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-primary">{candidate.match}%</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn('rounded-full px-3 py-1 text-[10px] font-black uppercase', getStatusPill(candidate.status))}>
                            {candidate.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <aside className="w-full space-y-6 lg:w-80">
          <button
            onClick={() => setActiveTab('jobs')}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-br from-primary to-primary-container py-4 text-lg font-bold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="material-symbols-outlined">add_circle</span>
            Post New Job
          </button>

          <Card className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="font-bold text-on-surface">Recent Jobs</h3>
              <button onClick={() => setActiveTab('jobs')} className="border-none bg-transparent text-[10px] font-black uppercase tracking-widest text-primary hover:underline">
                View All
              </button>
            </div>
            <div className="space-y-4">
              {recentJobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => setActiveTab('jobs')}
                  className="group cursor-pointer rounded-lg bg-surface-container-low/50 p-4 transition-colors hover:bg-surface-container-low"
                >
                  <h4 className="text-sm font-bold text-on-surface transition-colors group-hover:text-primary">{job.title}</h4>
                  <div className="mt-2 flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-slate-400">group</span>
                      <span className="text-[10px] font-bold text-slate-600">{job.analytics.totalApplicants} App</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-slate-400">workspace_premium</span>
                      <span className="text-[10px] font-bold text-slate-500">{job.planTier} Tier</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
