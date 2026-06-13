import { getStudentProfile } from './studentProfile';

const COMPANIES_KEY = 'careerpilot_companies';
const STUDENTS_KEY = 'careerpilot_students';
const ANNOUNCEMENTS_KEY = 'careerpilot_announcements';

const DEFAULT_COMPANIES = [
  {
    id: 'company-google',
    name: 'Google',
    tier: 'Platinum',
    visits: 3,
    logo: 'https://ui-avatars.com/api/?name=Google&background=random',
    status: 'Approved',
    documents: 'GST, PAN, recruiter verification complete',
    note: 'Top tier strategic partner',
  },
  {
    id: 'company-microsoft',
    name: 'Microsoft',
    tier: 'Platinum',
    visits: 2,
    logo: 'https://ui-avatars.com/api/?name=Microsoft&background=random',
    status: 'Approved',
    documents: 'GST, PAN, MSA signed',
    note: 'Strong conversion across product and engineering',
  },
  {
    id: 'company-amazon',
    name: 'Amazon',
    tier: 'Gold',
    visits: 4,
    logo: 'https://ui-avatars.com/api/?name=Amazon&background=random',
    status: 'Approved',
    documents: 'GST, PAN verified',
    note: 'Internship-heavy recruiter pipeline',
  },
  {
    id: 'company-stripe',
    name: 'Stripe',
    tier: 'Silver',
    visits: 1,
    logo: 'https://ui-avatars.com/api/?name=Stripe&background=random',
    status: 'Pending',
    documents: 'Awaiting GST proof',
    note: 'New partner intake under review',
  },
];

const DEFAULT_STUDENTS = [
  { id: 'student-alex', name: 'Alex Rivera', role: 'Full Stack', cgpa: 8.9, placement: 'Placed (Google)', branch: 'Computer Science', initial: 'AR' },
  { id: 'student-sonia', name: 'Sonia Gupta', role: 'Data Analyst', cgpa: 8.5, placement: 'Placed (Accenture)', branch: 'Information Technology', initial: 'SG' },
  { id: 'student-rahul', name: 'Rahul Dev', role: 'Backend Dev', cgpa: 7.8, placement: 'Open', branch: 'Computer Science', initial: 'RD' },
  { id: 'student-mira', name: 'Mira Nair', role: 'Designer', cgpa: 9.1, placement: 'In-Process', branch: 'Electronics', initial: 'MN' },
];

const DEFAULT_ANNOUNCEMENTS = [
  {
    id: 'announcement-1',
    title: 'Resume Review Week Open',
    message: 'Placement mentors are reviewing ATS-tailored resumes this week. Complete Resume Builder before Friday.',
    audience: 'All Students',
    createdAt: '2026-06-12T10:00:00.000Z',
  },
  {
    id: 'announcement-2',
    title: 'Amazon Internship Window',
    message: 'Amazon internship applications close soon. Prioritize Java, AWS, and DSA preparation before applying.',
    audience: 'Computer Science',
    createdAt: '2026-06-13T09:30:00.000Z',
  },
];

