import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { GoogleGenAI } from '@google/genai';
import { Card } from './MetricCard';
import {
  getInterviewDashboardStats,
  getInterviewFeedbackHistory,
  saveInterviewFeedbackHistory,
} from '../lib/interviewInsights';
import { getPublishedJobs } from '../lib/recruiterData';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;
const MAX_CONTEXT_ANSWERS = 3;

function cleanJsonString(str) {
  return String(str || '').replace(/```json/i, '').replace(/```/g, '').trim();
}

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function slugify(value) {
  return normalizeText(value).toLowerCase();
}

function sentenceList(values = []) {
  return values.map((item) => `- ${item}`).join('\n');
}

function getSpeechRecognitionCtor() {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function getRoleTrack(job = {}) {
  const raw = `${job.title || ''} ${job.tags?.join(' ') || ''} ${job.requirements?.join(' ') || ''}`.toLowerCase();
  if (/frontend|react|ui|javascript|typescript/.test(raw)) return 'Frontend Engineer';
  if (/data|machine learning|analytics|python|sql/.test(raw)) return 'Data Scientist';
  if (/product|analyst|insight|metric/.test(raw)) return 'Product Analyst';
  return 'Software Engineer';
}

function matchJobFromApplication(application, jobs) {
  return jobs.find((job) => (
    slugify(job.company) === slugify(application.company) &&
    slugify(job.title) === slugify(application.role)
  ));
}

function buildCandidateSummary(application = {}) {
  const resume = application.resumeSnapshot || {};
  const education = resume.education || {};
  const skills = (resume.skills || application.studentSkills || []).filter(Boolean).slice(0, 8);

  return {
    name: application.studentName || resume.candidateName || 'Candidate',
    targetRole: resume.targetRole || application.role || 'Target role',
    targetCompany: resume.targetCompany || application.company || 'Company',
    summary: resume.tailoredSummary || resume.summary || '',
    skills,
    projects: resume.projectBullets || [],
    experience: resume.experienceBullets || [],
    achievements: resume.achievements || [],
    education: {
      university: education.university || application.studentUniversity || '',
      degree: education.degree || application.studentBranch || '',
      graduation: education.graduation || '',
      gpa: education.gpa || application.studentGpa || '',
    },
    matchScore: Number(application.matchScore || resume.matchScore || 0),
    missingSkills: application.missingSkills || resume.missingSkills || [],
  };
}

function buildInterviewTargets(applications = [], publishedJobs = []) {
  const applicationTargets = applications.map((application) => {
    const matchedJob = matchJobFromApplication(application, publishedJobs);
    const fallbackJob = {
      id: `app-job-${application.id}`,
      company: application.company || 'Hiring Company',
      title: application.role || 'Open Role',
      location: application.location || 'Location not shared',
      type: 'Applied role',
      locationType: 'Interview prep',
      experience: 'Entry Level',
      requirements: application.resumeSnapshot?.jobKeywords || application.studentSkills || [],
      tags: application.resumeSnapshot?.jobKeywords || [],
      shortDescription: application.coverLetter || 'Prepare for the role you already applied to.',
      description: [
        application.coverLetter || 'Review your application story and connect it back to the role.',
      ],
      missingSkills: application.missingSkills || [],
      logo: application.logo || '',
    };

    const job = matchedJob || fallbackJob;

    return {
      id: `application-${application.id}`,
      type: 'application',
      badge: application.status || 'Applied',
      sourceLabel: 'Applied role',
      roleTrack: getRoleTrack(job),
      company: job.company,
      title: job.title,
      subtitle: `${job.location || 'Location not shared'} - ${job.type || 'Role'}`,
      matchScore: Number(application.matchScore || job.match || 0),
      job,
      application,
      candidate: buildCandidateSummary(application),
    };
  });

  const existingJobKeys = new Set(applicationTargets.map((target) => `${slugify(target.company)}::${slugify(target.title)}`));

  const practiceTargets = publishedJobs
    .filter((job) => !existingJobKeys.has(`${slugify(job.company)}::${slugify(job.title)}`))
    .slice(0, 6)
    .map((job) => ({
      id: `job-${job.id}`,
      type: 'practice',
      badge: job.status || 'Active',
      sourceLabel: 'Practice job',
      roleTrack: getRoleTrack(job),
      company: job.company,
      title: job.title,
      subtitle: `${job.location} - ${job.type}`,
      matchScore: Number(job.match || 0),
      job,
      application: null,
      candidate: null,
    }));

  return [...applicationTargets, ...practiceTargets];
}

function buildJobContext(target) {
  if (!target) return '';

  const { job, candidate } = target;
  const parts = [
    `Company: ${job.company}`,
    `Role: ${job.title}`,
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

function getFallbackOpeningQuestion(target) {
  const job = target.job;
  const requirement = job.requirements?.[0] || job.tags?.[0] || 'the core responsibilities of this role';
  return `Thanks for joining. To start, tell me why you are interested in the ${job.title} role at ${job.company}, and how your background prepares you for ${requirement}.`;
}

function getFallbackFollowUpQuestion(target, history) {
  const asked = history.map((entry) => entry.question.toLowerCase());
  const pool = [
    `Tell me about a project where you used ${target.job.requirements?.[0] || target.job.tags?.[0] || 'the key skills required for this role'} in a practical way.`,
    `Which requirement in this job description feels strongest for you today, and what proof would you share with the hiring team?`,
    `What part of this role at ${target.job.company} would stretch you the most, and how would you close that gap quickly?`,
    `Imagine you join this team next month. What would your first 30 days look like?`,
    `How would you explain one technical decision from a recent project to a non-technical stakeholder?`,
    `Walk me through a challenge, trade-off, or failure from a project that is relevant to this job.`,
  ];

  return pool.find((question) => !asked.includes(question.toLowerCase())) || pool[pool.length - 1];
}

function buildFallbackFeedback({ target, answers }) {
  const wordCounts = answers.map((answer) => normalizeText(answer).split(/\s+/).filter(Boolean).length);
  const averageWords = wordCounts.length
    ? Math.round(wordCounts.reduce((sum, count) => sum + count, 0) / wordCounts.length)
    : 0;
  const coverage = Math.min(15, answers.filter(Boolean).length * 3);
  const score = Math.max(58, Math.min(96, 62 + coverage + Math.round(averageWords / 8)));

  return {
    id: Date.now().toString(),
    title: `${target.company} - ${target.title}`,
    topicId: target.job.id || 'job-interview',
    roleTrack: target.roleTrack,
    score,
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
    summary: `You completed a live job-based mock interview for ${target.title} at ${target.company}. Your next gains will come from sharper examples, stronger metrics, and tighter alignment to the job description.`,
    strengths: [
      averageWords >= 45 ? 'You gave detailed answers with enough context to sound interview-ready.' : 'You stayed concise and easy to follow.',
      'You completed a realistic spoken interview flow with role-specific prompts.',
      target.candidate?.matchScore ? `Your answers can build on an existing ${target.candidate.matchScore}% resume match.` : 'You have a strong base to tailor answers more tightly to the role.',
    ].filter(Boolean).slice(0, 3),
    weakAreas: [
      averageWords < 30 ? 'Add more depth, examples, and outcomes to each answer.' : 'Add clearer metrics, business impact, and trade-offs to each answer.',
      target.job.missingSkills?.[0] ? `Prepare a stronger story for ${target.job.missingSkills[0]} or explain your learning plan.` : 'Tie each answer back to the company and role more explicitly.',
      'Use a consistent answer structure like situation, action, result, and reflection.',
    ].slice(0, 3),
    questionCount: answers.length,
  };
}

async function generateOpeningQuestion(target) {
  if (!ai) return getFallbackOpeningQuestion(target);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are conducting a live mock interview.

Use the full role context below to ask exactly one opening interview question.
- The question must sound like a real interviewer speaking live.
- It must be specific to the company, role, and job description.
- It should invite the candidate to answer verbally in 60-120 seconds.
- Do not ask multiple questions at once.
- Return ONLY the question as plain text.

${buildJobContext(target)}`,
    });

    return normalizeText(response.text) || getFallbackOpeningQuestion(target);
  } catch (error) {
    console.error('Opening question generation error:', error);
    return getFallbackOpeningQuestion(target);
  }
}

async function generateFollowUpQuestion(target, qaHistory) {
  if (!ai) return getFallbackFollowUpQuestion(target, qaHistory);

  const recentHistory = qaHistory.slice(-MAX_CONTEXT_ANSWERS).map((entry, index) => (
    `Round ${index + 1}\nQuestion: ${entry.question}\nAnswer: ${entry.answer || ''}`
  )).join('\n\n');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are conducting a live mock interview and need the next follow-up question.

Rules:
- Ask exactly one question.
- The question must adapt to the candidate's last answer.
- Keep it relevant to the job description and the candidate's background.
- Vary across motivation, technical depth, project evidence, communication, trade-offs, and behavioral judgment.
- Avoid repeating earlier questions.
- Return ONLY the next question as plain text.

Role context:
${buildJobContext(target)}

Conversation so far:
${recentHistory}`,
    });

    return normalizeText(response.text) || getFallbackFollowUpQuestion(target, qaHistory);
  } catch (error) {
    console.error('Follow-up question generation error:', error);
    return getFallbackFollowUpQuestion(target, qaHistory);
  }
}

