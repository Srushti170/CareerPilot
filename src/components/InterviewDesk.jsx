import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from './ui/Card';

const DEFAULT_INTERVIEWS = [
  {
    id: '1',
    candidateName: 'Ethan Wright',
    university: 'Stanford University',
    role: 'SDE Intern',
    date: 'Tomorrow',
    time: '10:00 AM - 11:00 AM',
    type: 'Technical Round 1',
    status: 'Confirmed',
    avatar: 'https://i.pravatar.cc/100?img=12'
  },
  {
    id: '2',
    candidateName: 'Sarah Chen',
    university: 'MIT',
    role: 'Frontend Engineer',
    date: 'June 12, 2026',
    time: '2:30 PM - 3:30 PM',
    type: 'System Design',
    status: 'Pending Candidate',
    avatar: 'https://i.pravatar.cc/100?img=25'
  },
  {
    id: '3',
    candidateName: 'Marcus Lee',
    university: 'Georgia Tech',
    role: 'Backend Developer',
    date: 'June 15, 2026',
    time: '4:00 PM - 4:45 PM',
    type: 'HR Discussion',
    status: 'Confirmed',
    avatar: 'https://i.pravatar.cc/100?img=33'
  }
];

const inputClass = "w-full px-4 py-2.5 rounded-lg bg-white border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-colors text-sm";

export function InterviewDesk() {
  const [interviews, setInterviews] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [candidateName, setCandidateName] = useState('');
  const [university, setUniversity] = useState('');
  const [role, setRole] = useState('SDE Intern');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [type, setType] = useState('Technical Round 1');

  useEffect(() => {
    const stored = localStorage.getItem('careerpilot_interviews');
    if (stored) {
      setInterviews(JSON.parse(stored));
    } else {
      localStorage.setItem('careerpilot_interviews', JSON.stringify(DEFAULT_INTERVIEWS));
      setInterviews(DEFAULT_INTERVIEWS);
    }
  }, []);

  const handleAction = (id, newStatus) => {
    const updated = interviews.map(i => i.id === id ? { ...i, status: newStatus } : i);
    localStorage.setItem('careerpilot_interviews', JSON.stringify(updated));
    setInterviews(updated);
  };

  const handleBookSlot = (e) => {
    e.preventDefault();
    if (!candidateName || !university || !date || !time) return;

    const newSlot = {
      id: Date.now().toString(),
      candidateName,
      university,
      role,
      date,
      time,
      type,
      status: 'Confirmed',
      avatar: `https://i.pravatar.cc/100?img=${Math.floor(Math.random() * 70)}`
    };

    const updated = [newSlot, ...interviews];
    localStorage.setItem('careerpilot_interviews', JSON.stringify(updated));
    setInterviews(updated);

    setCandidateName('');
    setUniversity('');
    setRole('SDE Intern');
    setDate('');
    setTime('');
    setType('Technical Round 1');
    setShowModal(false);
  };

  const confirmedCount = interviews.filter(i => i.status === 'Confirmed').length;
  const pendingCount = interviews.filter(i => i.status === 'Pending Candidate').length;
  const completedCount = interviews.filter(i => i.status === 'Completed').length + 14;

  const stats = [
    { value: confirmedCount, label: 'Confirmed slots', icon: 'event_upcoming' },
    { value: pendingCount, label: 'Awaiting response', icon: 'pending_actions' },
    { value: completedCount, label: 'Completed loops', icon: 'check_circle' },
  ];

  const statusTone = (status) =>
    status === 'Confirmed' ? 'bg-success-soft text-success'
      : status === 'Pending Candidate' ? 'bg-warning-soft text-warning'
      : status === 'Rescheduled' ? 'bg-primary-soft text-primary'
      : 'bg-danger-soft text-danger';

  return (
    <div className="pt-24 px-8 pb-12 max-w-5xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-headline font-semibold text-slate-900 tracking-tight">Interview desk</h2>
          <p className="text-slate-500 text-sm mt-1">Schedule and manage upcoming assessment loops with shortlisted talent.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary text-sm font-semibold rounded-xl transition-colors hover:bg-primary-hover focus:outline-none focus:ring-4 focus:ring-primary/10"
        >
          <span className="material-symbols-outlined text-base">add_circle</span>
          Book new slot
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map(s => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-5 elev-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary-soft text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">{s.icon}</span>
            </div>
            <div>
              <h4 className="text-2xl font-headline font-bold text-slate-900">{s.value}</h4>
              <p className="text-xs font-medium text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-slate-900 text-lg">Upcoming sessions</h3>
        <div className="grid gap-4">
          {interviews.length === 0 ? (
            <p className="text-center py-12 text-slate-400 text-sm">No interviews scheduled yet. Click "Book new slot" to begin.</p>
          ) : (
            interviews.map(session => (
              <Card key={session.id} className="p-5">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img src={session.avatar} className="w-12 h-12 rounded-lg object-cover shrink-0" alt={session.candidateName} />
                    <div>
                      <h4 className="font-semibold text-base text-slate-900">{session.candidateName}</h4>
                      <p className="text-xs text-slate-500">{session.university} • {session.role}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs font-medium text-slate-600">
                    <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                      <span className="material-symbols-outlined text-base text-slate-400">calendar_today</span>
                      <span>{session.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                      <span className="material-symbols-outlined text-base text-slate-400">schedule</span>
                      <span>{session.time}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                      <span className="material-symbols-outlined text-base text-slate-400">forum</span>
                      <span>{session.type}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-stretch md:self-auto justify-between border-t border-slate-100 pt-3 md:border-none md:pt-0">
                    <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-md ${statusTone(session.status)}`}>
                      {session.status}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleAction(session.id, 'Rescheduled')}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
                        title="Reschedule"
                      >
                        <span className="material-symbols-outlined text-lg">calendar_month</span>
                      </button>
                      <button
                        onClick={() => handleAction(session.id, 'Cancelled')}
                        className="p-2 hover:bg-danger-soft rounded-lg text-danger transition-colors"
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
          <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white w-full max-w-md rounded-2xl border border-slate-200 elev-md p-8 space-y-6"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <h3 className="text-lg font-headline font-semibold text-slate-900">Book interview slot</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              <form onSubmit={handleBookSlot} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Candidate name</label>
                  <input type="text" value={candidateName} onChange={(e) => setCandidateName(e.target.value)} required placeholder="e.g. Ethan Wright" className={inputClass} />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">University / college</label>
                  <input type="text" value={university} onChange={(e) => setUniversity(e.target.value)} required placeholder="e.g. Stanford University" className={inputClass} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Target role</label>
                    <select value={role} onChange={(e) => setRole(e.target.value)} className={inputClass}>
                      <option>SDE Intern</option>
                      <option>Frontend Engineer</option>
                      <option>Backend Developer</option>
                      <option>Product Analyst</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Round type</label>
                    <select value={type} onChange={(e) => setType(e.target.value)} className={inputClass}>
                      <option>Technical Round 1</option>
                      <option>System Design</option>
                      <option>HR Discussion</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Date</label>
                    <input type="text" value={date} onChange={(e) => setDate(e.target.value)} required placeholder="e.g. Tomorrow" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Time slot</label>
                    <input type="text" value={time} onChange={(e) => setTime(e.target.value)} required placeholder="e.g. 10:00 AM" className={inputClass} />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 border border-slate-300 bg-white text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2.5 bg-primary text-on-primary text-sm font-semibold rounded-xl hover:bg-primary-hover transition-colors">
                    Confirm booking
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
