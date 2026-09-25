import { integrationApi, stateApi } from './backendSync';
import { getScopedJson, setScopedJson } from './userScopedStorage';

function getCurrentUser() {
  try {
    const stored = localStorage.getItem('careerpilot_current_user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function readNotifications() {
  return getScopedJson('careerpilot_notifications', []);
}

function isVisibleToCurrentUser(notification, currentUser) {
  if (!currentUser) return true;
  if (notification.recipientId === currentUser.id) return true;
  if (notification.recipientEmail) return notification.recipientEmail.toLowerCase() === String(currentUser.email || '').toLowerCase();
  if (!notification.recipientId && !notification.recipientEmail && notification.recipientRole) {
    return notification.recipientRole === currentUser.role;
  }
  return false;
}

export function pushWorkflowNotification(title, desc, recipient = {}) {
  const currentUser = getCurrentUser();
  const notification = {
    id: `notif-${Date.now()}`,
    title,
    desc,
    time: 'Just now',
    read: false,
    type: recipient.type || 'workflow',
    sourceId: recipient.sourceId || '',
    recipientId: recipient.recipientId || recipient.userId || currentUser?.id || '',
    recipientEmail: recipient.recipientEmail || recipient.email || currentUser?.email || '',
    recipientRole: recipient.recipientRole || recipient.role || currentUser?.role || 'student',
    createdAt: new Date().toISOString(),
  };
  const current = readNotifications();
  const next = isVisibleToCurrentUser(notification, currentUser)
    ? [notification, ...current].slice(0, 25)
    : current;

  setScopedJson('careerpilot_notifications', next);
  window.dispatchEvent(new CustomEvent('careerpilot:notifications-updated', { detail: { notifications: next } }));
  stateApi.saveNotifications([notification, ...current]).catch((error) => {
    console.error('Notifications sync error:', error);
  });
}

export function getApplicationContact(application = {}) {
  return application.studentEmail || application.studentName || application.company || 'Candidate';
}

export async function sendWorkflowEmail(payload) {
  try {
    await integrationApi.sendEmail(payload);
  } catch (error) {
    console.error('Workflow email error:', error);
  }
}

export async function createInterviewEvent(application, slot, type) {
  try {
    await integrationApi.createCalendarEvent({
      title: `${application.role} interview with ${application.company}`,
      date: slot.label,
      time: slot.time,
      attendees: [getApplicationContact(application), application.company],
      type,
    });
  } catch (error) {
    console.error('Calendar sync error:', error);
  }
}
