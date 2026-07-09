export const INTERVIEW_FEEDBACK_KEY = 'careerpilot_interview_feedback';

const SEEDED_FEEDBACK_IDS = new Set(['fb1', 'fb2', 'fb3']);

export function normalizeInterviewFeedback(entry) {
  return {
    id: entry.id || Date.now().toString(),
    title: entry.title || 'Mock Interview Session',
    topicId: entry.topicId || 'general',
    roleTrack: entry.roleTrack || 'Generalist',
    score: typeof entry.score === 'number' ? entry.score : 0,
    date: entry.date || new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
    summary: entry.summary || 'Session completed.',
    strengths: Array.isArray(entry.strengths) ? entry.strengths : [],
    weakAreas: Array.isArray(entry.weakAreas) ? entry.weakAreas : [],
    questionCount: entry.questionCount || 3,
  };
}

export function getInterviewFeedbackHistory() {
  const stored = localStorage.getItem(INTERVIEW_FEEDBACK_KEY);
  if (!stored) {
    return [];
  }

  const normalized = JSON.parse(stored)
    .filter((entry = {}) => !SEEDED_FEEDBACK_IDS.has(String(entry.id || '')))
    .map(normalizeInterviewFeedback);
  localStorage.setItem(INTERVIEW_FEEDBACK_KEY, JSON.stringify(normalized));
  return normalized;
}

export function saveInterviewFeedbackHistory(history) {
  const normalized = history.map(normalizeInterviewFeedback);
  localStorage.setItem(INTERVIEW_FEEDBACK_KEY, JSON.stringify(normalized));
  return normalized;
}

export function getInterviewDashboardStats(history = getInterviewFeedbackHistory()) {
  const sessions = history.length;
  const averageScore = sessions
    ? Math.round(history.reduce((sum, item) => sum + item.score, 0) / sessions)
    : 0;

  const weaknessFrequency = history.reduce((acc, item) => {
    item.weakAreas.forEach((area) => {
      acc[area] = (acc[area] || 0) + 1;
    });
    return acc;
  }, {});

  const topWeakAreas = Object.entries(weaknessFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([area]) => area);

  const latestSession = history[0] || null;

  return {
    sessions,
    averageScore,
    topWeakAreas,
    latestSession,
  };
}
