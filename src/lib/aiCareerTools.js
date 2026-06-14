import { GoogleGenAI } from '@google/genai';

function cleanJsonString(str) {
  return String(str || '').replace(/```json/i, '').replace(/```/g, '').trim();
}

function getApiKey() {
  return import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || '';
}

function getPreferredModel() {
  return (
    import.meta.env.VITE_GEMINI_MODEL ||
    import.meta.env.GEMINI_MODEL ||
    'gemini-2.5-flash'
  );
}

export function isCareerAiAvailable() {
  return Boolean(getApiKey());
}

function getClient() {
  const apiKey = getApiKey();
  return apiKey ? new GoogleGenAI({ apiKey }) : null;
}

async function generateWithCareerAi(contents) {
  const client = getClient();
  if (!client) {
    throw new Error('AI client unavailable');
  }

  return client.models.generateContent({
    model: getPreferredModel(),
    contents,
  });
}

export function getCareerAiErrorMessage(error) {
  const status = Number(error?.status || error?.cause?.status || 0);
  const rawMessage = String(error?.message || error || '');

  if (status === 429 || /quota|resource_exhausted|rate limit/i.test(rawMessage)) {
    return 'The configured Gemini AI quota is exhausted right now. Update the API key or wait for quota reset to continue AI interview transcription.';
  }

  if (status === 401 || status === 403 || /api key|permission|unauthorized|forbidden/i.test(rawMessage)) {
    return 'The configured Gemini API key is invalid or does not have permission for this request.';
  }

  return 'The AI provider could not complete this request right now.';
}

function sanitizeStringList(value, fallback = []) {
  return Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean)
    : fallback;
}

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function sentenceList(values = []) {
  return values.map((item) => `- ${item}`).join('\n');
}

function buildInterviewJobContext(target = {}) {
  const job = target.job || {};
  const candidate = target.candidate || null;
  const parts = [
    `Company: ${job.company || target.company || 'Unknown company'}`,
    `Role: ${job.title || target.title || 'Unknown role'}`,
    `Location: ${job.location || 'Not shared'}`,
    `Role type: ${job.type || 'Not shared'}`,
    `Experience level: ${job.experience || 'Not shared'}`,
    `Short description: ${job.shortDescription || 'Not shared'}`,
    `Requirements:\n${sentenceList(job.requirements || []) || '- Not shared'}`,
    `Responsibilities:\n${sentenceList(job.description || []) || '- Not shared'}`,
    `Tags:\n${sentenceList(job.tags || []) || '- Not shared'}`,
  ];

  if (candidate) {
    parts.push(
      `Candidate summary: ${candidate.summary || 'Not shared'}`,
      `Candidate skills:\n${sentenceList(candidate.skills || []) || '- Not shared'}`,
      `Candidate projects:\n${sentenceList(candidate.projects || []) || '- Not shared'}`,
      `Candidate experience:\n${sentenceList(candidate.experience || []) || '- Not shared'}`,
      `Potential skill gaps:\n${sentenceList(candidate.missingSkills || []) || '- None identified'}`
    );
  }

  return parts.join('\n\n');
}

export async function analyzeResumeWithAI({ jobDescription, resumeText, studentProfile }) {
  const response = await generateWithCareerAi(`You are an ATS and recruiter resume reviewer.
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
${resumeText}`);

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
  const response = await generateWithCareerAi(`You are an expert resume coach.
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
${JSON.stringify(currentDraft || {}, null, 2)}`);

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
  const response = await generateWithCareerAi(`Write a concise, professional cover letter for this student and target job.
Use only the evidence present in the profile and resume package.
Do not invent experience.
Return plain text only, no markdown, no JSON.

Student profile:
${JSON.stringify(profile || {}, null, 2)}

Target job:
${JSON.stringify(job || {}, null, 2)}

Tailored resume package:
${JSON.stringify(tailoredResume || {}, null, 2)}`);

  return String(response.text || '').trim();
}

