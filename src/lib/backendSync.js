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

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
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
    const entries = Object.fromEntries(pendingEntries);
    const deletes = Array.from(pendingDeletes);
    pendingEntries.clear();
    pendingDeletes.clear();
    syncTimer = null;

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
    pendingDeletes.delete(key);
    pendingEntries.set(key, String(value));
    scheduleSync();
  };

  window.localStorage.removeItem = (key) => {
    rawLocalStorage.removeItem(key);
    pendingEntries.delete(key);
    pendingDeletes.add(key);
    scheduleSync();
  };

  window.localStorage.clear = () => {
    const keys = Object.keys(window.localStorage);
    keys.forEach((key) => {
      rawLocalStorage.removeItem(key);
      pendingEntries.delete(key);
      pendingDeletes.add(key);
    });
    scheduleSync();
  };
}

export async function initializeBackendPersistence() {
  if (initialized) return;
  initialized = true;

  try {
    const payload = await request('/bootstrap');
    const storage = payload?.storage || {};
    Object.entries(storage).forEach(([key, value]) => {
      rawLocalStorage.setItem(key, value);
    });
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
