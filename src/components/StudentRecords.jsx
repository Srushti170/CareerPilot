import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from './ui/Card';
import { getDepartmentBreakdown, getStoredStudents, mergeStudentRecords, normalizeStudentRecord, saveStoredStudents } from '../lib/adminData';

const inputClass = 'w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/10';

export function StudentRecords({ applications = [] }) {
  const [manualStudents, setManualStudents] = useState(() => getStoredStudents());
  const [showModal, setShowModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [draft, setDraft] = useState({
    name: '',
    role: 'Full Stack',
    cgpa: '',
    placement: 'Open',
    branch: 'Computer Science',
  });

  useEffect(() => {
    const syncStudents = () => setManualStudents(getStoredStudents());
    window.addEventListener('careerpilot:students-updated', syncStudents);
    return () => {
      window.removeEventListener('careerpilot:students-updated', syncStudents);
    };
  }, []);

  const students = useMemo(
    () => mergeStudentRecords(manualStudents, applications),
    [applications, manualStudents]
  );

  const departments = useMemo(
    () => getDepartmentBreakdown(students).slice(0, 4),
    [students]
  );

  const handleNewEntry = (event) => {
    event.preventDefault();
    if (!draft.name || !draft.cgpa) return;

    const newStudent = normalizeStudentRecord(draft);
    setManualStudents(saveStoredStudents([newStudent, ...manualStudents]));
    setShowModal(false);
    setDraft({ name: '', role: 'Full Stack', cgpa: '', placement: 'Open', branch: 'Computer Science' });
    setSuccessMsg('Student added successfully!');
    setTimeout(() => setSuccessMsg(''), 2000);
  };

  const handleBulkImport = () => {
    const bulkData = [
      { name: 'Vijay Kumar', role: 'DevOps Engineer', cgpa: 7.4, placement: 'Open', branch: 'Information Technology' },
      { name: 'Anjali Shah', role: 'QA Analyst', cgpa: 8.1, placement: 'Placed (Stripe)', branch: 'Computer Science' },
      { name: 'David Smith', role: 'Security Analyst', cgpa: 8.8, placement: 'In-Process', branch: 'Electronics' },
    ].map(normalizeStudentRecord);

    setManualStudents(saveStoredStudents([...bulkData, ...manualStudents]));
    setSuccessMsg('Successfully bulk imported 3 student records!');
    setTimeout(() => setSuccessMsg(''), 2000);
  };

  const updateDraft = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-8 pb-12 pt-24">
      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-success/20 bg-success-soft p-4 text-sm font-medium text-success">
          <span className="material-symbols-outlined text-base">check_circle</span>
          <span>{successMsg}</span>
        </div>
      )}

      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-headline font-semibold tracking-tight text-slate-900 md:text-3xl">Student registry</h2>
          <p className="mt-1 text-sm text-slate-500">Monitor shared application progress, manual records, and branch-wise placement movement.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleBulkImport} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
            Bulk import
          </button>
          <button onClick={() => setShowModal(true)} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-hover focus:outline-none focus:ring-4 focus:ring-primary/10">
            New student entry
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 space-y-6 lg:col-span-4">
          <Card className="p-6">
            <h3 className="mb-6 text-xs font-semibold text-slate-500">Department stats</h3>
            <div className="space-y-6">
              {departments.map((dept) => (
                <div key={dept.name}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900">{dept.name}</span>
                    <span className="text-xs font-semibold text-primary">{dept.rate}% placed</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${dept.rate}%` }}></div>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{dept.placed}/{dept.total} placed · Avg CGPA {dept.avgCgpa}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="col-span-12 lg:col-span-8">
          <Card className="overflow-hidden p-0">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-8 py-4 text-[11px] font-semibold text-slate-500">Student</th>
                  <th className="px-8 py-4 text-[11px] font-semibold text-slate-500">Target role</th>
                  <th className="px-8 py-4 text-[11px] font-semibold text-slate-500">Branch</th>
                  <th className="px-8 py-4 text-center text-[11px] font-semibold text-slate-500">CGPA</th>
                  <th className="px-8 py-4 text-[11px] font-semibold text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => (
                  <tr key={`${student.name}-${student.role}`} className="transition-colors hover:bg-slate-50">
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">{student.initial}</div>
                        <span className="font-semibold text-slate-900">{student.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-4 text-sm text-slate-500">{student.role}</td>
                    <td className="px-8 py-4 text-sm text-slate-500">{student.branch}</td>
                    <td className="px-8 py-4 text-center font-semibold text-slate-700">{student.cgpa || '-'}</td>
                    <td className="px-8 py-4">
                      <span className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${student.placement.startsWith('Placed') ? 'bg-primary-soft text-primary' : student.placement === 'In-Process' || student.placement.startsWith('Offer') ? 'bg-warning-soft text-warning' : 'bg-slate-100 text-slate-500'}`}>
                        {student.placement}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-md space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-lg font-headline font-semibold text-slate-900">Add student record</h3>
                <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              <form onSubmit={handleNewEntry} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Student name</label>
                  <input value={draft.name} onChange={(e) => updateDraft('name', e.target.value)} required placeholder="e.g. Vijay Kumar" className={inputClass} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">CGPA</label>
                    <input type="number" value={draft.cgpa} onChange={(e) => updateDraft('cgpa', e.target.value)} required min="0" max="10" step="0.01" placeholder="e.g. 8.2" className={inputClass} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">Target role</label>
                    <select value={draft.role} onChange={(e) => updateDraft('role', e.target.value)} className={inputClass}>
                      <option>Full Stack</option>
                      <option>Data Analyst</option>
                      <option>Backend Dev</option>
                      <option>Designer</option>
                      <option>DevOps Engineer</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">Branch</label>
                    <select value={draft.branch} onChange={(e) => updateDraft('branch', e.target.value)} className={inputClass}>
                      <option>Computer Science</option>
                      <option>Information Technology</option>
                      <option>Electronics</option>
                      <option>Mechanical</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">Placement status</label>
                    <select value={draft.placement} onChange={(e) => updateDraft('placement', e.target.value)} className={inputClass}>
                      <option>Open</option>
                      <option>In-Process</option>
                      <option>Placed (Google)</option>
                      <option>Placed (Microsoft)</option>
                      <option>Placed (Amazon)</option>
                      <option>Placed (Stripe)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
                    Cancel
                  </button>
                  <button type="submit" className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-hover">
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
        className="fixed bottom-8 right-8 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-xl transition-colors hover:bg-primary-hover"
      >
        <span className="material-symbols-outlined text-3xl">add</span>
      </motion.button>
    </div>
  );
}
