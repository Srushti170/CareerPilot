import { stateApi } from './backendSync';

const JOBS_KEY = 'careerpilot_jobs';

const DEFAULT_JOBS = [];
const SEEDED_JOB_IDS = new Set(['seed-google-sde', 'seed-stripe-frontend', 'seed-amazon-intern']);

function splitList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  return String(value || '')
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function createLogo(company = 'Company') {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(company)}&background=random`;
}

function formatSalaryRange(min, max) {
  if (!min && !max) return '';
  if (min && max) return `$${Math.round(min / 1000)}k - $${Math.round(max / 1000)}k`;
  return min ? `$${Math.round(min / 1000)}k+` : `Up to $${Math.round(max / 1000)}k`;
}

export function normalizeJob(job = {}) {
  const requirements = splitList(job.requirements || job.description);
  const tags = splitList(job.tags || requirements).slice(0, 4);
  const salaryMin = Number(job.salaryMin || job.minSalary || 0);
  const salaryMax = Number(job.salaryMax || job.maxSalary || 0);

  return {
    id: job.id || `${Date.now()}`,
    recruiterId: job.recruiterId || '',
    recruiterEmail: job.recruiterEmail || '',
    postedBy: job.postedBy || '',
    company: job.company || 'Hiring Company',
    title: job.title || 'New Role',
    location: job.location || 'Campus / Remote',
    type: job.type || 'Full-time',
    locationType: job.locationType || 'On-site',
    experience: job.experience || 'Entry Level (0-2 years)',
    salaryMin,
    salaryMax,
    salary: job.salary || formatSalaryRange(salaryMin, salaryMax),
    match: Number(job.match || 84),
    status: job.status || 'Draft',
    planTier: job.planTier || 'Basic',
    branchEligibility: splitList(job.branchEligibility),
    batchEligibility: splitList(job.batchEligibility),
    cgpaCutoff: String(job.cgpaCutoff || job.minCgpa || ''),
    requirements,
    tags,
    shortDescription: job.shortDescription || requirements[0] || 'Role details to be shared.',
    description: Array.isArray(job.description) ? job.description : requirements,
    missingSkills: splitList(job.missingSkills),
    deadline: job.deadline || '',
    createdAt: job.createdAt || new Date().toISOString(),
    logo: job.logo || createLogo(job.company),
  };
}

export function getStoredJobs() {
  const stored = localStorage.getItem(JOBS_KEY);
  if (!stored) {
    return [];
  }

  try {
    const parsed = JSON.parse(stored)
      .filter((job = {}) => !SEEDED_JOB_IDS.has(String(job.id || '')))
      .map(normalizeJob);
    localStorage.setItem(JOBS_KEY, JSON.stringify(parsed));
    return parsed;
  } catch {
    return [];
  }
}

export function saveStoredJobs(jobs = []) {
  const normalized = jobs.map(normalizeJob);
  localStorage.setItem(JOBS_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent('careerpilot:jobs-updated', { detail: normalized }));
  stateApi.saveJobs(normalized).catch((error) => {
    console.error('Jobs sync error:', error);
  });
  return normalized;
}

export function getPublishedJobs() {
  return getStoredJobs().filter((job) => job.status !== 'Draft');
}

export function getRecruiterOwnedJobs() {
  let recruiter = null;
  try {
    recruiter = JSON.parse(localStorage.getItem('careerpilot_current_user') || 'null');
  } catch {
    recruiter = null;
  }
  if (!recruiter || recruiter.role !== 'recruiter') return [];
  return getStoredJobs().filter((job) => (
    job.recruiterId === recruiter.id ||
    job.recruiterEmail?.toLowerCase() === String(recruiter.email || '').toLowerCase() ||
    job.postedBy?.toLowerCase() === String(recruiter.email || '').toLowerCase()
  ));
}

export function getApplicationStatsForJob(job, applications = []) {
  const matches = applications.filter(
    (app) =>
      app.company?.toLowerCase() === job.company.toLowerCase() &&
      app.role?.toLowerCase() === job.title.toLowerCase()
  );

  const statuses = matches.reduce((acc, app) => {
    const key = app.status || 'Applied';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return {
    totalApplicants: matches.length,
    shortlisted: (statuses.Reviewing || 0) + (statuses.Interview || 0) + (statuses.Offered || 0) + (statuses.Accepted || 0) + (statuses.Declined || 0),
    interviews: (statuses.Interview || 0) + (statuses.Offered || 0) + (statuses.Accepted || 0) + (statuses.Declined || 0),
    offers: (statuses.Offered || 0) + (statuses.Accepted || 0) + (statuses.Declined || 0),
    hired: statuses.Accepted || 0,
    rejected: statuses.Rejected || 0,
  };
}

export function getDaysUntilDeadline(deadline) {
  if (!deadline) return null;
  const now = new Date();
  const target = new Date(deadline);
  if (Number.isNaN(target.getTime())) return null;
  const diffMs = target.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0);
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function getJobStatusTone(status) {
  if (status === 'Active') return 'bg-success-soft text-success';
  if (status === 'Closing Soon') return 'bg-warning-soft text-warning';
  if (status === 'Paused') return 'bg-slate-200 text-slate-600';
  return 'bg-slate-100 text-slate-500';
}

export function buildCandidateFromApplication(app = {}) {
  const education = app.resumeSnapshot?.education || {};
  const skills = (app.resumeSnapshot?.skills || app.studentSkills || []).slice(0, 5);
  return {
    id: app.id,
    name: app.studentName || app.resumeSnapshot?.candidateName || 'Student Candidate',
    ref: app.id,
    university: app.studentUniversity || education.university || 'University not shared',
    branch: app.studentBranch || education.degree || 'Program not shared',
    cgpa: Number(app.studentGpa || education.gpa || 0),
    skills,
    match: Number(app.matchScore || 0),
    status: app.status || 'Applied',
    role: app.role || '',
    company: app.company || '',
    avatar: createLogo(app.studentName || app.resumeSnapshot?.candidateName || 'Student Candidate'),
    appliedDate: app.appliedDate || '',
    selectedInterviewSlot: app.selectedInterviewSlot || null,
  };
}
