import { integrationApi, stateApi } from './backendSync';

function readNotifications() {
  try {
    const stored = localStorage.getItem('careerpilot_notifications');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function pushWorkflowNotification(title, desc) {
  const current = readNotifications();
  const next = [
    {
      id: `notif-${Date.now()}`,
      title,
      desc,
      time: 'Just now',
      read: false,
    },
    ...current,
  ].slice(0, 25);

  localStorage.setItem('careerpilot_notifications', JSON.stringify(next));
  stateApi.saveNotifications(next).catch((error) => {
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
