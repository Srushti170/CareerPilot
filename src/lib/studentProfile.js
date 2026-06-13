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

export const STUDENT_PROFILE_KEY = 'careerpilot_student_profile';
export const STUDENT_ONBOARDING_KEY = 'careerpilot_student_onboarding_complete';

export function createDefaultStudentProfile(user = {}) {
  return {
    name: user.name || 'Alex Rivera',
    email: user.email || 'student@university.edu',
    phone: '',
    role: 'CS Senior Student',
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
  const defaults = createDefaultStudentProfile(user);
  const socials = normalizeSocials(rawProfile.socials, rawProfile.codingProfiles);

  const normalized = {
    ...defaults,
    ...rawProfile,
    name: rawProfile.name || user.name || defaults.name,
    email: rawProfile.email || user.email || defaults.email,
    role: rawProfile.role && rawProfile.role !== 'student' ? rawProfile.role : defaults.role,
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
  const stored = localStorage.getItem(STUDENT_PROFILE_KEY);
  return normalizeStudentProfile(stored ? JSON.parse(stored) : {}, user);
}

export function saveStudentProfile(profile, user = {}) {
  const normalized = normalizeStudentProfile(profile, user);
  localStorage.setItem(STUDENT_PROFILE_KEY, JSON.stringify(normalized));
  localStorage.setItem(STUDENT_ONBOARDING_KEY, JSON.stringify(normalized.onboardingComplete));
  return normalized;
}

export function isStudentOnboardingComplete(user = {}) {
  const storedFlag = localStorage.getItem(STUDENT_ONBOARDING_KEY);
  if (storedFlag !== null) {
    try {
      return Boolean(JSON.parse(storedFlag));
    } catch {
      return storedFlag === 'true';
    }
  }

  return getStudentProfile(user).onboardingComplete;
}
