import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from './MetricCard';

const DEFAULT_STUDENTS = [
  { name: 'Alex Rivera', role: 'Full Stack', cgpa: 3.92, placement: 'Placed (Google)', initial: 'AR' },
  { name: 'Sonia Gupta', role: 'Data Analyst', cgpa: 3.85, placement: 'Placed (Accenture)', initial: 'SG' },
  { name: 'Rahul Dev', role: 'Backend Dev', cgpa: 3.72, placement: 'Open', initial: 'RD' },
  { name: 'Mira Nair', role: 'Designer', cgpa: 3.95, placement: 'In-Process', initial: 'MN' },
];

export function StudentRecords() {
  const [students, setStudents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [role, setRole] = useState('Full Stack');
  const [cgpa, setCgpa] = useState('');
  const [placement, setPlacement] = useState('Open');

  useEffect(() => {
    const stored = localStorage.getItem('careerpilot_students');
    if (stored) {
      setStudents(JSON.parse(stored));
    } else {
      localStorage.setItem('careerpilot_students', JSON.stringify(DEFAULT_STUDENTS));
      setStudents(DEFAULT_STUDENTS);
    }
  }, []);

  const handleNewEntry = (e) => {
    e.preventDefault();
    if (!name || !cgpa) return;

    const newStudent = {
      name,
      role,
      cgpa: Number(cgpa),
      placement,
      initial: name.split(' ').map(n => n[0]).join('').toUpperCase()
    };

    const updated = [newStudent, ...students];
    localStorage.setItem('careerpilot_students', JSON.stringify(updated));
    setStudents(updated);
    setShowModal(false);

    setName('');
    setCgpa('');
    setPlacement('Open');

    setSuccessMsg('Student added successfully!');
    setTimeout(() => setSuccessMsg(''), 2000);
  };

  const handleBulkImport = () => {
    const bulkData = [
      { name: 'Vijay Kumar', role: 'DevOps Engineer', cgpa: 3.65, placement: 'Open', initial: 'VK' },
      { name: 'Anjali Shah', role: 'QA Analyst', cgpa: 3.78, placement: 'Placed (Stripe)', initial: 'AS' },
      { name: 'David Smith', role: 'Security Analyst', cgpa: 3.91, placement: 'In-Process', initial: 'DS' }
    ];

    const updated = [...bulkData, ...students];
    localStorage.setItem('careerpilot_students', JSON.stringify(updated));
    setStudents(updated);

    setSuccessMsg('Successfully bulk imported 3 student records!');
    setTimeout(() => setSuccessMsg(''), 2000);
  };

  return (
    <div className="pt-24 px-8 pb-12 max-w-7xl mx-auto space-y-10">
      {successMsg && (
        <div className="p-4 bg-teal-50 border border-teal-200 text-teal-800 text-sm font-semibold rounded-xl flex items-center gap-2">
          <span className="material-symbols-outlined text-base">check_circle</span>
          <span>{successMsg}</span>
        </div>
      )}

      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-on-surface tracking-tighter">Student Registry</h2>
          <p className="text-slate-500 mt-1 font-medium">Monitoring academic and placement progress for university students.</p>
        </div>
        <div className="flex gap-4">
           <button 
             onClick={handleBulkImport}
             className="px-6 py-3 bg-surface-container-low text-on-surface font-bold rounded-xl border border-outline-variant/10 hover:bg-slate-200 transition-colors"
           >
             Bulk Import
           </button>
           <button 
             onClick={() => setShowModal(true)}
             className="px-6 py-3 bg-primary text-white font-black rounded-xl shadow-lg hover:scale-[1.01] transition-transform"
           >
             New Student Entry
           </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-4 space-y-6">
           <Card className="p-8">
             <h3 className="font-bold text-on-surface mb-6 uppercase text-xs tracking-widest text-slate-400">Department Stats</h3>
             <div className="space-y-6">
               {[
                 { name: 'Computer Science', count: 1200, placed: 85 },
                 { name: 'Information Tech', count: 850, placed: 72 },
                 { name: 'Electronics', count: 420, placed: 45 }
               ].map(dept => (
                 <div key={dept.name}>
                   <div className="flex justify-between items-center mb-2">
                     <span className="text-sm font-bold text-on-surface">{dept.name}</span>
                     <span className="text-[10px] font-black text-primary">{dept.placed}% Placed</span>
                   </div>
                   <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                     <div className="h-full bg-primary" style={{ width: `${dept.placed}%` }}></div>
                   </div>
                 </div>
               ))}
             </div>
           </Card>
        </div>

        <div className="col-span-12 lg:col-span-8">
          <Card className="p-0 overflow-hidden">
             <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low/50">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Role</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">CGPA</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {students.map(s => (
                    <tr key={s.name} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center font-bold text-xs">{s.initial}</div>
                          <span className="font-bold text-on-surface">{s.name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-sm font-medium text-slate-500">{s.role}</td>
                      <td className="px-8 py-5 text-center font-bold text-slate-700">{s.cgpa}</td>
                      <td className="px-8 py-5">
                        <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          s.placement.includes('Placed') ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {s.placement}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </Card>
        </div>
      </div>

      {/* New Student Modal */}
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
                <h3 className="text-xl font-black text-slate-800">Add Student Record</h3>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              <form onSubmit={handleNewEntry} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Student Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g. Vijay Kumar"
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">CGPA</label>
                    <input 
                      type="number" 
                      value={cgpa}
                      onChange={(e) => setCgpa(e.target.value)}
                      required
                      min="0"
                      max="4"
                      step="0.01"
                      placeholder="e.g. 3.82"
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Target Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium"
                    >
                      <option>Full Stack</option>
                      <option>Data Analyst</option>
                      <option>Backend Dev</option>
                      <option>Designer</option>
                      <option>DevOps Engineer</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Placement Status</label>
                  <select
                    value={placement}
                    onChange={(e) => setPlacement(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium"
                  >
                    <option>Open</option>
                    <option>In-Process</option>
                    <option>Placed (Google)</option>
                    <option>Placed (Microsoft)</option>
                    <option>Placed (Amazon)</option>
                    <option>Placed (Stripe)</option>
                  </select>
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
                    Save Student Record
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowModal(true)}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary-container text-white shadow-2xl flex items-center justify-center hover:shadow-primary/30 transition-transform z-40"
      >
        <span className="material-symbols-outlined text-3xl">add</span>
      </motion.button>
    </div>
  );
}
