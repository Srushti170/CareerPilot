import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from './ui/Card';

const DEFAULT_STUDENTS = [
  { name: 'Alex Rivera', role: 'Full Stack', cgpa: 3.92, placement: 'Placed (Google)', initial: 'AR' },
  { name: 'Sonia Gupta', role: 'Data Analyst', cgpa: 3.85, placement: 'Placed (Accenture)', initial: 'SG' },
  { name: 'Rahul Dev', role: 'Backend Dev', cgpa: 3.72, placement: 'Open', initial: 'RD' },
  { name: 'Mira Nair', role: 'Designer', cgpa: 3.95, placement: 'In-Process', initial: 'MN' },
];

const inputClass = "w-full px-4 py-2.5 rounded-lg bg-white border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-colors text-sm";

export function StudentRecords() {
  const [students, setStudents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

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
    <div className="pt-24 px-8 pb-12 max-w-7xl mx-auto space-y-8">
      {successMsg && (
        <div className="p-4 bg-success-soft border border-success/20 text-success text-sm font-medium rounded-xl flex items-center gap-2">
          <span className="material-symbols-outlined text-base">check_circle</span>
          <span>{successMsg}</span>
        </div>
      )}

      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl md:text-3xl font-headline font-semibold text-slate-900 tracking-tight">Student registry</h2>
          <p className="text-slate-500 mt-1 text-sm">Monitoring academic and placement progress for university students.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleBulkImport} className="px-4 py-2.5 border border-slate-300 bg-white text-slate-700 font-semibold text-sm rounded-xl hover:bg-slate-50 transition-colors">
            Bulk import
          </button>
          <button onClick={() => setShowModal(true)} className="px-4 py-2.5 bg-primary text-on-primary font-semibold text-sm rounded-xl hover:bg-primary-hover transition-colors focus:outline-none focus:ring-4 focus:ring-primary/10">
            New student entry
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <Card className="p-6">
            <h3 className="text-xs font-semibold text-slate-500 mb-6">Department stats</h3>
            <div className="space-y-6">
              {[
                { name: 'Computer Science', count: 1200, placed: 85 },
                { name: 'Information Tech', count: 850, placed: 72 },
                { name: 'Electronics', count: 420, placed: 45 }
              ].map(dept => (
                <div key={dept.name}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-slate-900">{dept.name}</span>
                    <span className="text-xs font-semibold text-primary">{dept.placed}% placed</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${dept.placed}%` }}></div>
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
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-8 py-4 text-[11px] font-semibold text-slate-500">Student</th>
                  <th className="px-8 py-4 text-[11px] font-semibold text-slate-500">Target role</th>
                  <th className="px-8 py-4 text-[11px] font-semibold text-slate-500 text-center">CGPA</th>
                  <th className="px-8 py-4 text-[11px] font-semibold text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map(s => (
                  <tr key={s.name} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-semibold text-xs text-slate-600">{s.initial}</div>
                        <span className="font-semibold text-slate-900">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-4 text-sm text-slate-500">{s.role}</td>
                    <td className="px-8 py-4 text-center font-semibold text-slate-700">{s.cgpa}</td>
                    <td className="px-8 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                        s.placement.includes('Placed') ? 'bg-primary-soft text-primary' : 'bg-slate-100 text-slate-500'
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
                <h3 className="text-lg font-headline font-semibold text-slate-900">Add student record</h3>
                <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              <form onSubmit={handleNewEntry} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Student name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Vijay Kumar" className={inputClass} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">CGPA</label>
                    <input type="number" value={cgpa} onChange={(e) => setCgpa(e.target.value)} required min="0" max="4" step="0.01" placeholder="e.g. 3.82" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Target role</label>
                    <select value={role} onChange={(e) => setRole(e.target.value)} className={inputClass}>
                      <option>Full Stack</option>
                      <option>Data Analyst</option>
                      <option>Backend Dev</option>
                      <option>Designer</option>
                      <option>DevOps Engineer</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Placement status</label>
                  <select value={placement} onChange={(e) => setPlacement(e.target.value)} className={inputClass}>
                    <option>Open</option>
                    <option>In-Process</option>
                    <option>Placed (Google)</option>
                    <option>Placed (Microsoft)</option>
                    <option>Placed (Amazon)</option>
                    <option>Placed (Stripe)</option>
                  </select>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 border border-slate-300 bg-white text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2.5 bg-primary text-on-primary text-sm font-semibold rounded-xl hover:bg-primary-hover transition-colors">
                    Save student record
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowModal(true)}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-primary text-on-primary elev-md flex items-center justify-center hover:bg-primary-hover transition-colors z-40"
      >
        <span className="material-symbols-outlined text-3xl">add</span>
      </motion.button>
    </div>
  );
}
