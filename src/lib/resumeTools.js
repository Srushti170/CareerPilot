import { getStudentProfile } from './studentProfile';

function normalizeSentence(text) {
  return text?.replace(/\s+/g, ' ').trim() || '';
}

function titleCase(value = '') {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function extractKeywordsFromJob(job = {}) {
  const raw = [
    job.title,
    job.company,
    job.tags?.join(' '),
    job.description?.join(' '),
    job.shortDescription,
    job.missingSkills?.join(' '),
  ].filter(Boolean).join(' ');

  const tokens = raw
    .toLowerCase()
    .replace(/[^a-z0-9+#./\s-]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2);

  return Array.from(new Set(tokens))
    .filter((token) => /react|python|java|sql|aws|docker|kubernetes|typescript|javascript|node|api|design|figma|machine|learning|cloud|analytics|systems|frontend|backend|swift|leadership|agile/.test(token))
    .slice(0, 8)
    .map(titleCase);
}

function buildDefaultSummary(profile) {
  const degree = profile.degree || profile.branch || 'student';
  const skills = profile.skills?.slice(0, 4).join(', ');
  const projectSignal = profile.projects ? 'backed by hands-on project work' : 'with a focus on shipping reliable work';
  return normalizeSentence(
    `${profile.name || 'Candidate'} is a ${degree} ${projectSignal}. ${skills ? `Strengths include ${skills}.` : ''} ${profile.summary || ''}`
  );
}

function buildExperienceBullets(profile) {
  const bullets = [];

  if (profile.experience) {
    bullets.push(...profile.experience
      .split(/\n|[.;]/)
      .map(normalizeSentence)
      .filter(Boolean)
      .slice(0, 3));
  }

  if (bullets.length === 0 && profile.projects) {
    bullets.push(...profile.projects
      .split(/\n|[.;]/)
      .map(normalizeSentence)
      .filter(Boolean)
      .slice(0, 3));
  }

  if (bullets.length === 0) {
    bullets.push('Built and iterated on practical software and academic projects with strong ownership and follow-through.');
  }

  return bullets.map((bullet) => bullet.endsWith('.') ? bullet : `${bullet}.`);
}

function buildProjectBullets(profile) {
  if (profile.projects) {
    return profile.projects
      .split(/\n|[.;]/)
      .map(normalizeSentence)
      .filter(Boolean)
      .slice(0, 4)
      .map((bullet) => bullet.endsWith('.') ? bullet : `${bullet}.`);
  }

  return ['Add 1-2 high-signal projects here to strengthen job-specific applications.'];
}

export function buildResumeDraft(profile = getStudentProfile(), job = null) {
  const safeProfile = profile || getStudentProfile();
  const jobKeywords = job ? extractKeywordsFromJob(job) : [];
  const selectedSkills = Array.from(new Set([
    ...(safeProfile.skills || []),
    ...jobKeywords,
  ])).slice(0, 10);

  return {
    candidateName: safeProfile.name || 'Candidate',
    targetRole: job?.title || safeProfile.degree || safeProfile.branch || 'Target Role',
    targetCompany: job?.company || '',
    headline: safeProfile.role || 'Student Candidate',
    summary: buildDefaultSummary(safeProfile),
    skills: selectedSkills,
    education: {
      university: safeProfile.university || 'University',
      degree: safeProfile.degree || safeProfile.branch || 'Degree / Major',
      graduation: safeProfile.graduation || 'Graduation Year',
      gpa: safeProfile.gpa || '',
      coursework: safeProfile.coursework || '',
    },
    experienceBullets: buildExperienceBullets(safeProfile),
    projectBullets: buildProjectBullets(safeProfile),
    achievements: safeProfile.achievements
      ? safeProfile.achievements.split(/\n|[.;]/).map(normalizeSentence).filter(Boolean).slice(0, 3)
      : [],
    certifications: safeProfile.certifications
      ? safeProfile.certifications.split(/\n|[.;]/).map(normalizeSentence).filter(Boolean).slice(0, 3)
      : [],
    socials: safeProfile.socials || {},
    jobKeywords,
  };
}

export function tailorResumeForJob(profile = getStudentProfile(), job = null) {
  const draft = buildResumeDraft(profile, job);
  if (!job) {
    return {
      ...draft,
      tailoredSummary: draft.summary,
      missingSkills: [],
      suggestedBullets: [],
      matchScore: 70,
    };
  }

  const lowerSkills = new Set((profile.skills || []).map((skill) => skill.toLowerCase()));
  const missingSkills = (job.missingSkills || []).filter((skill) => !lowerSkills.has(skill.toLowerCase()));
  const suggestedBullets = draft.jobKeywords.slice(0, 3).map((keyword) => (
    `Demonstrated practical impact with ${keyword}, aligning project work to the needs of ${job.company}'s ${job.title} role.`
  ));

  const tailoredSummary = normalizeSentence(
    `${profile.name || 'Candidate'} is applying for the ${job.title} role at ${job.company}. ${draft.summary} ${draft.jobKeywords.length ? `Key alignment areas include ${draft.jobKeywords.slice(0, 4).join(', ')}.` : ''}`
  );

  const skillMatches = draft.jobKeywords.filter((keyword) => lowerSkills.has(keyword.toLowerCase())).length;
  const baseMatch = job.match || 70;
  const computedMatch = Math.min(99, Math.max(55, Math.round((baseMatch + (skillMatches * 4)) - (missingSkills.length * 2))));

  return {
    ...draft,
    tailoredSummary,
    missingSkills,
    suggestedBullets,
    matchScore: computedMatch,
  };
}

export function generateCoverLetter(profile = getStudentProfile(), job, tailoredResume) {
  const draft = tailoredResume || tailorResumeForJob(profile, job);
  const strengths = draft.skills.slice(0, 3).join(', ');
  return normalizeSentence(
    `Dear ${job.company} Hiring Team,

I am excited to apply for the ${job.title} role. My background in ${profile.degree || profile.branch || 'my academic program'}, combined with hands-on work in ${strengths || 'software delivery'}, makes this opportunity especially compelling.

I believe my experience with ${draft.jobKeywords.slice(0, 3).join(', ') || 'practical project execution'} would help me contribute quickly. I would welcome the opportunity to discuss how I can support ${job.company}'s goals.

Sincerely,
${profile.name || 'Candidate'}`
  );
}

export function createApplicationRecord(job, profile = getStudentProfile(), tailoredResume) {
  const resumeDraft = tailoredResume || tailorResumeForJob(profile, job);
  const appliedDate = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  const baseDate = new Date();
  const availableInterviewSlots = [2, 3, 4].map((offset, index) => {
    const slotDate = new Date(baseDate);
    slotDate.setDate(baseDate.getDate() + offset);
    return {
      id: `${Date.now()}-${index}`,
      label: slotDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      time: index === 0 ? '10:00 AM - 10:45 AM' : index === 1 ? '1:30 PM - 2:15 PM' : '4:00 PM - 4:45 PM',
    };
  });

  return {
    id: Date.now().toString(),
    company: job.company,
    role: job.title,
    studentName: profile.name || 'Student Candidate',
    studentUniversity: profile.university || '',
    studentBranch: profile.degree || profile.branch || '',
    studentGpa: profile.gpa || '',
    studentSkills: profile.skills || [],
    appliedDate,
    status: 'Applied',
    logo: job.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&background=random`,
    location: job.location,
    salary: job.salary || '',
    coverLetter: generateCoverLetter(profile, job, resumeDraft),
    resumeSnapshot: resumeDraft,
    matchScore: resumeDraft.matchScore || job.match || 0,
    missingSkills: resumeDraft.missingSkills || [],
    source: 'One-click apply',
    availableInterviewSlots,
    selectedInterviewSlot: null,
    offerDecision: null,
  };
}
