import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from './ui/Card';
import { cn } from '../lib/utils';

export function Applications({ applications = [], setApplications }) {
  const [activeDetailsApp, setActiveDetailsApp] = useState(null);
  const [activeTimelineApp, setActiveTimelineApp] = useState(null);
  const [withdrawApp, setWithdrawApp] = useState(null);

  const getLogo = (app) => {
    return app.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(app.company)}&background=random&size=128`;
  };

  const statusColors = {
    'Reviewing': 'bg-primary-soft text-primary',
    'Interview': 'bg-primary-soft text-primary',
    'Offered': 'bg-success-soft text-success',
    'Rejected': 'bg-danger-soft text-danger',
    'Applied': 'bg-slate-100 text-slate-500',
  };

  const handleWithdraw = (id) => {
    if (setApplications) {
      setApplications(applications.filter(app => app.id !== id));
    }
    setWithdrawApp(null);
  };

  const getStepsForStatus = (status, date) => {
    return [
      { title: "Applied", desc: `Application submitted successfully.`, date: date, completed: true },
      {
        title: "Shortlisted",
        desc: status !== 'Applied' ? "Profile passed initial resume screening." : "Resume screening in progress.",
        date: status !== 'Applied' ? "Completed" : "Pending",
        completed: ['Reviewing', 'Interview', 'Offered', 'Rejected'].includes(status)
      },
      {
        title: "Interview Desk",
        desc: status === 'Interview' ? "Interviews scheduled with hiring team." : (['Offered', 'Rejected'].includes(status) ? "Technical and HR panels completed." : "To be scheduled."),
        date: status === 'Interview' ? "Active" : (['Offered', 'Rejected'].includes(status) ? "Completed" : "Pending"),
        completed: ['Interview', 'Offered', 'Rejected'].includes(status)
      },
      {
        title: status === 'Rejected' ? "Decision: Rejected" : "Offer stage",
        desc: status === 'Offered' ? "Hiring decision released: Offer Extended!" : (status === 'Rejected' ? "Thank you for interviewing, not selected." : "Pending final feedback."),
        date: status === 'Offered' ? "Received" : (status === 'Rejected' ? "Finalized" : "Pending"),
        completed: ['Offered', 'Rejected'].includes(status)
      }
    ];
  };

  return (
    <div className="pt-24 px-8 pb-12 max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl md:text-3xl font-headline font-semibold text-slate-900 tracking-tight">Active applications</h2>
          <p className="text-slate-500 mt-1 text-sm">Track your progress across {applications.length} ongoing recruitment cycles.</p>
        </div>
        <div className="flex -space-x-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
              <img src={`https://i.pravatar.cc/100?img=${i + 12}`} alt="avatar" />
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
            <motion.div
              key={app.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.06 }}
            >
              <div className="rounded-xl border border-slate-200 bg-white elev-sm overflow-hidden transition-colors hover:border-slate-300">
                <div className="flex flex-col sm:flex-row sm:items-center gap-6 p-6">
                  <div className="w-16 h-16 rounded-xl bg-slate-50 flex items-center justify-center p-3 shrink-0 border border-slate-200">
                    <img src={getLogo(app)} className="w-full h-full object-contain" alt={app.company} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-base font-semibold text-slate-900 truncate">{app.role}</h3>
                      <span className={cn(
                        "px-2.5 py-1 rounded-md text-[11px] font-semibold",
                        statusColors[app.status] ?? 'bg-slate-100 text-slate-500'
                      )}>
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
                      <div className={cn("w-2 h-2 rounded-full", app.status === 'Rejected' ? 'bg-danger' : 'bg-primary')}></div>
                      <span className="text-[11px] font-medium text-slate-500">
                        {app.status === 'Applied' ? 'Screening' : app.status === 'Reviewing' ? 'Shortlisted' : app.status === 'Interview' ? 'Technical round' : app.status === 'Offered' ? 'Offer extended' : 'Application closed'}
                      </span>
                    </div>
                    {app.status !== 'Rejected' && app.status !== 'Offered' && (
                      <div className="flex items-center gap-2 opacity-50">
                        <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                        <span className="text-[11px] font-medium text-slate-500">HR discussion</span>
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
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-2xl p-8 max-w-xl w-full border border-slate-200 elev-md relative"
            >
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
                  <span className={cn("px-2.5 py-1 rounded-md text-[11px] font-semibold", statusColors[activeDetailsApp.status])}>
                    {activeDetailsApp.status}
                  </span>
                </div>

                <div>
                  <h4 className="font-medium text-xs text-slate-400 mb-1">Position summary</h4>
                  <p className="leading-relaxed">
                    This role works closely with the core engineering group to develop and maintain high-fidelity software products. Responsibilities include shipping production-ready modules, coordinating with product leads, and running unit tests.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <h4 className="font-medium text-xs text-slate-400 mb-0.5">Location</h4>
                    <p className="font-semibold text-slate-900 text-sm">San Francisco / Remote eligible</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-xs text-slate-400 mb-0.5">Salary offer</h4>
                    <p className="font-semibold text-slate-900 text-sm">$135k - $160k base pay</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button onClick={() => setActiveDetailsApp(null)} className="px-4 py-2.5 border border-slate-300 bg-white text-slate-700 font-semibold rounded-xl text-sm hover:bg-slate-50 transition-colors">
                  Close details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeTimelineApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-2xl p-8 max-w-lg w-full border border-slate-200 elev-md relative"
            >
              <button onClick={() => setActiveTimelineApp(null)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                <span className="material-symbols-outlined">close</span>
              </button>

              <h3 className="text-xl font-headline font-semibold text-slate-900 mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">analytics</span>
                Application timeline
              </h3>

              <div className="space-y-6 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                {getStepsForStatus(activeTimelineApp.status, activeTimelineApp.appliedDate).map((step, idx) => (
                  <div key={idx} className="flex gap-4 relative">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 border-2",
                      step.completed ? "bg-primary border-primary text-on-primary" : "bg-white border-slate-200 text-slate-400"
                    )}>
                      <span className="material-symbols-outlined text-sm">
                        {step.completed ? "done" : "radio_button_unchecked"}
                      </span>
                    </div>
                    <div>
                      <h4 className={cn("text-sm font-semibold", step.completed ? "text-slate-900" : "text-slate-400")}>{step.title}</h4>
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
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full border border-slate-200 elev-md relative"
            >
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
