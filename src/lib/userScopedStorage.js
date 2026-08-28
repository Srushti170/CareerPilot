function safeJsonParse(value, fallback = null) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function getCurrentUserScope() {
  const user = safeJsonParse(localStorage.getItem('careerpilot_current_user'), null);
  return user?.id || user?.email || 'anonymous';
}

export function getScopedKey(key, scope = getCurrentUserScope()) {
  return `${key}:${scope}`;
}

export function getScopedJson(key, fallback, scope = getCurrentUserScope()) {
  return safeJsonParse(localStorage.getItem(getScopedKey(key, scope)), fallback);
}

export function setScopedJson(key, value, scope = getCurrentUserScope()) {
  localStorage.setItem(getScopedKey(key, scope), JSON.stringify(value));
  return value;
}
