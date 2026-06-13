import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from './ui/Card';
import { integrationApi } from '../lib/backendSync';
import {
  getApplicationStatsForJob,
  getDaysUntilDeadline,
  getJobStatusTone,
  getStoredJobs,
  normalizeJob,
  saveStoredJobs,
} from '../lib/recruiterData';

const inputClass = 'w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/10';
const textareaClass = `${inputClass} min-h-[96px] resize-none`;

function createEmptyJobDraft() {
  return {
    company: '',
    title: '',
    location: '',
    locationType: 'On-site',
    type: 'Internship',
    experience: 'Entry Level (0-2 years)',
    status: 'Draft',
    planTier: 'Basic',
    cgpaCutoff: '',
    salaryMin: '0',
    salaryMax: '0',
    deadline: '',
    branchEligibility: '',
    batchEligibility: '',
    requirements: '',
    shortDescription: '',
  };
}

export function JobManagement({ applications = [] }) {
  const [jobs, setJobs] = useState(() => getStoredJobs());
  const [showModal, setShowModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [analyticsJob, setAnalyticsJob] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [jobDraft, setJobDraft] = useState(createEmptyJobDraft());

  useEffect(() => {
    const syncJobs = () => setJobs(getStoredJobs());
    window.addEventListener('careerpilot:jobs-updated', syncJobs);
    return () => window.removeEventListener('careerpilot:jobs-updated', syncJobs);
  }, []);

  const enrichedJobs = useMemo(
    () =>
      jobs.map((job) => ({
        ...job,
        analytics: getApplicationStatsForJob(job, applications),
      })),
    [applications, jobs]
  );

  const handleOpenNew = () => {
    setEditingJob(null);
    setJobDraft(createEmptyJobDraft());
    setShowModal(true);
  };

  const handleOpenEdit = (job) => {
    setEditingJob(job);
    setJobDraft({
      company: job.company,
      title: job.title,
      location: job.location,
      locationType: job.locationType,
      type: job.type,
      experience: job.experience,
      status: job.status,
      planTier: job.planTier,
      cgpaCutoff: job.cgpaCutoff,
      salaryMin: String(job.salaryMin || 0),
      salaryMax: String(job.salaryMax || 0),
      deadline: job.deadline || '',
      branchEligibility: (job.branchEligibility || []).join(', '),
      batchEligibility: (job.batchEligibility || []).join(', '),
      requirements: (job.requirements || []).join('\n'),
      shortDescription: job.shortDescription || '',
    });
    setShowModal(true);
  };

  const updateDraft = (field, value) => {
    setJobDraft((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    const nextJob = normalizeJob({
      ...editingJob,
      ...jobDraft,
      id: editingJob?.id || `${Date.now()}`,
      createdAt: editingJob?.createdAt || new Date().toISOString(),
    });

    const updatedJobs = editingJob
      ? jobs.map((job) => (job.id === editingJob.id ? nextJob : job))
      : [nextJob, ...jobs];

    setJobs(saveStoredJobs(updatedJobs));
    if (!editingJob) {
      try {
        const order = await integrationApi.createPaymentOrder({
          amount: nextJob.planTier === 'Premium' ? 499900 : nextJob.planTier === 'Pro' ? 249900 : 99900,
          currency: 'INR',
          description: `${nextJob.planTier} recruiter plan for ${nextJob.company} - ${nextJob.title}`,
        });
        setStatusMessage(`Recruiter plan order created: ${order.id}`);
      } catch (error) {
        console.error('Payment order creation error:', error);
        setStatusMessage('Job saved, but payment order creation failed.');
      }
      window.setTimeout(() => setStatusMessage(''), 2800);
    }
    setShowModal(false);
  };

  const handleDelete = (id) => {
    const updated = jobs.filter((job) => job.id !== id);
    setJobs(saveStoredJobs(updated));
    setAnalyticsJob(null);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-8 pb-12 pt-24">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-headline font-semibold tracking-tight text-slate-900 md:text-3xl">Job management</h2>
          <p className="mt-1 text-sm text-slate-500">Create recruiter-ready postings with eligibility, payout, and pipeline visibility.</p>
        </div>
        <button
          onClick={handleOpenNew}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-hover focus:outline-none focus:ring-4 focus:ring-primary/10"
        >
          <span className="material-symbols-outlined text-base">post_add</span>
          New posting
        </button>
      </div>

      <div className="grid gap-4">
        {statusMessage && (
          <div className="rounded-xl border border-success/20 bg-success-soft px-4 py-3 text-sm font-medium text-success">
            {statusMessage}
          </div>
        )}
        {enrichedJobs.map((job) => {
          const daysLeft = getDaysUntilDeadline(job.deadline);
          return (
            <Card key={job.id} hover className="p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400">
                    <span className="material-symbols-outlined text-3xl">work</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-slate-900">{job.title}</h3>
                      <span className={`rounded-md px-3 py-1 text-[11px] font-semibold ${getJobStatusTone(job.status)}`}>{job.status}</span>
                      <span className="rounded-md bg-primary-soft px-3 py-1 text-[11px] font-semibold text-primary">{job.planTier}</span>
                    </div>
                    <p className="text-sm text-slate-500">{job.company} · {job.location} · {job.type} · {job.locationType}</p>
                    <p className="max-w-2xl text-sm leading-6 text-slate-600">{job.shortDescription}</p>
                    <div className="flex flex-wrap gap-2">
                      {job.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid min-w-[260px] grid-cols-2 gap-3 lg:w-[320px]">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">Applicants</p>
                    <p className="mt-2 text-2xl font-headline font-bold text-slate-900">{job.analytics.totalApplicants}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">Deadline</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{job.deadline || 'TBD'}</p>
                    <p className="mt-1 text-xs text-slate-500">{daysLeft === null ? 'Set a closing date' : daysLeft >= 0 ? `${daysLeft} days left` : 'Deadline passed'}</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4">
                <div className="flex flex-wrap gap-6 text-xs font-medium text-slate-500">
                  <span>{job.salary || 'Comp not shared'}</span>
                  <span>CGPA cutoff: {job.cgpaCutoff || 'Open'}</span>
                  <span>Eligible branches: {job.branchEligibility.length ? job.branchEligibility.join(', ') : 'All'}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleOpenEdit(job)} className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-slate-600 transition-colors hover:bg-slate-100" title="Edit posting">
                    <span className="material-symbols-outlined">edit</span>
                  </button>
                  <button onClick={() => setAnalyticsJob(job)} className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-slate-600 transition-colors hover:bg-slate-100" title="Job analytics">
                    <span className="material-symbols-outlined">analytics</span>
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-headline font-semibold text-slate-900">{editingJob ? 'Edit job posting' : 'Post new job'}</h3>
                  <p className="mt-1 text-sm text-slate-500">Capture the exact hiring criteria students and placement cells need.</p>
                </div>
                <button onClick={() => setShowModal(false)} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleSave} className="mt-6 space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">Company</label>
                    <input value={jobDraft.company} onChange={(e) => updateDraft('company', e.target.value)} required className={inputClass} placeholder="e.g. Atlassian" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">Job title</label>
                    <input value={jobDraft.title} onChange={(e) => updateDraft('title', e.target.value)} required className={inputClass} placeholder="e.g. Backend Intern" />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">Location</label>
                    <input value={jobDraft.location} onChange={(e) => updateDraft('location', e.target.value)} required className={inputClass} placeholder="Remote / Bangalore / Hybrid" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">Location type</label>
                    <select value={jobDraft.locationType} onChange={(e) => updateDraft('locationType', e.target.value)} className={inputClass}>
                      <option>On-site</option>
                      <option>Hybrid</option>
                      <option>Remote</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">Role type</label>
                    <select value={jobDraft.type} onChange={(e) => updateDraft('type', e.target.value)} className={inputClass}>
                      <option>Internship</option>
                      <option>Full-time</option>
                      <option>Part-time</option>
                      <option>Contract</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">Experience</label>
                    <select value={jobDraft.experience} onChange={(e) => updateDraft('experience', e.target.value)} className={inputClass}>
                      <option>Entry Level (0-2 years)</option>
                      <option>Mid Level (3-5 years)</option>
                      <option>Senior (5+ years)</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">Status</label>
                    <select value={jobDraft.status} onChange={(e) => updateDraft('status', e.target.value)} className={inputClass}>
                      <option>Draft</option>
                      <option>Active</option>
                      <option>Closing Soon</option>
                      <option>Paused</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">Plan tier</label>
                    <select value={jobDraft.planTier} onChange={(e) => updateDraft('planTier', e.target.value)} className={inputClass}>
                      <option>Basic</option>
                      <option>Pro</option>
                      <option>Premium</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">Deadline</label>
                    <input type="date" value={jobDraft.deadline} onChange={(e) => updateDraft('deadline', e.target.value)} className={inputClass} />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">Min salary</label>
                    <input type="number" min="0" value={jobDraft.salaryMin} onChange={(e) => updateDraft('salaryMin', e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">Max salary</label>
                    <input type="number" min="0" value={jobDraft.salaryMax} onChange={(e) => updateDraft('salaryMax', e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">CGPA cutoff</label>
                    <input value={jobDraft.cgpaCutoff} onChange={(e) => updateDraft('cgpaCutoff', e.target.value)} className={inputClass} placeholder="e.g. 7.5" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">Eligible batch</label>
                    <input value={jobDraft.batchEligibility} onChange={(e) => updateDraft('batchEligibility', e.target.value)} className={inputClass} placeholder="2026, 2027" />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">Eligible branches</label>
                    <textarea value={jobDraft.branchEligibility} onChange={(e) => updateDraft('branchEligibility', e.target.value)} className={textareaClass} placeholder="Computer Science, IT, AI & DS" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">Requirements / skills</label>
                    <textarea value={jobDraft.requirements} onChange={(e) => updateDraft('requirements', e.target.value)} className={textareaClass} placeholder="React&#10;Node.js&#10;Problem Solving" />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Role summary</label>
                  <textarea value={jobDraft.shortDescription} onChange={(e) => updateDraft('shortDescription', e.target.value)} className={textareaClass} placeholder="Short high-signal summary students will see in discovery and one-click apply." />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
                    Cancel
                  </button>
                  <button type="submit" className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-hover">
                    {editingJob ? 'Save changes' : 'Publish job'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {analyticsJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-2xl"
            >
              <button onClick={() => setAnalyticsJob(null)} className="absolute right-6 top-6 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>

              <div className="border-b border-slate-100 pb-4">
                <span className="inline-block rounded-md bg-primary-soft px-2.5 py-1 text-[11px] font-semibold text-primary">Live posting analytics</span>
                <h3 className="mt-2 text-xl font-headline font-semibold text-slate-900">{analyticsJob.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{analyticsJob.company} · {analyticsJob.location}</p>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                {[
                  { label: 'Applicants', value: getApplicationStatsForJob(analyticsJob, applications).totalApplicants },
                  { label: 'Shortlisted', value: getApplicationStatsForJob(analyticsJob, applications).shortlisted },
                  { label: 'Interviews', value: getApplicationStatsForJob(analyticsJob, applications).interviews },
                  { label: 'Hired', value: getApplicationStatsForJob(analyticsJob, applications).hired },
                ].map((metric) => (
                  <div key={metric.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
                    <p className="text-[11px] font-medium text-slate-500">{metric.label}</p>
                    <h4 className="mt-1 text-2xl font-headline font-bold text-slate-900">{metric.value}</h4>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-4">
                <h4 className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-400">Role details</h4>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  <p><span className="font-semibold text-slate-900">Plan:</span> {analyticsJob.planTier}</p>
                  <p className="mt-2"><span className="font-semibold text-slate-900">Deadline:</span> {analyticsJob.deadline || 'Not set'}</p>
                  <p className="mt-2"><span className="font-semibold text-slate-900">Eligibility:</span> {analyticsJob.branchEligibility.length ? analyticsJob.branchEligibility.join(', ') : 'All branches'}</p>
                  <p className="mt-2"><span className="font-semibold text-slate-900">Requirements:</span> {(analyticsJob.requirements || []).join(', ') || 'To be added'}</p>
                </div>
              </div>

              <div className="mt-6 flex justify-between gap-3 border-t border-slate-100 pt-6">
                <button onClick={() => handleDelete(analyticsJob.id)} className="rounded-xl bg-danger-soft px-4 py-2.5 text-sm font-semibold text-danger transition-opacity hover:opacity-80">
                  Delete posting
                </button>
                <button onClick={() => setAnalyticsJob(null)} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
                  Close analytics
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
