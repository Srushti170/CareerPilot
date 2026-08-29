import { stateApi } from './backendSync';
import { getScopedJson, setScopedJson } from './userScopedStorage';

const DEFAULT_SOCIALS = {
  LinkedIn: { connected: false, handle: '' },
  GitHub: { connected: false, handle: '' },
  Portfolio: { connected: false, handle: '' },
};

const DEFAULT_CODING_PROFILES = {
  LinkedIn: '',
  GitHub: '',
  Portfolio: '',
  LeetCode: '',
  CodeChef: '',
  HackerRank: '',
};
const LEGACY_DEMO_ROLE = ['CS', 'Senior', 'Student'].join(' ');

export const STUDENT_PROFILE_KEY = 'careerpilot_student_profile';
export const STUDENT_ONBOARDING_KEY = 'careerpilot_student_onboarding_complete';

function getCurrentUser() {
  try {
    const stored = localStorage.getItem('careerpilot_current_user');
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function createDefaultStudentProfile(user = {}) {
  const activeUser = user.id || user.email ? user : getCurrentUser();
  return {
    userId: activeUser.id || '',
    name: activeUser.name || '',
    email: activeUser.email || '',
    phone: '',
    role: '',
    university: '',
    degree: '',
    branch: '',
    semester: '',
    location: '',
    summary: '',
    skills: [],
    gpa: '',
    coursework: '',
    graduation: '',
    projects: '',
    experience: '',
    achievements: '',
    certifications: '',
    responsibility: '',
    socials: { ...DEFAULT_SOCIALS },
    codingProfiles: { ...DEFAULT_CODING_PROFILES },
    onboardingComplete: false,
  };
}

function normalizeSocials(rawSocials = {}, rawCodingProfiles = {}) {
  const socials = {
    LinkedIn: rawSocials.LinkedIn || { connected: false, handle: rawCodingProfiles.LinkedIn || '' },
    GitHub: rawSocials.GitHub || { connected: false, handle: rawCodingProfiles.GitHub || '' },
    Portfolio: rawSocials.Portfolio || { connected: false, handle: rawCodingProfiles.Portfolio || '' },
  };

  return {
    LinkedIn: {
      connected: Boolean(socials.LinkedIn.connected || socials.LinkedIn.handle),
      handle: socials.LinkedIn.handle || '',
    },
    GitHub: {
      connected: Boolean(socials.GitHub.connected || socials.GitHub.handle),
      handle: socials.GitHub.handle || '',
    },
    Portfolio: {
      connected: Boolean(socials.Portfolio.connected || socials.Portfolio.handle),
      handle: socials.Portfolio.handle || '',
    },
  };
}

export function normalizeStudentProfile(rawProfile = {}, user = {}) {
  const activeUser = user.id || user.email ? user : getCurrentUser();
  const defaults = createDefaultStudentProfile(activeUser);
  const socials = normalizeSocials(rawProfile.socials, rawProfile.codingProfiles);
  const rawRole = String(rawProfile.role || '').trim();
  const role = rawRole && rawRole !== 'student' && rawRole !== LEGACY_DEMO_ROLE
    ? rawRole
    : defaults.role;

  const normalized = {
    ...defaults,
    ...rawProfile,
    userId: rawProfile.userId || activeUser.id || defaults.userId,
    name: rawProfile.name || activeUser.name || defaults.name,
    email: rawProfile.email || activeUser.email || defaults.email,
    role,
    degree: rawProfile.degree || rawProfile.branch || defaults.degree,
    branch: rawProfile.branch || rawProfile.degree || defaults.branch,
    semester: rawProfile.semester || '',
    gpa: rawProfile.gpa || rawProfile.cgpa || defaults.gpa,
    coursework: rawProfile.coursework || '',
    socials,
    codingProfiles: {
      ...DEFAULT_CODING_PROFILES,
      ...rawProfile.codingProfiles,
      LinkedIn: rawProfile.codingProfiles?.LinkedIn || socials.LinkedIn.handle || '',
      GitHub: rawProfile.codingProfiles?.GitHub || socials.GitHub.handle || '',
      Portfolio: rawProfile.codingProfiles?.Portfolio || socials.Portfolio.handle || '',
    },
    onboardingComplete: Boolean(
      rawProfile.onboardingComplete ||
      rawProfile.university ||
      rawProfile.degree ||
      rawProfile.skills?.length
    ),
  };

  normalized.cgpa = normalized.gpa;
  return normalized;
}

export function getStudentProfile(user = {}) {
  const activeUser = user.id || user.email ? user : getCurrentUser();
  const stored = getScopedJson(STUDENT_PROFILE_KEY, null, activeUser.id || activeUser.email);
  return normalizeStudentProfile(stored || {}, activeUser);
}

export function saveStudentProfile(profile, user = {}) {
  const normalized = normalizeStudentProfile(profile, user);
  const scope = user.id || user.email || normalized.userId || normalized.email;
  setScopedJson(STUDENT_PROFILE_KEY, normalized, scope);
  setScopedJson(STUDENT_ONBOARDING_KEY, normalized.onboardingComplete, scope);
  stateApi.saveStudentProfile(normalized).catch((error) => {
    console.error('Student profile sync error:', error);
  });
  return normalized;
}

export async function hydrateStudentProfile(user = {}) {
  const activeUser = user.id || user.email ? user : getCurrentUser();
  const profile = await stateApi.getStudentProfile();
  const normalized = normalizeStudentProfile(profile || {}, activeUser);
  const scope = activeUser.id || activeUser.email || normalized.userId || normalized.email;
  setScopedJson(STUDENT_PROFILE_KEY, normalized, scope);
  setScopedJson(STUDENT_ONBOARDING_KEY, normalized.onboardingComplete, scope);
  return normalized;
}

export function isStudentOnboardingComplete(user = {}) {
  const storedFlag = getScopedJson(STUDENT_ONBOARDING_KEY, null, user.id || user.email);
  if (storedFlag !== null) {
    return Boolean(storedFlag);
  }

  return getStudentProfile(user).onboardingComplete;
}
