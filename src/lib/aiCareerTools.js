import { GoogleGenAI } from '@google/genai';

function cleanJsonString(str) {
  return String(str || '').replace(/```json/i, '').replace(/```/g, '').trim();
}

function getApiKey() {
  return import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || '';
}

export function isCareerAiAvailable() {
  return Boolean(getApiKey());
}

function getClient() {
  const apiKey = getApiKey();
  return apiKey ? new GoogleGenAI({ apiKey }) : null;
}

function sanitizeStringList(value, fallback = []) {
  return Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean)
    : fallback;
}

export async function analyzeResumeWithAI({ jobDescription, resumeText, studentProfile }) {
  const client = getClient();
  if (!client) {
    throw new Error('AI client unavailable');
  }

  const response = await client.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `You are an ATS and recruiter resume reviewer.
Analyze the student's resume against the target job description.
Return ONLY valid JSON in this shape:
{
  "atsScore": 82,
  "matchScore": 77,
  "missingKeywords": ["Docker", "System Design"],
  "strengths": [
    { "title": "Strong project evidence", "desc": "..." }
  ],
  "improvementTips": ["...", "..."],
  "suggestedBullets": ["...", "..."]
}

Rules:
- Scores must be integers from 0 to 100.
- Keep missingKeywords truthful and job-relevant.
- Give 3 to 5 strengths if possible.
- Give 4 to 6 concrete improvementTips.
- suggestedBullets must be resume-ready and truthful based on the resume content.
- Do not invent experience that is not supported by the resume.

Student profile context:
${JSON.stringify(studentProfile || {}, null, 2)}

Job description:
${jobDescription}

Resume text:
${resumeText}`,
  });

  const parsed = JSON.parse(cleanJsonString(response.text || '{}'));
  return {
    atsScore: Math.max(0, Math.min(100, Number(parsed.atsScore || 0))),
    matchScore: Math.max(0, Math.min(100, Number(parsed.matchScore || 0))),
    missingKeywords: sanitizeStringList(parsed.missingKeywords),
    strengths: Array.isArray(parsed.strengths)
      ? parsed.strengths
          .map((item) => ({
            title: String(item?.title || '').trim(),
            desc: String(item?.desc || '').trim(),
          }))
          .filter((item) => item.title && item.desc)
      : [],
    improvementTips: sanitizeStringList(parsed.improvementTips),
    suggestedBullets: sanitizeStringList(parsed.suggestedBullets),
  };
}

export async function tailorResumeWithAI({ profile, job, currentDraft }) {
  const client = getClient();
  if (!client) {
    throw new Error('AI client unavailable');
  }

  const response = await client.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `You are an expert resume coach.
Tailor this student's existing resume draft to the target job without inventing new experience.
Return ONLY valid JSON in this shape:
{
  "tailoredSummary": "string",
  "skills": ["skill 1", "skill 2"],
  "experienceBullets": ["bullet 1", "bullet 2", "bullet 3"],
  "projectBullets": ["bullet 1", "bullet 2"],
  "missingSkills": ["skill gap 1"],
  "suggestedBullets": ["optional recruiter-friendly bullet angle"],
  "matchScore": 83
}

Rules:
- Keep everything truthful to the provided profile and draft.
- Do not add technologies or achievements the student did not mention.
- Improve wording, relevance, and prioritization for the job.
- Keep skills concise and job-relevant.
- matchScore must be an integer from 0 to 100.

Student profile:
${JSON.stringify(profile || {}, null, 2)}

Target job:
${JSON.stringify(job || {}, null, 2)}

Current resume draft:
${JSON.stringify(currentDraft || {}, null, 2)}`,
  });

  const parsed = JSON.parse(cleanJsonString(response.text || '{}'));
  return {
    tailoredSummary: String(parsed.tailoredSummary || '').trim(),
    skills: sanitizeStringList(parsed.skills),
    experienceBullets: sanitizeStringList(parsed.experienceBullets),
    projectBullets: sanitizeStringList(parsed.projectBullets),
    missingSkills: sanitizeStringList(parsed.missingSkills),
    suggestedBullets: sanitizeStringList(parsed.suggestedBullets),
    matchScore: Math.max(0, Math.min(100, Number(parsed.matchScore || 0))),
  };
}

export async function generateCoverLetterWithAI({ profile, job, tailoredResume }) {
  const client = getClient();
  if (!client) {
    throw new Error('AI client unavailable');
  }

  const response = await client.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Write a concise, professional cover letter for this student and target job.
Use only the evidence present in the profile and resume package.
Do not invent experience.
Return plain text only, no markdown, no JSON.

Student profile:
${JSON.stringify(profile || {}, null, 2)}

Target job:
${JSON.stringify(job || {}, null, 2)}

Tailored resume package:
${JSON.stringify(tailoredResume || {}, null, 2)}`,
  });

  return String(response.text || '').trim();
}

export async function rankJobsForStudentWithAI({ profile, jobs }) {
  const client = getClient();
  if (!client) {
    throw new Error('AI client unavailable');
  }

  const trimmedJobs = (jobs || []).slice(0, 12).map((job) => ({
    company: job.company,
    title: job.title,
    location: job.location,
    type: job.type,
    locationType: job.locationType,
    tags: job.tags,
    shortDescription: job.shortDescription,
    description: job.description,
  }));

  const response = await client.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `You are a job matching assistant.
Rank these jobs for the student profile and return ONLY valid JSON as an array:
[
  {
    "company": "Stripe",
    "title": "Frontend Engineer",
    "matchScore": 88,
    "reason": "Why this role fits",
    "skillGap": "Main missing area"
  }
]

Rules:
- Score from 0 to 100.
- Keep reasons concise, one sentence.
- skillGap should be short and truthful.
- Use only the supplied profile and job data.

Student profile:
${JSON.stringify(profile || {}, null, 2)}

Jobs:
${JSON.stringify(trimmedJobs, null, 2)}`,
  });

  const parsed = JSON.parse(cleanJsonString(response.text || '[]'));
  return Array.isArray(parsed)
    ? parsed.map((item) => ({
        company: String(item.company || '').trim(),
        title: String(item.title || '').trim(),
        matchScore: Math.max(0, Math.min(100, Number(item.matchScore || 0))),
        reason: String(item.reason || '').trim(),
        skillGap: String(item.skillGap || '').trim(),
      }))
    : [];
}
