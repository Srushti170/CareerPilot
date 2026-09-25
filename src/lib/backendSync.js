import {
  generateInterviewFollowUpQuestionWithAI,
  generateInterviewOpeningQuestionWithAI,
  evaluateInterviewWithAI,
  isCareerAiAvailable,
  transcribeInterviewAudioWithAI,
} from './aiCareerTools';
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

const rawLocalStorage = {
  getItem: window.localStorage.getItem.bind(window.localStorage),
  setItem: window.localStorage.setItem.bind(window.localStorage),
  removeItem: window.localStorage.removeItem.bind(window.localStorage),
  clear: window.localStorage.clear.bind(window.localStorage),
};

let initialized = false;
let patched = false;
let syncTimer = null;
const pendingEntries = new Map();
const pendingDeletes = new Set();
const STORAGE_SYNC_BLOCKLIST = new Set([
  'careerpilot_users',
  'careerpilot_current_user',
  'careerpilot_session_token',
  'careerpilot_applications',
  'careerpilot_notifications',
  'careerpilot_jobs',
  'careerpilot_companies',
  'careerpilot_students',
  'careerpilot_announcements',
  'careerpilot_student_profile',
  'careerpilot_student_onboarding_complete',
  'careerpilot_interview_feedback',
  'careerpilot_resume_versions',
  'careerpilot_latest_resume_analysis',
  'careerpilot_settings',
  'careerpilot_notification_preferences',
]);
const LEGACY_SHARED_CACHE_KEYS = [
  'careerpilot_applications',
  'careerpilot_notifications',
  'careerpilot_student_profile',
  'careerpilot_student_onboarding_complete',
];

function emitStorageSyncEvent(key, value = null, action = 'set') {
  window.dispatchEvent(new CustomEvent('careerpilot:storage-updated', {
    detail: { key, value, action },
  }));

  if (key) {
    window.dispatchEvent(new CustomEvent(`careerpilot:storage-updated:${key}`, {
      detail: { key, value, action },
    }));
  }
}

function isStorageSyncBlocked(key) {
  return Array.from(STORAGE_SYNC_BLOCKLIST).some(
    (blockedKey) => key === blockedKey || key.startsWith(`${blockedKey}:`)
  );
}

async function request(path, options = {}) {
  const token = rawLocalStorage.getItem('careerpilot_session_token');
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || `Request failed: ${response.status}`);
  }

  return response.json().catch(() => null);
}

function scheduleSync() {
  if (syncTimer) return;
  syncTimer = window.setTimeout(async () => {
    const entries = Object.fromEntries(
      Array.from(pendingEntries).filter(([key]) => !isStorageSyncBlocked(key))
    );
    const deletes = Array.from(pendingDeletes).filter((key) => !isStorageSyncBlocked(key));
    pendingEntries.clear();
    pendingDeletes.clear();
    syncTimer = null;

    if (!rawLocalStorage.getItem('careerpilot_session_token')) return;

    try {
      if (Object.keys(entries).length > 0) {
        await request('/storage/bulk', {
          method: 'POST',
          body: JSON.stringify({ entries }),
        });
      }

      await Promise.all(deletes.map((key) => request(`/storage/${encodeURIComponent(key)}`, { method: 'DELETE' })));
    } catch (error) {
      console.error('Backend sync error:', error);
    }
  }, 120);
}

function patchLocalStorage() {
  if (patched) return;
  patched = true;

  window.localStorage.setItem = (key, value) => {
    rawLocalStorage.setItem(key, value);
    if (isStorageSyncBlocked(key)) {
      emitStorageSyncEvent(key, String(value), 'set');
      return;
    }
    pendingDeletes.delete(key);
    pendingEntries.set(key, String(value));
    emitStorageSyncEvent(key, String(value), 'set');
    scheduleSync();
  };

  window.localStorage.removeItem = (key) => {
    rawLocalStorage.removeItem(key);
    if (isStorageSyncBlocked(key)) {
      emitStorageSyncEvent(key, null, 'remove');
      return;
    }
    pendingEntries.delete(key);
    pendingDeletes.add(key);
    emitStorageSyncEvent(key, null, 'remove');
    scheduleSync();
  };

  window.localStorage.clear = () => {
    const keys = Object.keys(window.localStorage);
    keys.forEach((key) => {
      rawLocalStorage.removeItem(key);
      if (isStorageSyncBlocked(key)) {
        emitStorageSyncEvent(key, null, 'remove');
        return;
      }
      pendingEntries.delete(key);
      pendingDeletes.add(key);
      emitStorageSyncEvent(key, null, 'remove');
    });
    scheduleSync();
  };
}

