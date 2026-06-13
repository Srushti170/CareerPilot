const JOBS_KEY = 'careerpilot_jobs';

const DEFAULT_JOBS = [
  {
    id: 'seed-google-sde',
    company: 'Google',
    title: 'Software Engineer III',
    location: 'Mountain View, CA',
    type: 'Full-time',
    locationType: 'On-site',
    experience: 'Senior (5+ years)',
    salaryMin: 165000,
    salary: '$165k - $220k',
    match: 98,
    status: 'Active',
    planTier: 'Premium',
    branchEligibility: ['Computer Science', 'Information Technology'],
    batchEligibility: ['2026', '2027'],
    cgpaCutoff: '8.0',
    requirements: ['Distributed Systems', 'Cloud', 'System Design', 'Leadership'],
    tags: ['Distributed Systems', 'Cloud'],
    shortDescription: 'Lead the design and implementation of highly scalable distributed cloud services.',
    description: [
      'Design, develop, test, deploy, maintain and improve software.',
      'Lead major software components, systems, and features.',
      'Mentor team members on design techniques and coding standards.',
    ],
    missingSkills: ['Go (Golang)'],
    deadline: '2026-07-15',
    createdAt: '2026-06-10T09:00:00.000Z',
    logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC6n9O4Yw1sHm33bnxv42c3Lc__KboJawPt7X0Q7ccBUqzaPBfqbyO3NijginBJ6pnNTcE0_zmA7b1bGoiapK3X6BW-S-8TbXCeAv06XaZs1HCk-oGvvv1g-VLo9cAZjCiqB0aOwe6GDt5BS-e1hdsRwWFNw_UkfrG-HrmWWGQZ8xxzZibnX37QHy3ASKJFheqhCdg0lpHIJRVgXK5s52Z5gSAIq78DMoGGiR60gBtoynaU4cZUm8k_PZT2u6YCkx7jmjC36lPZNho',
  },
  {
    id: 'seed-stripe-frontend',
    company: 'Stripe',
    title: 'Frontend Engineer (Payments)',
    location: 'Seattle, WA',
    type: 'Full-time',
    locationType: 'Remote',
    experience: 'Mid Level (3-5 years)',
    salaryMin: 150000,
    salary: '$150k - $190k',
    match: 94,
    status: 'Active',
    planTier: 'Pro',
    branchEligibility: ['Computer Science', 'Electronics'],
    batchEligibility: ['2026'],
    cgpaCutoff: '7.5',
    requirements: ['React', 'TypeScript', 'Accessibility', 'Performance'],
    tags: ['React', 'Typescript', 'Fintech'],
    shortDescription: 'Build pixel-perfect, accessible, and performant user interfaces for global payment flows.',
    description: [
      'Architect and build responsive, accessible React components.',
      'Collaborate with design and product to define frontend APIs and standards.',
      'Optimize builds and frontend performance metrics.',
    ],
    missingSkills: ['GraphQL'],
    deadline: '2026-06-28',
    createdAt: '2026-06-11T11:30:00.000Z',
    logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCwmqkI3ugEyAnfsIVvXzR8vd1J9f9masmOZDuUcNxM7Pmv5auaHnJq4jqZ5RB7EIjvXQsdKUi2ABBHG3llgUqyEP5yE7D0qP5CkjcWdlKUA7oZBD_Dlw2-p_9z5NlKJZYVCIdL0Vm7HIl-f2boEq24HBF7pJTQqExh8pVkjGr08UsJTHsMsobEApFce94gIcP0x-ewbECTANIIia9-IFVjjnPsCN_GKmKcyFq7ad9D5XaRJsmIF7esEeXyeTEQEeY4oE8nnrrOxvY',
  },
  {
    id: 'seed-amazon-intern',
    company: 'Amazon',
    title: 'SDE Intern',
    location: 'Seattle, WA',
    type: 'Internship',
    locationType: 'On-site',
    experience: 'Entry Level (0-2 years)',
    salaryMin: 96000,
    salary: '$8k/mo',
    match: 95,
    status: 'Closing Soon',
    planTier: 'Basic',
    branchEligibility: ['Computer Science', 'AI & DS', 'IT'],
    batchEligibility: ['2027'],
    cgpaCutoff: '7.0',
    requirements: ['Java', 'AWS', 'DSA', 'Problem Solving'],
    tags: ['Java', 'AWS'],
    shortDescription: 'Join a 12-week internship program building backend services for AWS core infrastructure.',
    description: [
      'Design and implement a scalable microservice using Java and AWS.',
      'Participate in daily standups and agile sprint planning.',
      'Write unit and integration tests to ensure code reliability.',
    ],
    missingSkills: ['DynamoDB'],
    deadline: '2026-06-20',
    createdAt: '2026-06-12T14:00:00.000Z',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Amazon_icon.svg',
  },
];

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
    localStorage.setItem(JOBS_KEY, JSON.stringify(DEFAULT_JOBS));
    return DEFAULT_JOBS.map(normalizeJob);
  }

  try {
    const parsed = JSON.parse(stored).map(normalizeJob);
    localStorage.setItem(JOBS_KEY, JSON.stringify(parsed));
    return parsed;
  } catch {
    localStorage.setItem(JOBS_KEY, JSON.stringify(DEFAULT_JOBS));
    return DEFAULT_JOBS.map(normalizeJob);
  }
}

export function saveStoredJobs(jobs = []) {
  const normalized = jobs.map(normalizeJob);
  localStorage.setItem(JOBS_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent('careerpilot:jobs-updated', { detail: normalized }));
  return normalized;
}

export function getPublishedJobs() {
  return getStoredJobs().filter((job) => job.status !== 'Draft');
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