async function evaluateInterview(target, qaHistory) {
  const answers = qaHistory.map((entry) => entry.answer || '');
  if (!ai) return buildFallbackFeedback({ target, answers });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are evaluating a completed mock interview.

Assess the candidate on:
- communication and clarity
- job-specific relevance
- technical or functional depth
- confidence and structure
- awareness of trade-offs and impact

Role context:
${buildJobContext(target)}

Interview transcript:
${qaHistory.map((entry, index) => `Question ${index + 1}: ${entry.question}\nAnswer ${index + 1}: ${entry.answer || ''}`).join('\n\n')}

Return ONLY JSON:
{
  "score": 84,
  "summary": "2-3 sentence summary",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weakAreas": ["weak area 1", "weak area 2", "weak area 3"]
}`,
    });

    const parsed = JSON.parse(cleanJsonString(response.text || '{}'));
    if (typeof parsed.score === 'number' && parsed.summary) {
      return {
        id: Date.now().toString(),
        title: `${target.company} - ${target.title}`,
        topicId: target.job.id || 'job-interview',
        roleTrack: target.roleTrack,
        score: Math.max(0, Math.min(100, Math.round(parsed.score))),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
        summary: normalizeText(parsed.summary),
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(normalizeText).filter(Boolean).slice(0, 3) : [],
        weakAreas: Array.isArray(parsed.weakAreas) ? parsed.weakAreas.map(normalizeText).filter(Boolean).slice(0, 3) : [],
        questionCount: qaHistory.length,
      };
    }
  } catch (error) {
    console.error('Interview evaluation error:', error);
  }

  return buildFallbackFeedback({ target, answers });
}

export function MockInterviews({ applications = [] }) {
  const videoRef = useRef(null);
  const recognitionRef = useRef(null);
  const shouldKeepListeningRef = useRef(false);
  const manualStopRef = useRef(false);
  const restartListeningTimeoutRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  const [selectedTargetId, setSelectedTargetId] = useState('');
  const [questionCount, setQuestionCount] = useState(4);
  const [preparingSession, setPreparingSession] = useState(false);
  const [loadingNextQuestion, setLoadingNextQuestion] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [sessionCompleted, setSessionCompleted] = useState(null);
  const [feedbackHistory, setFeedbackHistory] = useState(() => getInterviewFeedbackHistory());

  const [mediaEnabled, setMediaEnabled] = useState(false);
  const [recordingActive, setRecordingActive] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState('');
  const [permissionError, setPermissionError] = useState('');
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [answerDraft, setAnswerDraft] = useState('');
  const [answerSeconds, setAnswerSeconds] = useState(0);
  const [interimTranscript, setInterimTranscript] = useState('');

  const publishedJobs = useMemo(() => getPublishedJobs(), []);
  const interviewTargets = useMemo(
    () => buildInterviewTargets(applications, publishedJobs),
    [applications, publishedJobs]
  );
  const selectedTarget = useMemo(
    () => interviewTargets.find((target) => target.id === selectedTargetId) || interviewTargets[0] || null,
    [interviewTargets, selectedTargetId]
  );
  const dashboardStats = useMemo(() => getInterviewDashboardStats(feedbackHistory), [feedbackHistory]);
  const recognitionSupported = typeof window !== 'undefined' && Boolean(getSpeechRecognitionCtor());
  const activeQuestion = activeSession?.questions?.[activeSession.currentQuestionIndex] || '';

  useEffect(() => {
    if (!selectedTargetId && interviewTargets[0]) {
      setSelectedTargetId(interviewTargets[0].id);
    }
  }, [interviewTargets, selectedTargetId]);

  useEffect(() => {
    if (videoRef.current && mediaStreamRef.current) {
      videoRef.current.srcObject = mediaStreamRef.current;
    }
  }, [mediaEnabled, activeSession]);

  useEffect(() => {
    let timer;
    if (isListening) {
      timer = window.setInterval(() => setAnswerSeconds((prev) => prev + 1), 1000);
    } else {
      setAnswerSeconds(0);
    }
    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [isListening]);

  useEffect(() => {
    if (!activeQuestion || !activeSession) return;
    speakQuestion(activeQuestion);
  }, [activeQuestion, activeSession?.currentQuestionIndex]);

  useEffect(() => () => {
    stopListening();
    stopMedia();
    window.speechSynthesis?.cancel();
    if (restartListeningTimeoutRef.current) {
      window.clearTimeout(restartListeningTimeoutRef.current);
    }
  }, []);

  function stopMedia() {
    stopRecording();
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setMediaEnabled(false);
  }

  function startRecording(stream) {
    if (typeof MediaRecorder === 'undefined') return;
    if (mediaRecorderRef.current?.state === 'recording') return;

    try {
      recordedChunksRef.current = [];
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      recorder.onstart = () => setRecordingActive(true);
      recorder.onstop = () => {
        setRecordingActive(false);
        if (recordedChunksRef.current.length > 0) {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          const nextUrl = URL.createObjectURL(blob);
          setRecordingUrl((previous) => {
            if (previous) URL.revokeObjectURL(previous);
            return nextUrl;
          });
        }
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
    } catch (error) {
      console.error('Media recording error:', error);
      setRecordingActive(false);
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
  }

  async function requestMediaAccess() {
    setPermissionError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      mediaStreamRef.current = stream;
      setMediaEnabled(true);
      return true;
    } catch (error) {
      console.error('Media permission error:', error);
      setPermissionError('Camera and microphone access are required for the live mock interview experience.');
      return false;
    }
  }

  function speakQuestion(question) {
    if (!question || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(question);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onstart = () => setIsAiSpeaking(true);
    utterance.onend = () => setIsAiSpeaking(false);
    utterance.onerror = () => setIsAiSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }

  function startListening() {
    if (!recognitionSupported || isListening) return;

    const RecognitionCtor = getSpeechRecognitionCtor();
    const recognition = new RecognitionCtor();
    manualStopRef.current = false;
    shouldKeepListeningRef.current = true;
    setPermissionError('');
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setInterimTranscript('');
    };

    recognition.onresult = (event) => {
      let finalText = '';
      let interimText = '';

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcript = event.results[index][0].transcript;
        if (event.results[index].isFinal) {
          finalText += `${transcript} `;
        } else {
          interimText += transcript;
        }
      }

      if (finalText) {
        setAnswerDraft((prev) => `${prev} ${finalText}`.trim());
      }
      setInterimTranscript(interimText.trim());
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        shouldKeepListeningRef.current = false;
        setPermissionError('Microphone transcription permission was blocked by the browser. Please allow mic access and try again.');
      } else if (event.error === 'audio-capture') {
        shouldKeepListeningRef.current = false;
        setPermissionError('No microphone input was detected. Please check your mic and browser device settings.');
      } else if (event.error === 'no-speech') {
        setPermissionError('No speech was detected yet. Keep the mic open and start speaking clearly.');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
      const shouldRestart = shouldKeepListeningRef.current && !manualStopRef.current;
      if (shouldRestart) {
        restartListeningTimeoutRef.current = window.setTimeout(() => {
          if (shouldKeepListeningRef.current && !recognitionRef.current) {
            startListening();
          }
        }, 200);
        return;
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  function stopListening() {
    shouldKeepListeningRef.current = false;
    manualStopRef.current = true;
    if (restartListeningTimeoutRef.current) {
      window.clearTimeout(restartListeningTimeoutRef.current);
      restartListeningTimeoutRef.current = null;
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }

  async function handleInitializeSession() {
    if (!selectedTarget) return;

    const accessGranted = mediaEnabled || await requestMediaAccess();
    if (!accessGranted) return;

    setPreparingSession(true);
    setSessionCompleted(null);
    setAnswerDraft('');
    setInterimTranscript('');
    setPermissionError('');
    if (recordingUrl) {
      URL.revokeObjectURL(recordingUrl);
      setRecordingUrl('');
    }

    const openingQuestion = await generateOpeningQuestion(selectedTarget);
    if (mediaStreamRef.current) {
      startRecording(mediaStreamRef.current);
    }

    setActiveSession({
      target: selectedTarget,
      currentQuestionIndex: 0,
      questionCount,
      questions: [openingQuestion],
      qaHistory: [],
      startedAt: new Date().toISOString(),
    });
    setPreparingSession(false);
  }

  async function handleSubmitAnswer() {
    if (!activeSession) return;

    stopListening();
    const normalizedAnswer = normalizeText(`${answerDraft} ${interimTranscript}`);
    if (!normalizedAnswer) return;

    const currentQuestion = activeSession.questions[activeSession.currentQuestionIndex];
    const nextQaHistory = [
      ...activeSession.qaHistory,
      {
        question: currentQuestion,
        answer: normalizedAnswer,
      },
    ];

    const answeredCount = nextQaHistory.length;
    if (answeredCount >= activeSession.questionCount) {
      setEvaluating(true);
      const finalFeedback = await evaluateInterview(activeSession.target, nextQaHistory);
      const persistedHistory = saveInterviewFeedbackHistory([finalFeedback, ...feedbackHistory]);
      setFeedbackHistory(persistedHistory);
      setSessionCompleted(finalFeedback);
      setEvaluating(false);
      setActiveSession(null);
      setAnswerDraft('');
      setInterimTranscript('');
      stopRecording();
      return;
    }

    setLoadingNextQuestion(true);
    const nextQuestion = await generateFollowUpQuestion(activeSession.target, nextQaHistory);
    setActiveSession({
      ...activeSession,
      currentQuestionIndex: activeSession.currentQuestionIndex + 1,
      questions: [...activeSession.questions, nextQuestion],
      qaHistory: nextQaHistory,
    });
    setAnswerDraft('');
    setInterimTranscript('');
    setLoadingNextQuestion(false);
  }

  function quitSession() {
    stopListening();
    window.speechSynthesis?.cancel();
    setActiveSession(null);
    setAnswerDraft('');
    setInterimTranscript('');
    setPreparingSession(false);
    setLoadingNextQuestion(false);
    stopRecording();
  }

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-8 pb-12 pt-24">
      <header className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
        <div>
          <div className="mb-2 flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-1">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary"></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">
              {ai ? 'JD-Aware AI Interviewer' : 'Live Browser Interview Mode'}
            </span>
          </div>
          <h2 className="text-4xl font-black tracking-tighter text-on-surface">AI Mock Interview</h2>
          <p className="mt-2 max-w-3xl text-lg font-medium text-slate-500">
            Pick a real job, turn on your camera and mic, and practice a live interview that adapts to the role,
            the company, and your answers.
          </p>
        </div>
      </header>

      {!activeSession && !preparingSession && !evaluating && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_0.9fr_0.9fr]">
          <Card className="p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Interview target</p>
            <p className="mt-2 text-sm text-slate-600">
              {interviewTargets.filter((item) => item.type === 'application').length} applied roles and{' '}
              {interviewTargets.filter((item) => item.type === 'practice').length} practice jobs ready.
            </p>
          </Card>

          <Card className="p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Question count</p>
            <div className="mt-3 flex gap-2">
              {[4, 6].map((count) => (
                <button
                  key={count}
                  onClick={() => setQuestionCount(count)}
                  className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                    questionCount === count ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {count} questions
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Readiness</p>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <p><span className="font-semibold text-slate-900">{dashboardStats.sessions}</span> completed sessions</p>
              <p><span className="font-semibold text-slate-900">{dashboardStats.averageScore}%</span> average score</p>
              <p>{recognitionSupported ? 'Voice transcription supported in this browser.' : 'Voice transcription is not supported in this browser.'}</p>
            </div>
          </Card>
        </div>
      )}

      {permissionError && (
        <div className="rounded-2xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          {permissionError}
        </div>
      )}

      {preparingSession && (
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-3xl border border-slate-100 bg-white p-20 text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-primary"></div>
          <h4 className="text-xl font-bold text-slate-700">Preparing your interview session...</h4>
          <p className="text-sm text-slate-500">Analyzing the job description and generating the opening question.</p>
        </div>
      )}

      {evaluating && (
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-3xl border border-slate-100 bg-white p-20 text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-primary"></div>
          <h4 className="text-xl font-bold text-slate-700">Analyzing your interview...</h4>
          <p className="text-sm text-slate-500">Scoring delivery, role fit, technical depth, and communication quality.</p>
        </div>
      )}

      <AnimatePresence mode="wait">
        {activeSession && !preparingSession && !evaluating ? (
          <motion.div
            key="live-session"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-12 gap-8"
          >
            <div className="col-span-12 space-y-6 lg:col-span-7">
              <Card className="space-y-6 p-6 md:p-8">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary">
                    Question {activeSession.currentQuestionIndex + 1} of {activeSession.questionCount}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    {activeSession.target.company} - {activeSession.target.title}
                  </span>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">AI interviewer prompt</p>
                    <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${isAiSpeaking ? 'bg-primary text-white' : 'bg-slate-200 text-slate-600'}`}>
                      {isAiSpeaking ? 'Speaking' : 'Ready'}
                    </span>
                  </div>
                  <h4 className="text-xl font-bold leading-snug text-slate-800">{activeQuestion}</h4>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      onClick={() => speakQuestion(activeQuestion)}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      Repeat question
                    </button>
                    <button
                      onClick={stopListening}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      Pause listening
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Your spoken answer</p>
                    <div className="flex items-center gap-2">
                      {isListening && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                          Listening - {answerSeconds}s
                        </span>
                      )}
                      <button
                        onClick={isListening ? stopListening : startListening}
                        disabled={!recognitionSupported || loadingNextQuestion}
                        className={`rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                          isListening ? 'bg-danger text-white' : 'bg-primary text-white'
                        } disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500`}
                      >
                        {isListening ? 'Stop answer' : 'Start answer'}
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows="10"
                    value={answerDraft}
                    onChange={(event) => setAnswerDraft(event.target.value)}
                    placeholder="Your spoken answer will appear here. You can refine the transcript before moving on."
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-primary/20"
                  />

                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Live transcript</p>
                    <p className="mt-2 text-sm text-slate-600">
                      {interimTranscript || 'Interim speech transcription will appear here while you are answering.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={quitSession}
                    className="rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-500 transition-colors hover:bg-slate-50"
                  >
                    Quit session
                  </button>
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={loadingNextQuestion || !normalizeText(`${answerDraft} ${interimTranscript}`)}
                    className="rounded-xl bg-primary px-6 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-primary/15 transition-all hover:shadow-primary/25 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                  >
                    {loadingNextQuestion
                      ? 'Generating follow-up...'
                      : activeSession.currentQuestionIndex === activeSession.questionCount - 1
                        ? 'Finish and analyze'
                        : 'Next question'}
                  </button>
                </div>
              </Card>
            </div>

            <div className="col-span-12 space-y-6 lg:col-span-5">
              <Card className="overflow-hidden p-0">
                <div className="border-b border-slate-100 bg-slate-900 px-5 py-4 text-white">
                  <p className="text-sm font-bold">Live camera preview</p>
                  <p className="mt-1 text-xs text-slate-300">Practice with the same camera presence and speaking rhythm you would use in a real interview.</p>
                </div>
                <div className="relative aspect-[4/3] bg-black">
                  {mediaEnabled ? (
                    <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-400">Camera preview unavailable</div>
                  )}
                  <div className="absolute right-4 top-4 rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur">
                    {recordingActive ? 'Recording live' : mediaEnabled ? 'Camera on' : 'Camera off'}
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h4 className="font-bold text-on-surface">Target role context</h4>
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="font-semibold text-slate-900">{activeSession.target.company} - {activeSession.target.title}</p>
                    <p className="mt-1">{activeSession.target.subtitle}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Core skills</p>
                    <p className="mt-2">
                      {(activeSession.target.job.requirements || activeSession.target.job.tags || []).slice(0, 6).join(', ') || 'Skills not provided'}
                    </p>
                  </div>
                  {activeSession.target.candidate && (
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Resume fit</p>
                      <p className="mt-2">
                        {activeSession.target.candidate.matchScore || activeSession.target.matchScore}% match with candidate profile
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="overflow-hidden border-0 bg-primary p-6 text-white shadow-xl">
                <h4 className="font-bold">Interview signals</h4>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="rounded-xl bg-white/10 p-3">Mic: {recognitionSupported ? 'Speech recognition ready' : 'Browser speech recognition unavailable'}</div>
                  <div className="rounded-xl bg-white/10 p-3">Delivery: {isListening ? 'Capturing live answer' : 'Waiting for your response'}</div>
                  <div className="rounded-xl bg-white/10 p-3">AI: {ai ? 'Job-aware questioning and evaluation enabled' : 'Fallback interview logic enabled'}</div>
                  <div className="rounded-xl bg-white/10 p-3">Recording: {recordingActive ? 'Session is being recorded' : 'Recording idle'}</div>
                </div>
              </Card>
            </div>
          </motion.div>
        ) : null}

        {sessionCompleted && !preparingSession && !evaluating && (
          <motion.div
            key="session-completed"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mx-auto max-w-4xl"
          >
            <Card className="space-y-6 p-8 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600">
                <span className="material-symbols-outlined text-4xl">check_circle</span>
              </div>

              <h3 className="text-3xl font-black text-slate-800">Interview complete</h3>
              <p className="mx-auto max-w-md text-sm text-slate-500">
                Your live interview was evaluated and saved to your feedback history.
              </p>

              <div className="mx-auto max-w-sm rounded-2xl border border-slate-100 bg-slate-50 p-6">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{sessionCompleted.title}</span>
                <div className="mt-2 text-5xl font-black text-primary">{sessionCompleted.score}%</div>
                <p className="mt-4 text-xs font-semibold leading-relaxed text-slate-600">{sessionCompleted.summary}</p>
                <p className="mt-3 text-[11px] font-semibold text-slate-500">
                  {sessionCompleted.roleTrack} - {sessionCompleted.questionCount} questions
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-white p-5 text-left">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Strengths</p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-700">
                    {(sessionCompleted.strengths || []).map((item) => <li key={item}>- {item}</li>)}
                  </ul>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white p-5 text-left">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Weak areas</p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-700">
                    {(sessionCompleted.weakAreas || []).map((item) => <li key={item}>- {item}</li>)}
                  </ul>
                </div>
              </div>

              {recordingUrl && (
                <div className="rounded-2xl border border-slate-100 bg-white p-5 text-left">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recorded session</p>
                  <video controls className="mt-3 w-full rounded-2xl bg-black" src={recordingUrl} />
                </div>
              )}

              <div className="flex justify-center gap-3 pt-4">
                <button
                  onClick={() => setSessionCompleted(null)}
                  className="rounded-xl bg-slate-100 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-200"
                >
                  Back to hub
                </button>
                <button
                  onClick={handleInitializeSession}
                  className="rounded-xl bg-primary px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-primary/10 hover:shadow-primary/25"
                >
                  Start new session
                </button>
              </div>
            </Card>
          </motion.div>
        )}

        {!activeSession && !sessionCompleted && !preparingSession && !evaluating && (
          <motion.div
            key={selectedTarget?.id || 'none'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 grid grid-cols-12 gap-8"
          >
            <div className="col-span-12 space-y-6 lg:col-span-8">
              <Card className="p-6">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h4 className="text-xl font-black text-on-surface">Choose a job for your interview</h4>
                    <p className="mt-1 text-sm text-slate-500">Applied roles appear first so you can practice for real opportunities in your pipeline.</p>
                  </div>
                  <button
                    onClick={requestMediaAccess}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-50"
                  >
                    Allow camera and mic
                  </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {interviewTargets.map((target) => {
                    const isSelected = selectedTarget?.id === target.id;
                    return (
                      <button
                        key={target.id}
                        onClick={() => setSelectedTargetId(target.id)}
                        className={`rounded-3xl border p-5 text-left transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                              target.type === 'application' ? 'bg-success-soft text-success' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {target.sourceLabel}
                            </span>
                            <h5 className="mt-3 text-lg font-black leading-tight text-slate-900">{target.title}</h5>
                            <p className="mt-1 text-sm font-semibold text-slate-600">{target.company}</p>
                          </div>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                            {target.matchScore}%
                          </span>
                        </div>
                        <p className="mt-3 text-sm text-slate-500">{target.subtitle}</p>
                        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                          {target.job.shortDescription || target.job.description?.[0] || 'Role details available after selection.'}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {(target.job.requirements || target.job.tags || []).slice(0, 4).map((item) => (
                            <span key={`${target.id}-${item}`} className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
                              {item}
                            </span>
                          ))}
                        </div>
                        <div className="mt-4 flex items-center justify-between text-xs font-semibold text-slate-500">
                          <span>{target.roleTrack}</span>
                          <span>{target.badge}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Card>

              {selectedTarget ? (
                <Card className="relative flex min-h-[420px] flex-col justify-between border-2 border-dashed border-slate-200 bg-slate-50 p-8">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary">
                        {selectedTarget.company} - {selectedTarget.title}
                      </span>
                      <span className="rounded-full bg-slate-200 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-600">
                        {selectedTarget.roleTrack}
                      </span>
                    </div>

                    <h4 className="mt-6 text-3xl font-black leading-tight text-on-surface">
                      Ready to start a live interview for this job?
                    </h4>
                    <p className="mt-4 max-w-2xl text-sm font-medium leading-6 text-slate-500">
                      The system will analyze the job description, generate an opening question, ask adaptive follow-ups,
                      capture your voice, and record the full camera-plus-mic session for review.
                    </p>

                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-slate-100 bg-white p-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Job requirements</p>
                        <p className="mt-2 text-sm leading-6 text-slate-700">
                          {(selectedTarget.job.requirements || []).slice(0, 6).join(', ') || 'No structured requirements available'}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-100 bg-white p-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Candidate context</p>
                        <p className="mt-2 text-sm leading-6 text-slate-700">
                          {selectedTarget.candidate
                            ? `${selectedTarget.candidate.name} with ${selectedTarget.candidate.skills.slice(0, 5).join(', ') || 'profile data'}`
                            : 'This is practice mode using the job description only.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex flex-wrap gap-3">
                    <button
                      onClick={handleInitializeSession}
                      className="rounded-2xl bg-primary px-10 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                    >
                      Start live interview
                    </button>
                    <button
                      onClick={requestMediaAccess}
                      className="rounded-2xl border border-slate-300 bg-white px-6 py-3 text-xs font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50"
                    >
                      Test camera and mic
                    </button>
                  </div>

                  <div className="absolute left-10 top-10 flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                    <span className="material-symbols-outlined text-sm text-primary">mic</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                      {recognitionSupported ? 'Voice input ready' : 'Voice input unsupported'}
                    </span>
                  </div>
                  <div className="absolute bottom-10 right-10 flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                    <span className="material-symbols-outlined text-sm text-primary">smart_toy</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                      {ai ? 'AI adaptive interviewer' : 'Fallback interviewer'}
                    </span>
                  </div>
                </Card>
              ) : (
                <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-slate-200 bg-surface-container-low/30 p-20 text-center">
                  <span className="material-symbols-outlined animate-bounce text-6xl text-slate-200">work_history</span>
                  <h4 className="text-xl font-bold text-slate-400">Add or publish a job to unlock live interview practice</h4>
                </div>
              )}
            </div>

            <div className="col-span-12 space-y-6 lg:col-span-4">
              <Card className="p-6">
                <h4 className="mb-6 flex items-center justify-between font-bold text-on-surface">
                  Recent Feedback
                  <span className="text-[10px] font-black uppercase text-slate-400">Archive</span>
                </h4>
                <div className="max-h-80 space-y-4 overflow-y-auto">
                  {feedbackHistory.map((feedback) => (
                    <div key={feedback.id} className="group rounded-xl border border-transparent bg-surface-container-low p-4 transition-colors hover:border-slate-200 hover:bg-slate-100">
                      <div className="mb-1 flex items-start justify-between">
                        <h5 className="leading-tight text-xs font-black text-on-surface transition-colors group-hover:text-primary">{feedback.title}</h5>
                        <span className="ml-2 shrink-0 text-sm font-bold text-primary">{feedback.score}%</span>
                      </div>
                      <p className="text-[10px] font-bold uppercase text-slate-400">{feedback.date} - {feedback.roleTrack}</p>
                      <p className="mt-2 line-clamp-3 text-[11px] font-medium leading-relaxed text-slate-500">{feedback.summary}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="relative overflow-hidden border-0 bg-primary p-6 text-white shadow-xl">
                <div className="relative z-10">
                  <h4 className="mb-2 font-bold">Focus Areas</h4>
                  <p className="mb-6 text-xs opacity-70">Weak areas detected from your recent mock interviews.</p>
                  <div className="space-y-3">
                    {(dashboardStats.topWeakAreas.length > 0
                      ? dashboardStats.topWeakAreas
                      : ['Complete a few sessions to uncover patterns']).map((area, index) => (
                      <div key={area} className="rounded-xl bg-white/10 p-3">
                        <p className="text-sm font-semibold">{index + 1}. {area}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <span className="material-symbols-outlined absolute -bottom-10 -right-10 rotate-12 text-[160px] opacity-10">emoji_events</span>
              </Card>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
