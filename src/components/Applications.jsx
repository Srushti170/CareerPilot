import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from './MetricCard';
import { cn } from '../lib/utils';

export function Applications({ applications = [], setApplications }) {
  const [activeDetailsApp, setActiveDetailsApp] = useState(null);
  const [activeTimelineApp, setActiveTimelineApp] = useState(null);
  const [withdrawApp, setWithdrawApp] = useState(null);

  // Fix broken logos with generic ones if needed
  const getLogo = (app) => {
    return app.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(app.company)}&background=random&size=128`;
  };

  const statusColors = {
    'Reviewing': 'bg-blue-50 text-blue-600 border-blue-100',
    'Interview': 'bg-purple-50 text-purple-600 border-purple-100',
    'Offered': 'bg-green-50 text-green-600 border-green-100',
    'Rejected': 'bg-red-50 text-red-600 border-red-100',
    'Applied': 'bg-slate-50 text-slate-600 border-slate-100',
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
          <h2 className="text-3xl font-black text-on-surface tracking-tight">Active Applications</h2>
          <p className="text-slate-500 mt-2">Track your progress across {applications.length} ongoing recruitment cycles.</p>
        </div>
        <div className="flex gap-4">
          <div className="flex -space-x-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                <img src={`https://i.pravatar.cc/100?img=${i + 12}`} alt="avatar" />
              </div>
            ))}
            <div className="w-8 h-8 rounded-full border-2 border-white bg-primary text-white text-[10px] font-bold flex items-center justify-center">+4</div>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {applications.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-outline-variant/10 text-center text-slate-400 font-medium">
            You haven't applied to any opportunities yet.
          </div>
        ) : (
          applications.map((app, index) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-all group overflow-hidden border border-outline-variant/5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-6 p-4">
                  <div className="w-16 h-16 rounded-2xl bg-surface-container-low flex items-center justify-center p-3 shrink-0 border border-slate-100">
                    <img src={getLogo(app)} className="w-full h-full object-contain" alt={app.company} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-lg font-bold text-on-surface truncate tracking-tight">{app.role}</h3>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider",
                        statusColors[app.status] ?? 'bg-slate-50 text-slate-600 border-slate-100'
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
                    <button 
                      onClick={() => setWithdrawApp(app)}
                      className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
                    >
                      Withdraw
                    </button>
                    <button 
                      onClick={() => setActiveDetailsApp(app)}
                      className="px-6 py-2 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/10 hover:shadow-primary/25 transition-all"
                    >
                      View Details
                    </button>
                  </div>
                </div>

                {/* Timeline Preview */}
                <div className="bg-surface-container-low/30 px-6 py-3 flex items-center justify-between border-t border-outline-variant/5">
                  <div className="flex items-center gap-8">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", app.status === 'Rejected' ? 'bg-red-500' : 'bg-primary')}></div>
                      <span className="text-[10px] font-bold text-on-surface uppercase opacity-60">
                        {app.status === 'Applied' ? 'Screening' : app.status === 'Reviewing' ? 'Shortlisted' : app.status === 'Interview' ? 'Technical Round' : app.status === 'Offered' ? 'Offer Extended' : 'Application Closed'}
                      </span>
                    </div>
                    {app.status !== 'Rejected' && app.status !== 'Offered' && (
                      <div className="flex items-center gap-2 opacity-35">
                        <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                        <span className="text-[10px] font-bold text-on-surface uppercase tracking-tight">HR Discussion</span>
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => setActiveTimelineApp(app)}
                    className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline cursor-pointer bg-transparent border-0"
                  >
                    View Full Timeline →
                  </button>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Modal: View Details */}
      <AnimatePresence>
        {activeDetailsApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-xl w-full border border-slate-100 shadow-2xl relative"
            >
              <button 
                onClick={() => setActiveDetailsApp(null)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <span className="material-symbols-outlined">close</span>
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center p-3 border border-slate-100">
                  <img src={getLogo(activeDetailsApp)} className="w-full h-full object-contain" alt={activeDetailsApp.company} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{activeDetailsApp.role}</h3>
                  <p className="text-sm font-semibold text-slate-500">{activeDetailsApp.company}</p>
                </div>
              </div>

              <div className="space-y-4 text-slate-600 text-sm">
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-1">Status</h4>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest",
                    statusColors[activeDetailsApp.status]
                  )}>
                    {activeDetailsApp.status}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-1">Position Summary</h4>
                  <p className="leading-relaxed font-medium">
                    This role works closely with the core engineering group to develop and maintain high-fidelity software products. Responsibilities include shipping production-ready modules, coordinating with product leads, and running unit tests.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-0.5">Location</h4>
                    <p className="font-bold text-slate-800 text-sm">San Francisco / Remote Eligible</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-0.5">Salary Offer</h4>
                    <p className="font-bold text-slate-800 text-sm">$135k - $160k Base Pay</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button 
                  onClick={() => setActiveDetailsApp(null)}
                  className="px-6 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-slate-200 transition-colors"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: View Full Timeline */}
      <AnimatePresence>
        {activeTimelineApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full border border-slate-100 shadow-2xl relative"
            >
              <button 
                onClick={() => setActiveTimelineApp(null)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <span className="material-symbols-outlined">close</span>
              </button>

              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">analytics</span>
                Application Timeline
              </h3>

              <div className="space-y-6 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                {getStepsForStatus(activeTimelineApp.status, activeTimelineApp.appliedDate).map((step, idx) => (
                  <div key={idx} className="flex gap-4 relative">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 border-2",
                      step.completed 
                        ? "bg-primary border-primary text-white" 
                        : "bg-white border-slate-200 text-slate-400"
                    )}>
                      <span className="material-symbols-outlined text-sm">
                        {step.completed ? "done" : "radio_button_unchecked"}
                      </span>
                    </div>
                    <div>
                      <h4 className={cn("text-sm font-bold", step.completed ? "text-slate-800" : "text-slate-400")}>{step.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block font-bold uppercase tracking-wider">{step.date}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex justify-end">
                <button 
                  onClick={() => setActiveTimelineApp(null)}
                  className="px-6 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-slate-200 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Withdraw Confirmation */}
      <AnimatePresence>
        {withdrawApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full border border-slate-100 shadow-2xl relative"
            >
              <button 
                onClick={() => setWithdrawApp(null)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <span className="material-symbols-outlined">close</span>
              </button>

              <div className="flex items-center gap-3 text-red-600 mb-4">
                <span className="material-symbols-outlined text-3xl">warning</span>
                <h3 className="text-lg font-bold">Withdraw Application?</h3>
              </div>

              <p className="text-sm text-slate-500 leading-relaxed font-medium mb-6">
                Are you sure you want to withdraw your application for <b>{withdrawApp.role}</b> at <b>{withdrawApp.company}</b>? This action is permanent and cannot be undone.
              </p>

              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setWithdrawApp(null)}
                  className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleWithdraw(withdrawApp.id)}
                  className="px-5 py-2.5 bg-red-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-red-700 transition-colors shadow-lg shadow-red-600/10"
                >
                  Yes, Withdraw
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

