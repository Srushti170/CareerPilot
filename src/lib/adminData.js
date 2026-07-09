import { getStudentProfile } from './studentProfile';
import { stateApi } from './backendSync';

const COMPANIES_KEY = 'careerpilot_companies';
const STUDENTS_KEY = 'careerpilot_students';
const ANNOUNCEMENTS_KEY = 'careerpilot_announcements';

const DEFAULT_COMPANIES = [];
const DEFAULT_STUDENTS = [];
const DEFAULT_ANNOUNCEMENTS = [];
const SEEDED_COMPANY_IDS = new Set(['company-google', 'company-microsoft', 'company-amazon', 'company-stripe']);
const SEEDED_STUDENT_IDS = new Set(['student-alex', 'student-sonia', 'student-rahul', 'student-mira']);
const SEEDED_ANNOUNCEMENT_IDS = new Set(['announcement-1', 'announcement-2']);

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
    return [];
  }

  try {
    const parsed = JSON.parse(stored)
      .filter((company = {}) => !SEEDED_COMPANY_IDS.has(String(company.id || '')))
      .map(normalizeCompany);
    localStorage.setItem(COMPANIES_KEY, JSON.stringify(parsed));
    return parsed;
  } catch {
    return [];
  }
}

export function saveStoredCompanies(companies = []) {
  const normalized = companies.map(normalizeCompany);
  localStorage.setItem(COMPANIES_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent('careerpilot:companies-updated', { detail: normalized }));
  stateApi.saveCompanies(normalized).catch((error) => {
    console.error('Companies sync error:', error);
  });
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
    return [];
  }

  try {
    const parsed = JSON.parse(stored)
      .filter((student = {}) => !SEEDED_STUDENT_IDS.has(String(student.id || '')))
      .map(normalizeStudentRecord);
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(parsed));
    return parsed;
  } catch {
    return [];
  }
}

export function saveStoredStudents(students = []) {
  const normalized = students.map(normalizeStudentRecord);
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent('careerpilot:students-updated', { detail: normalized }));
  stateApi.saveStudents(normalized).catch((error) => {
    console.error('Students sync error:', error);
  });
  return normalized;
}

export function getStoredAnnouncements() {
  const stored = localStorage.getItem(ANNOUNCEMENTS_KEY);
  if (!stored) {
    return [];
  }

  try {
    const parsed = JSON.parse(stored).filter(
      (announcement = {}) => !SEEDED_ANNOUNCEMENT_IDS.has(String(announcement.id || ''))
    );
    localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(parsed));
    return parsed;
  } catch {
    return [];
  }
}

export function saveStoredAnnouncements(announcements = []) {
  localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(announcements));
  window.dispatchEvent(new CustomEvent('careerpilot:announcements-updated', { detail: announcements }));
  stateApi.saveAnnouncements(announcements).catch((error) => {
    console.error('Announcements sync error:', error);
  });
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
