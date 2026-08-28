import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from './ui/Card';
import { buildCandidateFromApplication } from '../lib/recruiterData';
import { getApplicationContact, pushWorkflowNotification, sendWorkflowEmail } from '../lib/workflowActions';

const inputClass = 'w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/10';

function buildInterviewSession(app) {
  const candidate = buildCandidateFromApplication(app);
  const slot = app.selectedInterviewSlot;
  const pendingSlots = app.availableInterviewSlots || [];
  const status = ['Offered', 'Accepted', 'Declined'].includes(app.status)
    ? 'Completed'
    : app.status === 'Interview' && slot
      ? 'Confirmed'
      : 'Pending Candidate';

  return {
    ...candidate,
    date: slot?.label || (pendingSlots.length ? `${pendingSlots.length} slot shared` : 'Awaiting student selection'),
    time: slot?.time || (pendingSlots.length ? 'Waiting for candidate confirmation' : 'Slot not confirmed'),
    type: app.interviewType || 'Technical Round 1',
    status,
  };
}

function formatDateLabel(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function InterviewDesk({ applications = [], setApplications }) {
  const [showModal, setShowModal] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [type, setType] = useState('Technical Round 1');

  const interviewSessions = useMemo(
    () =>
      applications
        .filter((app) => ['Reviewing', 'Interview', 'Offered', 'Accepted', 'Declined'].includes(app.status))
        .map((app) => buildInterviewSession(app)),
    [applications]
  );

  const availableCandidates = applications.filter((app) => ['Applied', 'Reviewing', 'Interview'].includes(app.status));

  const handleAction = async (id, action) => {
    if (!setApplications) return;

    const targetApplication = applications.find((app) => app.id === id);
    if (!targetApplication) return;

    if (action === 'reschedule') {
      setSelectedApplicationId(id);
      setType(targetApplication.interviewType || 'Technical Round 1');
      setDate('');
      setTime('');
      setShowModal(true);
      return;
    }

    setApplications(applications.map((app) => {
      if (app.id !== id) return app;
      if (action === 'cancel') {
        return { ...app, status: 'Rejected', selectedInterviewSlot: null, availableInterviewSlots: [] };
      }
      if (action === 'complete') {
        return { ...app, status: 'Offered' };
      }
      return app;
    }));

    if (action === 'cancel') {
      pushWorkflowNotification(
        'Interview cancelled',
        `${targetApplication.role} at ${targetApplication.company} has been closed by the recruiter.`,
        {
          recipientId: targetApplication.studentId,
          recipientEmail: targetApplication.studentEmail,
          recipientRole: 'student',
          type: 'interview_cancelled',
          sourceId: targetApplication.id,
        }
      );
      await sendWorkflowEmail({
        to: getApplicationContact(targetApplication),
        subject: `Interview update: ${targetApplication.role}`,
        body: `Your interview process for ${targetApplication.role} at ${targetApplication.company} has been cancelled. Please check CareerPilot for the latest application status.`,
      });
    }

    if (action === 'complete') {
      pushWorkflowNotification(
        'Moved to offer stage',
        `${targetApplication.company} marked your ${targetApplication.role} interview as completed.`,
        {
          recipientId: targetApplication.studentId,
          recipientEmail: targetApplication.studentEmail,
          recipientRole: 'student',
          type: 'offer_stage',
          sourceId: targetApplication.id,
        }
      );
      await sendWorkflowEmail({
        to: getApplicationContact(targetApplication),
        subject: `Interview completed: ${targetApplication.role}`,
        body: `Your interview for ${targetApplication.role} at ${targetApplication.company} has been completed and the application has moved to the offer stage.`,
      });
    }
  };

  const handleBookSlot = async (event) => {
    event.preventDefault();
    if (!selectedApplicationId || !date || !time || !setApplications) return;

    const slot = {
      id: `${Date.now()}`,
      label: formatDateLabel(date),
      time,
    };

    setApplications(applications.map((app) => (
      app.id === selectedApplicationId
        ? {
            ...app,
            status: 'Reviewing',
            selectedInterviewSlot: null,
            availableInterviewSlots: [slot],
            interviewType: type,
          }
        : app
    )));

    const selectedApplication = applications.find((app) => app.id === selectedApplicationId);
    if (selectedApplication) {
      pushWorkflowNotification(
        'Interview slot shared',
        `${selectedApplication.company} shared a ${type} slot for ${selectedApplication.role} on ${slot.label} at ${slot.time}.`,
        {
          recipientId: selectedApplication.studentId,
          recipientEmail: selectedApplication.studentEmail,
          recipientRole: 'student',
          type: 'interview_slot',
          sourceId: selectedApplication.id,
        }
      );
      await sendWorkflowEmail({
        to: getApplicationContact(selectedApplication),
        subject: `Choose your interview slot for ${selectedApplication.role}`,
        body: `A recruiter from ${selectedApplication.company} shared a ${type} slot for ${selectedApplication.role} on ${slot.label} at ${slot.time}. Open CareerPilot and confirm the interview slot from your applications view.`,
      });
    }

    setSelectedApplicationId('');
    setDate('');
    setTime('');
    setType('Technical Round 1');
    setShowModal(false);
  };

  const confirmedCount = interviewSessions.filter((session) => session.status === 'Confirmed').length;
  const pendingCount = interviewSessions.filter((session) => session.status === 'Pending Candidate').length;
  const completedCount = interviewSessions.filter((session) => session.status === 'Completed').length;

  const stats = [
    { value: confirmedCount, label: 'Confirmed slots', icon: 'event_upcoming' },
    { value: pendingCount, label: 'Awaiting response', icon: 'pending_actions' },
    { value: completedCount, label: 'Completed loops', icon: 'check_circle' },
  ];

  const statusTone = (status) =>
    status === 'Confirmed' ? 'bg-success-soft text-success'
      : status === 'Pending Candidate' ? 'bg-warning-soft text-warning'
      : status === 'Completed' ? 'bg-primary-soft text-primary'
      : 'bg-danger-soft text-danger';

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-8 pb-12 pt-24">
      <header className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-headline font-semibold tracking-tight text-slate-900 md:text-3xl">Interview desk</h2>
          <p className="mt-1 text-sm text-slate-500">Manage shortlisted candidates, booked slots, and completed loops from shared application data.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-hover focus:outline-none focus:ring-4 focus:ring-primary/10"
        >
          <span className="material-symbols-outlined text-base">add_circle</span>
          Share interview slot
        </button>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
              <span className="material-symbols-outlined text-xl">{stat.icon}</span>
            </div>
            <div>
              <h4 className="text-2xl font-headline font-bold text-slate-900">{stat.value}</h4>
              <p className="text-xs font-medium text-slate-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">Upcoming sessions</h3>
        <div className="grid gap-4">
          {interviewSessions.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-400">No interviews scheduled yet. Click "Share interview slot" to begin.</p>
          ) : (
            interviewSessions.map((session) => (
              <Card key={session.id} className="p-5">
                <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                  <div className="flex items-center gap-4">
                    <img src={session.avatar} className="h-12 w-12 shrink-0 rounded-lg object-cover" alt={session.name} />
                    <div>
                      <h4 className="text-base font-semibold text-slate-900">{session.name}</h4>
                      <p className="text-xs text-slate-500">{session.university} · {session.role}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs font-medium text-slate-600">
                    <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
                      <span className="material-symbols-outlined text-base text-slate-400">calendar_today</span>
                      <span>{session.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
                      <span className="material-symbols-outlined text-base text-slate-400">schedule</span>
                      <span>{session.time}</span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
                      <span className="material-symbols-outlined text-base text-slate-400">forum</span>
                      <span>{session.type}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 self-stretch border-t border-slate-100 pt-3 md:self-auto md:border-none md:pt-0">
                    <span className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${statusTone(session.status)}`}>
                      {session.status}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleAction(session.id, 'reschedule')}
                        className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                        title="Reschedule"
                      >
                        <span className="material-symbols-outlined text-lg">calendar_month</span>
                      </button>
                      {session.status !== 'Completed' && (
                        <button
                          onClick={() => handleAction(session.id, 'complete')}
                          className="rounded-lg p-2 text-primary transition-colors hover:bg-primary-soft"
                          title="Mark completed"
                        >
                          <span className="material-symbols-outlined text-lg">check_circle</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleAction(session.id, 'cancel')}
                        className="rounded-lg p-2 text-danger transition-colors hover:bg-danger-soft"
                        title="Cancel Loop"
                      >
                        <span className="material-symbols-outlined text-lg">cancel</span>
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-md space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-lg font-headline font-semibold text-slate-900">Share interview slot</h3>
                <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              <form onSubmit={handleBookSlot} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Candidate application</label>
                  <select value={selectedApplicationId} onChange={(e) => setSelectedApplicationId(e.target.value)} required className={inputClass}>
                    <option value="">Select a candidate</option>
                    {availableCandidates.map((app) => {
                      const candidate = buildCandidateFromApplication(app);
                      return (
                        <option key={app.id} value={app.id}>
                          {candidate.name} · {app.role} · {app.company}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Round type</label>
                  <select value={type} onChange={(e) => setType(e.target.value)} className={inputClass}>
                    <option>Technical Round 1</option>
                    <option>System Design</option>
                    <option>HR Discussion</option>
                    <option>Hiring Manager</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">Date</label>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className={inputClass} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">Time slot</label>
                    <input type="text" value={time} onChange={(e) => setTime(e.target.value)} required placeholder="e.g. 10:00 AM - 10:45 AM" className={inputClass} />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
                    Cancel
                  </button>
                  <button type="submit" className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-hover">
                    Share slot
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
