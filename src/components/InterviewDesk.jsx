import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from './MetricCard';

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

export function InterviewDesk() {
  const [interviews, setInterviews] = useState([]);
  const [showModal, setShowModal] = useState(false);

  // Form states
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

    // Reset form & close modal
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
  const completedCount = interviews.filter(i => i.status === 'Completed').length + 14; // Mock additions

  return (
    <div className="pt-24 px-8 pb-12 max-w-5xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-on-surface tracking-tighter">Interview Desk</h2>
          <p className="text-slate-500 text-sm">Schedule and manage upcoming assessment loops with shortlisted talent.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">add_circle</span>
          Book New Slot
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">event_upcoming</span>
          </div>
          <div>
            <h4 className="text-2xl font-black text-slate-800">{confirmedCount}</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Confirmed Slots</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-secondary/5 text-secondary flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">pending_actions</span>
          </div>
          <div>
            <h4 className="text-2xl font-black text-slate-800">{pendingCount}</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Awaiting Response</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-tertiary/5 text-tertiary flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">check_circle</span>
          </div>
          <div>
            <h4 className="text-2xl font-black text-slate-800">{completedCount}</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completed Loops</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-slate-800 text-lg">Upcoming Sessions</h3>
        <div className="grid gap-4">
          {interviews.length === 0 ? (
            <p className="text-center py-12 text-slate-400 text-sm font-semibold">No interviews scheduled yet. Click "Book New Slot" to begin.</p>
          ) : (
            interviews.map(session => (
              <Card key={session.id} className="p-5">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img src={session.avatar} className="w-12 h-12 rounded-xl object-cover shrink-0" alt={session.candidateName} />
                    <div>
                      <h4 className="font-bold text-base text-slate-800">{session.candidateName}</h4>
                      <p className="text-xs text-slate-500">{session.university} • {session.role}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-600">
                    <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                      <span className="material-symbols-outlined text-base text-slate-400">calendar_today</span>
                      <span>{session.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                      <span className="material-symbols-outlined text-base text-slate-400">schedule</span>
                      <span>{session.time}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                      <span className="material-symbols-outlined text-base text-slate-400">forum</span>
                      <span>{session.type}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-stretch md:self-auto justify-between border-t border-slate-50 pt-3 md:border-none md:pt-0">
                    <span className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg border ${
                      session.status === 'Confirmed' 
                        ? 'bg-teal-50 text-teal-700 border-teal-100' 
                        : session.status === 'Pending Candidate'
                        ? 'bg-amber-50 text-amber-700 border-amber-100'
                        : session.status === 'Rescheduled'
                        ? 'bg-blue-50 text-blue-700 border-blue-100'
                        : 'bg-red-50 text-red-700 border-red-100'
                    }`}>
                      {session.status}
                    </span>

                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleAction(session.id, 'Rescheduled')}
                        className="p-2 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
                        title="Reschedule"
                      >
                        <span className="material-symbols-outlined text-lg">calendar_month</span>
                      </button>
                      <button 
                        onClick={() => handleAction(session.id, 'Cancelled')}
                        className="p-2 hover:bg-slate-50 rounded-lg text-red-500 hover:text-red-700 transition-colors"
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

      {/* Booking Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] border border-slate-100 shadow-2xl p-8 space-y-6"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <h3 className="text-xl font-black text-slate-800">Book Interview Slot</h3>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              <form onSubmit={handleBookSlot} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Candidate Name</label>
                  <input 
                    type="text" 
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    required
                    placeholder="e.g. Ethan Wright"
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">University / College</label>
                  <input 
                    type="text" 
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    required
                    placeholder="e.g. Stanford University"
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Target Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium"
                    >
                      <option>SDE Intern</option>
                      <option>Frontend Engineer</option>
                      <option>Backend Developer</option>
                      <option>Product Analyst</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Round Type</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium"
                    >
                      <option>Technical Round 1</option>
                      <option>System Design</option>
                      <option>HR Discussion</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Date</label>
                    <input 
                      type="text" 
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      placeholder="e.g. Tomorrow, or June 20"
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Time Slot</label>
                    <input 
                      type="text" 
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      required
                      placeholder="e.g. 10:00 AM - 11:00 AM"
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2.5 bg-slate-50 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all"
                  >
                    Confirm Booking
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