function toInitials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function normalizeCompany(company = {}) {
  return {
    id: company.id || `${Date.now()}`,
    name: company.name || 'Company',
    tier: company.tier || 'Silver',
    visits: Number(company.visits || 0),
    logo: company.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(company.name || 'Company')}&background=random`,
    status: company.status || 'Pending',
    documents: company.documents || 'Documents pending review',
    note: company.note || '',
  };
}

export function getStoredCompanies() {
  const stored = localStorage.getItem(COMPANIES_KEY);
  if (!stored) {
    localStorage.setItem(COMPANIES_KEY, JSON.stringify(DEFAULT_COMPANIES));
    return DEFAULT_COMPANIES.map(normalizeCompany);
  }

  try {
    const parsed = JSON.parse(stored).map(normalizeCompany);
    localStorage.setItem(COMPANIES_KEY, JSON.stringify(parsed));
    return parsed;
  } catch {
    localStorage.setItem(COMPANIES_KEY, JSON.stringify(DEFAULT_COMPANIES));
    return DEFAULT_COMPANIES.map(normalizeCompany);
  }
}

export function saveStoredCompanies(companies = []) {
  const normalized = companies.map(normalizeCompany);
  localStorage.setItem(COMPANIES_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent('careerpilot:companies-updated', { detail: normalized }));
  return normalized;
}

export function normalizeStudentRecord(student = {}) {
  return {
    id: student.id || `${Date.now()}`,
    name: student.name || 'Student Candidate',
    role: student.role || 'Open to roles',
    cgpa: Number(student.cgpa || 0),
    placement: student.placement || 'Open',
    branch: student.branch || 'Computer Science',
    initial: student.initial || toInitials(student.name),
  };
}

export function getStoredStudents() {
  const stored = localStorage.getItem(STUDENTS_KEY);
  if (!stored) {
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(DEFAULT_STUDENTS));
    return DEFAULT_STUDENTS.map(normalizeStudentRecord);
  }

  try {
    const parsed = JSON.parse(stored).map(normalizeStudentRecord);
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(parsed));
    return parsed;
  } catch {
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(DEFAULT_STUDENTS));
    return DEFAULT_STUDENTS.map(normalizeStudentRecord);
  }
}

export function saveStoredStudents(students = []) {
  const normalized = students.map(normalizeStudentRecord);
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent('careerpilot:students-updated', { detail: normalized }));
  return normalized;
}

export function getStoredAnnouncements() {
  const stored = localStorage.getItem(ANNOUNCEMENTS_KEY);
  if (!stored) {
    localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(DEFAULT_ANNOUNCEMENTS));
    return DEFAULT_ANNOUNCEMENTS;
  }

  try {
    const parsed = JSON.parse(stored);
    localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(parsed));
    return parsed;
  } catch {
    localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(DEFAULT_ANNOUNCEMENTS));
    return DEFAULT_ANNOUNCEMENTS;
  }
}

export function saveStoredAnnouncements(announcements = []) {
  localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(announcements));
  window.dispatchEvent(new CustomEvent('careerpilot:announcements-updated', { detail: announcements }));
  return announcements;
}

export function deriveStudentsFromApplications(applications = []) {
  const studentMap = new Map();

  applications.forEach((app) => {
    const name = app.studentName || app.resumeSnapshot?.candidateName;
    if (!name || studentMap.has(name)) return;

    const branch = app.studentBranch || app.resumeSnapshot?.education?.degree || 'Computer Science';
    const cgpa = Number(app.studentGpa || app.resumeSnapshot?.education?.gpa || 0);
    const placement =
      app.status === 'Accepted'
        ? `Placed (${app.company})`
        : app.status === 'Offered'
          ? `Offer (${app.company})`
          : app.status === 'Interview'
            ? 'In-Process'
            : 'Open';

    studentMap.set(name, normalizeStudentRecord({
      id: app.id,
      name,
      role: app.role,
      cgpa,
      branch,
      placement,
    }));
  });

  const profile = getStudentProfile();
  if (profile?.name && !studentMap.has(profile.name)) {
    studentMap.set(profile.name, normalizeStudentRecord({
      id: 'current-profile-student',
      name: profile.name,
      role: profile.role || profile.degree || 'Open to roles',
      cgpa: Number(profile.gpa || 0),
      branch: profile.degree || profile.branch || 'Computer Science',
      placement: 'Open',
    }));
  }

  return Array.from(studentMap.values());
}

export function mergeStudentRecords(manualStudents = [], applications = []) {
  const merged = new Map();

  [...manualStudents, ...deriveStudentsFromApplications(applications)].forEach((student) => {
    merged.set(student.name, normalizeStudentRecord(student));
  });

  return Array.from(merged.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function getPlacementStats(students = []) {
  const placed = students.filter((student) => student.placement.startsWith('Placed')).length;
  const inProcess = students.filter((student) => ['In-Process'].includes(student.placement) || student.placement.startsWith('Offer')).length;
  const total = students.length || 1;
  return {
    total: students.length,
    placed,
    inProcess,
    open: students.filter((student) => student.placement === 'Open').length,
    placementRate: Math.round((placed / total) * 100),
    averageCgpa: students.length ? (students.reduce((sum, student) => sum + Number(student.cgpa || 0), 0) / students.length).toFixed(1) : '0.0',
  };
}

export function getDepartmentBreakdown(students = []) {
  const grouped = students.reduce((acc, student) => {
    const branch = student.branch || 'Unassigned';
    if (!acc[branch]) {
      acc[branch] = { name: branch, total: 0, placed: 0, avgCgpa: 0 };
    }
    acc[branch].total += 1;
    acc[branch].placed += student.placement.startsWith('Placed') ? 1 : 0;
    acc[branch].avgCgpa += Number(student.cgpa || 0);
    return acc;
  }, {});

  return Object.values(grouped)
    .map((dept) => ({
      ...dept,
      rate: dept.total ? Math.round((dept.placed / dept.total) * 100) : 0,
      avgCgpa: dept.total ? (dept.avgCgpa / dept.total).toFixed(1) : '0.0',
    }))
    .sort((a, b) => b.total - a.total);
}