export async function initializeBackendPersistence() {
  if (initialized) return;
  initialized = true;

  try {
    LEGACY_SHARED_CACHE_KEYS.forEach((key) => rawLocalStorage.removeItem(key));
    const payload = await request('/bootstrap');
    const storage = payload?.storage || {};
    Object.entries(storage).forEach(([key, value]) => {
      if (isStorageSyncBlocked(key)) return;
      rawLocalStorage.setItem(key, value);
    });
    rawLocalStorage.removeItem('careerpilot_users');
  } catch (error) {
    console.warn('CareerPilot backend unavailable, continuing with browser cache only.', error);
  }

  patchLocalStorage();
}

export const authApi = {
  async login(credentials) {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },
  async register(payload) {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  async logout(token) {
    return request('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },
  async me(token) {
    return request('/auth/me', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
  async updateProfile(payload) {
    return request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  async updatePassword(payload) {
    return request('/auth/password', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
};

export const integrationApi = {
  async createPaymentOrder(payload) {
    return request('/integrations/payment/order', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  async sendEmail(payload) {
    return request('/integrations/email/send', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  async createCalendarEvent(payload) {
    return request('/integrations/calendar/event', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  async generateReport(payload) {
    return request('/reports/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  async getStatus() {
    return request('/integrations/status');
  },
};

export const aiApi = {
  async generateOpeningQuestion(target) {
    try {
      return await request('/ai/interview/opening', {
        method: 'POST',
        body: JSON.stringify({ target }),
      });
    } catch (error) {
      if (!isCareerAiAvailable()) throw error;
      return generateInterviewOpeningQuestionWithAI(target);
    }
  },
  async generateFollowUpQuestion(target, qaHistory) {
    try {
      return await request('/ai/interview/followup', {
        method: 'POST',
        body: JSON.stringify({ target, qaHistory }),
      });
    } catch (error) {
      if (!isCareerAiAvailable()) throw error;
      return generateInterviewFollowUpQuestionWithAI(target, qaHistory);
    }
  },
  async evaluateInterview(target, qaHistory) {
    try {
      return await request('/ai/interview/evaluate', {
        method: 'POST',
        body: JSON.stringify({ target, qaHistory }),
      });
    } catch (error) {
      if (!isCareerAiAvailable()) throw error;
      return evaluateInterviewWithAI(target, qaHistory);
    }
  },
  async transcribeInterviewAudio(payload) {
    try {
      return await request('/ai/interview/transcribe', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (error) {
      if (!isCareerAiAvailable()) throw error;
      return transcribeInterviewAudioWithAI(payload);
    }
  },
};

export const stateApi = {
  async getApplications() {
    return request('/applications');
  },
  async saveApplications(applications) {
    return request('/applications', {
      method: 'PUT',
      body: JSON.stringify({ applications }),
    });
  },
  async getNotifications() {
    return request('/notifications');
  },
  subscribeToNotifications(onNotifications, onError) {
    const token = rawLocalStorage.getItem('careerpilot_session_token');
    if (!token || typeof EventSource === 'undefined') return null;
    const stream = new EventSource(`${API_BASE}/notifications/stream?token=${encodeURIComponent(token)}`);
    stream.addEventListener('notifications', (event) => {
      try {
        onNotifications(JSON.parse(event.data));
      } catch (error) {
        console.error('Notification stream parse error:', error);
      }
    });
    stream.onerror = (error) => {
      if (onError) onError(error);
    };
    return () => stream.close();
  },
  async saveNotifications(notifications) {
    return request('/notifications', {
      method: 'PUT',
      body: JSON.stringify({ notifications }),
    });
  },
  async getJobs() {
    return request('/jobs');
  },
  async saveJobs(jobs) {
    return request('/jobs', {
      method: 'PUT',
      body: JSON.stringify({ jobs }),
    });
  },
  async getCompanies() {
    return request('/companies');
  },
  async saveCompanies(companies) {
    return request('/companies', {
      method: 'PUT',
      body: JSON.stringify({ companies }),
    });
  },
  async getStudents() {
    return request('/students');
  },
  async saveStudents(students) {
    return request('/students', {
      method: 'PUT',
      body: JSON.stringify({ students }),
    });
  },
  async getAnnouncements() {
    return request('/announcements');
  },
  async saveAnnouncements(announcements) {
    return request('/announcements', {
      method: 'PUT',
      body: JSON.stringify({ announcements }),
    });
  },
  async getStudentProfile() {
    return request('/student-profile');
  },
  async saveStudentProfile(profile) {
    return request('/student-profile', {
      method: 'PUT',
      body: JSON.stringify({ profile }),
    });
  },
};
