export const INTERVIEW_FEEDBACK_KEY = 'careerpilot_interview_feedback';

const DEFAULT_FEEDBACK = [
  {
    id: 'fb1',
    title: 'Data Structures & Algorithms',
    topicId: 'algorithms',
    roleTrack: 'Software Engineer',
    score: 85,
    date: 'Oct 28',
    summary: 'Good complexity analysis. Code structure was clear but can optimize the space complexity.',
    strengths: ['Complexity analysis', 'Problem decomposition'],
    weakAreas: ['Space optimization'],
    questionCount: 3,
  },
  {
    id: 'fb2',
    title: 'Frontend Core (React/JS)',
    topicId: 'frontend',
    roleTrack: 'Frontend Engineer',
    score: 92,
    date: 'Oct 22',
    summary: 'Excellent understanding of Virtual DOM and React reconciliation mechanics.',
    strengths: ['React fundamentals', 'Framework fluency'],
    weakAreas: ['Testing examples'],
    questionCount: 3,
  },
  {
    id: 'fb3',
    title: 'Behavioral & Leadership',
    topicId: 'behave',
    roleTrack: 'Generalist',
    score: 78,
    date: 'Oct 15',
    summary: 'Detailed conflict resolution example. Make sure to structure responses using the STAR method.',
    strengths: ['Conflict resolution'],
    weakAreas: ['STAR structure'],
    questionCount: 3,
  },
];

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
    localStorage.setItem(INTERVIEW_FEEDBACK_KEY, JSON.stringify(DEFAULT_FEEDBACK));
    return DEFAULT_FEEDBACK.map(normalizeInterviewFeedback);
  }

  return JSON.parse(stored).map(normalizeInterviewFeedback);
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