export async function rankJobsForStudentWithAI({ profile, jobs }) {
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

  const response = await generateWithCareerAi(`You are a job matching assistant.
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
${JSON.stringify(trimmedJobs, null, 2)}`);

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

export async function reviewTailoredResumeForJobWithAI({ profile, job, tailoredResume, coverLetter = '' }) {
  const response = await generateWithCareerAi(`You are an AI recruiting assistant reviewing whether a student should apply now or improve the resume first.
Review the tailored resume package against the target job.
Return ONLY valid JSON in this shape:
{
  "atsScore": 74,
  "matchScore": 69,
  "readiness": "ready",
  "missingKeywords": ["Docker"],
  "requirementsToImprove": ["System design depth", "Production cloud exposure"],
  "improvementTips": ["...", "..."],
  "suggestedBullets": ["...", "..."],
  "reasoning": "1-2 sentence explanation for the decision"
}

Rules:
- readiness must be one of "ready", "needs-work", or "weak-fit"
- scores must be integers from 0 to 100
- do not invent experience
- missingKeywords and requirementsToImprove must be job-relevant
- if the role is a poor fit even after tailoring, say so clearly and explain what is missing
- suggestedBullets must remain truthful to the provided profile and draft

Student profile:
${JSON.stringify(profile || {}, null, 2)}

Target job:
${JSON.stringify(job || {}, null, 2)}

Tailored resume:
${JSON.stringify(tailoredResume || {}, null, 2)}

Cover letter:
${coverLetter}`);

  const parsed = JSON.parse(cleanJsonString(response.text || '{}'));
  return {
    atsScore: Math.max(0, Math.min(100, Number(parsed.atsScore || 0))),
    matchScore: Math.max(0, Math.min(100, Number(parsed.matchScore || 0))),
    readiness: ['ready', 'needs-work', 'weak-fit'].includes(parsed.readiness) ? parsed.readiness : 'needs-work',
    missingKeywords: sanitizeStringList(parsed.missingKeywords),
    requirementsToImprove: sanitizeStringList(parsed.requirementsToImprove),
    improvementTips: sanitizeStringList(parsed.improvementTips),
    suggestedBullets: sanitizeStringList(parsed.suggestedBullets),
    reasoning: String(parsed.reasoning || '').trim(),
  };
}

export async function generateInterviewOpeningQuestionWithAI(target) {
  const response = await generateWithCareerAi(`You are an experienced technical interviewer.
Create the opening interview question for this candidate and job.
Return ONLY valid JSON:
{
  "question": "string"
}

Rules:
- Ask exactly one question.
- Make it realistic, specific to the job description, and strong for a live interview opener.
- Keep it under 55 words.
- Do not add commentary outside the JSON.

Interview context:
${buildInterviewJobContext(target)}`);

  const parsed = JSON.parse(cleanJsonString(response.text || '{}'));
  return {
    question: normalizeText(parsed.question || ''),
  };
}

export async function generateInterviewFollowUpQuestionWithAI(target, qaHistory = []) {
  const response = await generateWithCareerAi(`You are an experienced live interviewer.
Generate the next best follow-up interview question based on the job and the candidate's previous answers.
Return ONLY valid JSON:
{
  "question": "string"
}

Rules:
- Ask exactly one question.
- Do not repeat a previous question.
- Push for depth, evidence, or job-specific relevance.
- Keep it under 55 words.

Interview context:
${buildInterviewJobContext(target)}

Recent question and answer history:
${JSON.stringify(qaHistory || [], null, 2)}`);

  const parsed = JSON.parse(cleanJsonString(response.text || '{}'));
  return {
    question: normalizeText(parsed.question || ''),
  };
}

export async function evaluateInterviewWithAI(target, qaHistory = []) {
  const response = await generateWithCareerAi(`You are an expert interview evaluator.
Evaluate this mock interview and return ONLY valid JSON:
{
  "score": 82,
  "summary": "string",
  "strengths": ["string", "string", "string"],
  "weakAreas": ["string", "string", "string"]
}

Rules:
- score must be an integer from 0 to 100
- summary should be 2 to 3 sentences
- strengths should have up to 3 concise items
- weakAreas should have up to 3 concise, actionable items
- ground the evaluation in the actual answers and the job requirements

Interview context:
${buildInterviewJobContext(target)}

Question and answer history:
${JSON.stringify(qaHistory || [], null, 2)}`);

  const parsed = JSON.parse(cleanJsonString(response.text || '{}'));
  return {
    score: Math.max(0, Math.min(100, Number(parsed.score || 0))),
    summary: normalizeText(parsed.summary || ''),
    strengths: sanitizeStringList(parsed.strengths).slice(0, 3),
    weakAreas: sanitizeStringList(parsed.weakAreas).slice(0, 3),
  };
}

export async function transcribeInterviewAudioWithAI({ mimeType = 'audio/webm', data }) {
  if (!data) {
    throw new Error('Audio data is required for transcription.');
  }

  const response = await generateWithCareerAi([
    {
      role: 'user',
      parts: [
        { text: 'Transcribe this interview answer accurately. Return only the plain spoken transcript with no commentary.' },
        {
          inlineData: {
            mimeType,
            data,
          },
        },
      ],
    },
  ]);

  return {
    transcript: normalizeText(response.text || ''),
  };
}
