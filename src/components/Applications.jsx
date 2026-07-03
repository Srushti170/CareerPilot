import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from './ui/Card';
import { cn } from '../lib/utils';
import { createInterviewEvent, pushWorkflowNotification, sendWorkflowEmail } from '../lib/workflowActions';

function getLogo(app) {
  return app.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(app.company)}&background=random&size=128`;
}

function getStatusColors(status) {
  return {
    Reviewing: 'bg-primary-soft text-primary',
    Interview: 'bg-primary-soft text-primary',
    Offered: 'bg-success-soft text-success',
    Accepted: 'bg-success-soft text-success',
    Declined: 'bg-warning-soft text-warning',
    Rejected: 'bg-danger-soft text-danger',
    Applied: 'bg-slate-100 text-slate-500',
  }[status] || 'bg-slate-100 text-slate-500';
}

function getStepsForStatus(app) {
  const finalPositive = ['Offered', 'Accepted'].includes(app.status);
  const finalClosed = ['Rejected', 'Declined'].includes(app.status);

  return [
    { title: 'Applied', desc: 'Application submitted successfully.', date: app.appliedDate, completed: true },
    {
      title: 'Shortlisted',
      desc: app.status === 'Applied' ? 'Resume screening in progress.' : 'Profile passed initial resume screening.',
      date: app.status === 'Applied' ? 'Pending' : 'Completed',
      completed: ['Reviewing', 'Interview', 'Offered', 'Accepted', 'Rejected', 'Declined'].includes(app.status),
    },
    {
      title: 'Interview Desk',
      desc: app.selectedInterviewSlot
        ? `Interview confirmed for ${app.selectedInterviewSlot.label}, ${app.selectedInterviewSlot.time}.`
        : (['Interview', 'Offered', 'Accepted', 'Rejected', 'Declined'].includes(app.status) ? 'Interview loop completed.' : 'Awaiting slot selection.'),
      date: app.selectedInterviewSlot ? `${app.selectedInterviewSlot.label}` : (['Interview', 'Offered', 'Accepted', 'Rejected', 'Declined'].includes(app.status) ? 'Completed' : 'Pending'),
      completed: ['Interview', 'Offered', 'Accepted', 'Rejected', 'Declined'].includes(app.status),
    },
    {
      title: app.status === 'Rejected' ? 'Decision: Rejected' : app.status === 'Declined' ? 'Offer Declined' : app.status === 'Accepted' ? 'Offer Accepted' : 'Offer stage',
      desc: app.status === 'Accepted'
        ? 'You accepted the offer and closed the process successfully.'
        : app.status === 'Declined'
          ? 'You declined the offer and closed the loop.'
          : app.status === 'Offered'
            ? 'Offer extended. Review and respond.'
            : app.status === 'Rejected'
              ? 'Thank you for interviewing, not selected.'
              : 'Pending final feedback.',
      date: finalPositive || finalClosed ? 'Completed' : 'Pending',
      completed: finalPositive || finalClosed,
    },
  ];
}

export function Applications({ applications = [], setApplications }) {
  const [activeDetailsApp, setActiveDetailsApp] = useState(null);
  const [activeTimelineApp, setActiveTimelineApp] = useState(null);
  const [withdrawApp, setWithdrawApp] = useState(null);
  const [scheduleApp, setScheduleApp] = useState(null);

  const activeCount = useMemo(
    () => applications.filter((app) => !['Rejected', 'Declined', 'Accepted'].includes(app.status)).length,
    [applications]
  );

  const updateApplication = (id, updater) => {
    if (!setApplications) return;
    setApplications(applications.map((app) => (app.id === id ? updater(app) : app)));
  };

  const handleWithdraw = (id) => {
    if (setApplications) {
      setApplications(applications.filter((app) => app.id !== id));
    }
    if (withdrawApp) {
      pushWorkflowNotification(
        'Application withdrawn',
        `You withdrew your ${withdrawApp.role} application at ${withdrawApp.company}.`
      );
    }
    setWithdrawApp(null);
  };

  const promoteToShortlisted = async (app) => {
    updateApplication(app.id, (current) => ({ ...current, status: 'Reviewing' }));
    setActiveDetailsApp((current) => current ? { ...current, status: 'Reviewing' } : current);
    pushWorkflowNotification('Application shortlisted', `${app.company} shortlisted you for ${app.role}.`);
    await sendWorkflowEmail({
      to: app.studentName || 'Candidate',
      subject: `Shortlisted for ${app.role}`,
      body: `Good news. ${app.company} shortlisted your application for ${app.role}. Open CareerPilot to review the latest status and interview options.`,
    });
  };

  const confirmInterviewSlot = async (app, slot) => {
    updateApplication(app.id, (current) => ({
      ...current,
      status: 'Interview',
      selectedInterviewSlot: slot,
      availableInterviewSlots: [slot],
    }));
    setActiveDetailsApp((current) => current ? { ...current, status: 'Interview', selectedInterviewSlot: slot, availableInterviewSlots: [slot] } : current);
    setScheduleApp(null);
    pushWorkflowNotification(
      'Interview confirmed',
      `You confirmed ${app.role} at ${app.company} for ${slot.label} at ${slot.time}.`
    );
    await Promise.all([
      createInterviewEvent(app, slot, app.interviewType || 'Technical Round 1'),
      sendWorkflowEmail({
        to: app.company,
        subject: `Candidate confirmed interview: ${app.role}`,
        body: `${app.studentName || 'The candidate'} confirmed the ${app.role} interview slot for ${slot.label} at ${slot.time}.`,
      }),
    ]);
  };

  const moveToOffer = async (app) => {
    updateApplication(app.id, (current) => ({ ...current, status: 'Offered' }));
    setActiveDetailsApp((current) => current ? { ...current, status: 'Offered' } : current);
    pushWorkflowNotification('Offer received', `${app.company} moved your ${app.role} application to the offer stage.`);
    await sendWorkflowEmail({
      to: app.studentName || 'Candidate',
      subject: `Offer stage: ${app.role}`,
      body: `${app.company} has moved your ${app.role} application to the offer stage. Review the latest update in CareerPilot.`,
    });
  };

  const resolveOffer = async (app, decision) => {
    const nextStatus = decision === 'accept' ? 'Accepted' : 'Declined';
    const decisionLabel = decision === 'accept' ? 'accepted' : 'declined';
    updateApplication(app.id, (current) => ({ ...current, status: nextStatus, offerDecision: decision }));
    setActiveDetailsApp((current) => current ? { ...current, status: nextStatus, offerDecision: decision } : current);
    pushWorkflowNotification(
      decision === 'accept' ? 'Offer accepted' : 'Offer declined',
      `You ${decisionLabel} the ${app.role} offer from ${app.company}.`
    );
    await sendWorkflowEmail({
      to: app.company,
      subject: `Offer ${decisionLabel}: ${app.role}`,
      body: `${app.studentName || 'The candidate'} ${decisionLabel} the ${app.role} offer from ${app.company}.`,
    });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-8 pb-12 pt-24">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl md:text-3xl font-headline font-semibold text-slate-900 tracking-tight">Active applications</h2>
          <p className="text-slate-500 mt-1 text-sm">Track your progress across {activeCount} ongoing recruitment cycles.</p>
        </div>
        <div className="flex -space-x-2">
          {[1, 2, 3, 4].map((index) => (
            <div key={index} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
              <img src={`https://i.pravatar.cc/100?img=${index + 12}`} alt="avatar" />
            </div>
          ))}
          <div className="w-8 h-8 rounded-full border-2 border-white bg-primary text-on-primary text-[10px] font-semibold flex items-center justify-center">+4</div>
        </div>
      </div>

      <div className="grid gap-4">
        {applications.length === 0 ? (
          <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-400 text-sm">
            You haven't applied to any opportunities yet.
          </div>
        ) : (
          applications.map((app, index) => (
            <motion.div key={app.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.06 }}>
              <div className="rounded-xl border border-slate-200 bg-white elev-sm overflow-hidden transition-colors hover:border-slate-300">
                <div className="flex flex-col sm:flex-row sm:items-center gap-6 p-6">
                  <div className="w-16 h-16 rounded-xl bg-slate-50 flex items-center justify-center p-3 shrink-0 border border-slate-200">
                    <img src={getLogo(app)} className="w-full h-full object-contain" alt={app.company} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-base font-semibold text-slate-900 truncate">{app.role}</h3>
                      <span className={cn('px-2.5 py-1 rounded-md text-[11px] font-semibold', getStatusColors(app.status))}>
                        {app.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">domain</span>
                        {app.company}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">event</span>
                        Applied on {app.appliedDate}
                      </span>
                      {app.selectedInterviewSlot && (
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">schedule</span>
                          {app.selectedInterviewSlot.label} {app.selectedInterviewSlot.time}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button onClick={() => setWithdrawApp(app)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                      Withdraw
                    </button>
                    <button onClick={() => setActiveDetailsApp(app)} className="px-4 py-2 bg-primary text-on-primary text-sm font-semibold rounded-lg hover:bg-primary-hover transition-colors">
                      View details
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 px-6 py-3 flex items-center justify-between border-t border-slate-100">
                  <div className="flex items-center gap-8">
                    <div className="flex items-center gap-2">
                      <div className={cn('w-2 h-2 rounded-full', ['Rejected', 'Declined'].includes(app.status) ? 'bg-danger' : 'bg-primary')}></div>
                      <span className="text-[11px] font-medium text-slate-500">
                        {app.status === 'Applied' ? 'Screening' : app.status === 'Reviewing' ? 'Shortlisted' : app.status === 'Interview' ? 'Interview scheduled' : app.status === 'Offered' ? 'Offer extended' : app.status === 'Accepted' ? 'Offer accepted' : app.status === 'Declined' ? 'Offer declined' : 'Application closed'}
                      </span>
                    </div>
                    {!['Rejected', 'Declined', 'Accepted'].includes(app.status) && (
                      <div className="flex items-center gap-2 opacity-50">
                        <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                        <span className="text-[11px] font-medium text-slate-500">Progressing through hiring loop</span>
                      </div>
                    )}
                  </div>
                  <button onClick={() => setActiveTimelineApp(app)} className="text-[11px] font-semibold text-primary hover:text-primary-hover cursor-pointer bg-transparent border-0 transition-colors">
                    View full timeline →
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {activeDetailsApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="bg-white rounded-2xl p-8 max-w-2xl w-full border border-slate-200 elev-md relative">
              <button onClick={() => setActiveDetailsApp(null)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                <span className="material-symbols-outlined">close</span>
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-xl bg-slate-50 flex items-center justify-center p-3 border border-slate-200">
                  <img src={getLogo(activeDetailsApp)} className="w-full h-full object-contain" alt={activeDetailsApp.company} />
                </div>
                <div>
                  <h3 className="text-xl font-headline font-semibold text-slate-900">{activeDetailsApp.role}</h3>
                  <p className="text-sm font-medium text-slate-500">{activeDetailsApp.company}</p>
                </div>
              </div>

              <div className="space-y-4 text-slate-600 text-sm">
                <div>
                  <h4 className="font-medium text-xs text-slate-400 mb-1.5">Status</h4>
                  <span className={cn('px-2.5 py-1 rounded-md text-[11px] font-semibold', getStatusColors(activeDetailsApp.status))}>
                    {activeDetailsApp.status}
                  </span>
                </div>

                <div>
                  <h4 className="font-medium text-xs text-slate-400 mb-1">Application note</h4>
                  <p className="leading-relaxed">{activeDetailsApp.coverLetter || 'Application package prepared and submitted through the CareerPilot one-click apply flow.'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <h4 className="font-medium text-xs text-slate-400 mb-0.5">Location</h4>
                    <p className="font-semibold text-slate-900 text-sm">{activeDetailsApp.location || 'Not specified'}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-xs text-slate-400 mb-0.5">Salary</h4>
                    <p className="font-semibold text-slate-900 text-sm">{activeDetailsApp.salary || 'Compensation not shared yet'}</p>
                  </div>
                </div>

                {activeDetailsApp.selectedInterviewSlot && (
                  <div className="rounded-xl bg-primary-soft p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.06em] text-primary">Interview confirmed</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{activeDetailsApp.selectedInterviewSlot.label}</p>
                    <p className="text-sm text-slate-600">{activeDetailsApp.selectedInterviewSlot.time}</p>
                  </div>
                )}

                {activeDetailsApp.resumeSnapshot && (
                  <div>
                    <h4 className="font-medium text-xs text-slate-400 mb-1">Resume package used</h4>
                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-900">{activeDetailsApp.resumeSnapshot.targetRole}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{activeDetailsApp.resumeSnapshot.summary}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 flex flex-wrap justify-end gap-3">
                {activeDetailsApp.status === 'Applied' && (
                  <button onClick={() => promoteToShortlisted(activeDetailsApp)} className="px-4 py-2.5 bg-primary text-on-primary font-semibold rounded-xl text-sm hover:bg-primary-hover transition-colors">
                    Simulate shortlist
                  </button>
                )}
                {activeDetailsApp.status === 'Reviewing' && (
                  <button onClick={() => setScheduleApp(activeDetailsApp)} className="px-4 py-2.5 bg-primary text-on-primary font-semibold rounded-xl text-sm hover:bg-primary-hover transition-colors">
                    Choose interview slot
                  </button>
                )}
                {activeDetailsApp.status === 'Interview' && (
                  <button onClick={() => moveToOffer(activeDetailsApp)} className="px-4 py-2.5 bg-primary text-on-primary font-semibold rounded-xl text-sm hover:bg-primary-hover transition-colors">
                    Simulate interview result
                  </button>
                )}
                {activeDetailsApp.status === 'Offered' && (
                  <>
                    <button onClick={() => resolveOffer(activeDetailsApp, 'decline')} className="px-4 py-2.5 border border-slate-300 bg-white text-slate-700 font-semibold rounded-xl text-sm hover:bg-slate-50 transition-colors">
                      Decline offer
                    </button>
                    <button onClick={() => resolveOffer(activeDetailsApp, 'accept')} className="px-4 py-2.5 bg-primary text-on-primary font-semibold rounded-xl text-sm hover:bg-primary-hover transition-colors">
                      Accept offer
                    </button>
                  </>
                )}
                <button onClick={() => setActiveDetailsApp(null)} className="px-4 py-2.5 border border-slate-300 bg-white text-slate-700 font-semibold rounded-xl text-sm hover:bg-slate-50 transition-colors">
                  Close details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {scheduleApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="bg-white rounded-2xl p-8 max-w-lg w-full border border-slate-200 elev-md">
              <h3 className="text-xl font-headline font-semibold text-slate-900">Choose your interview slot</h3>
              <p className="mt-2 text-sm text-slate-500">Select one of the recruiter-provided slots for {scheduleApp.role} at {scheduleApp.company}.</p>
              <div className="mt-6 space-y-3">
                {(scheduleApp.availableInterviewSlots || []).map((slot) => (
                  <button key={slot.id} onClick={() => confirmInterviewSlot(scheduleApp, slot)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-4 text-left hover:border-primary hover:bg-primary-soft/30 transition-colors">
                    <p className="font-semibold text-slate-900">{slot.label}</p>
                    <p className="text-sm text-slate-500">{slot.time}</p>
                  </button>
                ))}
              </div>
              <div className="mt-6 flex justify-end">
                <button onClick={() => setScheduleApp(null)} className="px-4 py-2.5 border border-slate-300 bg-white text-slate-700 font-semibold rounded-xl text-sm hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeTimelineApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="bg-white rounded-2xl p-8 max-w-lg w-full border border-slate-200 elev-md relative">
              <button onClick={() => setActiveTimelineApp(null)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                <span className="material-symbols-outlined">close</span>
              </button>

              <h3 className="text-xl font-headline font-semibold text-slate-900 mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">analytics</span>
                Application timeline
              </h3>

              <div className="space-y-6 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                {getStepsForStatus(activeTimelineApp).map((step, idx) => (
                  <div key={idx} className="flex gap-4 relative">
                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 border-2', step.completed ? 'bg-primary border-primary text-on-primary' : 'bg-white border-slate-200 text-slate-400')}>
                      <span className="material-symbols-outlined text-sm">
                        {step.completed ? 'done' : 'radio_button_unchecked'}
                      </span>
                    </div>
                    <div>
                      <h4 className={cn('text-sm font-semibold', step.completed ? 'text-slate-900' : 'text-slate-400')}>{step.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
                      <span className="text-[11px] text-slate-400 mt-1 block font-medium">{step.date}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex justify-end">
                <button onClick={() => setActiveTimelineApp(null)} className="px-4 py-2.5 border border-slate-300 bg-white text-slate-700 font-semibold rounded-xl text-sm hover:bg-slate-50 transition-colors">
                  Dismiss
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {withdrawApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="bg-white rounded-2xl p-8 max-w-md w-full border border-slate-200 elev-md relative">
              <button onClick={() => setWithdrawApp(null)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                <span className="material-symbols-outlined">close</span>
              </button>

              <div className="flex items-center gap-3 text-danger mb-4">
                <span className="material-symbols-outlined text-3xl">warning</span>
                <h3 className="text-lg font-headline font-semibold">Withdraw application?</h3>
              </div>

              <p className="text-sm text-slate-500 leading-relaxed mb-6">
                Are you sure you want to withdraw your application for <b className="text-slate-700">{withdrawApp.role}</b> at <b className="text-slate-700">{withdrawApp.company}</b>? This action is permanent and cannot be undone.
              </p>

              <div className="flex justify-end gap-3">
                <button onClick={() => setWithdrawApp(null)} className="px-4 py-2.5 border border-slate-300 bg-white text-slate-700 font-semibold rounded-xl text-sm hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button onClick={() => handleWithdraw(withdrawApp.id)} className="px-4 py-2.5 bg-danger text-white font-semibold rounded-xl text-sm hover:opacity-90 transition-opacity">
                  Yes, withdraw
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
