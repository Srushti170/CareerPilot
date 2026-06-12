import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from './ui/Card';

const DEFAULT_JOBS = [
  { id: '1', title: 'SDE Intern', apps: 450, expires: '12 Days', status: 'Active' },
  { id: '2', title: 'Product Analyst', apps: 128, expires: '5 Days', status: 'Closing Soon' },
  { id: '3', title: 'ML Research', apps: 84, expires: '24 Days', status: 'Draft' },
];

const inputClass = "w-full px-4 py-2.5 rounded-lg bg-white border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-colors text-sm";

export function JobManagement() {
  const [jobs, setJobs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [analyticsJob, setAnalyticsJob] = useState(null);

  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('Active');
  const [expires, setExpires] = useState('30 Days');

  useEffect(() => {
    const stored = localStorage.getItem('careerpilot_jobs');
    if (stored) {
      setJobs(JSON.parse(stored));
    } else {
      localStorage.setItem('careerpilot_jobs', JSON.stringify(DEFAULT_JOBS));
      setJobs(DEFAULT_JOBS);
    }
  }, []);

  const handleOpenNew = () => {
    setEditingJob(null);
    setTitle('');
    setStatus('Active');
    setExpires('30 Days');
    setShowModal(true);
  };

  const handleOpenEdit = (job) => {
    setEditingJob(job);
    setTitle(job.title);
    setStatus(job.status);
    setExpires(job.expires);
    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!title) return;

    let updatedJobs;
    if (editingJob) {
      updatedJobs = jobs.map(j => j.id === editingJob.id ? { ...j, title, status, expires } : j);
    } else {
      const newJob = { id: Date.now().toString(), title, status, expires, apps: 0 };
      updatedJobs = [newJob, ...jobs];
    }

    localStorage.setItem('careerpilot_jobs', JSON.stringify(updatedJobs));
    setJobs(updatedJobs);
    setShowModal(false);
  };

  const handleDelete = (id) => {
    const updated = jobs.filter(j => j.id !== id);
    localStorage.setItem('careerpilot_jobs', JSON.stringify(updated));
    setJobs(updated);
    setAnalyticsJob(null);
  };

  const statusTone = (s) =>
    s === 'Active' ? 'bg-success-soft text-success'
      : s === 'Closing Soon' ? 'bg-warning-soft text-warning'
      : 'bg-slate-100 text-slate-500';

  return (
    <div className="pt-24 px-8 pb-12 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl md:text-3xl font-headline font-semibold text-slate-900 tracking-tight">Job management</h2>
          <p className="text-slate-500 mt-1 text-sm">Create, edit and track performance of your job postings.</p>
        </div>
        <button
          onClick={handleOpenNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary font-semibold rounded-xl text-sm transition-colors hover:bg-primary-hover focus:outline-none focus:ring-4 focus:ring-primary/10"
        >
          <span className="material-symbols-outlined text-base">post_add</span>
          New posting
        </button>
      </div>

      <div className="grid gap-4">
        {jobs.length === 0 ? (
          <p className="text-center py-12 text-slate-400 text-sm">No job postings available. Click "New posting" to create one.</p>
        ) : (
          jobs.map((job) => (
            <Card key={job.id} hover className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
                  <span className="material-symbols-outlined text-3xl">work</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">{job.title}</h3>
                  <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">group</span> {job.apps} applicants</span>
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">schedule</span> Expires in {job.expires}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span className={`px-3 py-1 rounded-md text-[11px] font-semibold ${statusTone(job.status)}`}>
                  {job.status}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => handleOpenEdit(job)} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors" title="Edit posting">
                    <span className="material-symbols-outlined">edit</span>
                  </button>
                  <button onClick={() => setAnalyticsJob(job)} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors" title="Job analytics">
                    <span className="material-symbols-outlined">analytics</span>
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
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
                <h3 className="text-lg font-headline font-semibold text-slate-900">
                  {editingJob ? 'Edit job posting' : 'Post new job'}
                </h3>
                <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Job title</label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. SDE Intern" className={inputClass} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Expiry window</label>
                    <input type="text" value={expires} onChange={(e) => setExpires(e.target.value)} required placeholder="e.g. 15 Days" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Status</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
                      <option>Active</option>
                      <option>Closing Soon</option>
                      <option>Draft</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 border border-slate-300 bg-white text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2.5 bg-primary text-on-primary text-sm font-semibold rounded-xl hover:bg-primary-hover transition-colors">
                    {editingJob ? 'Save changes' : 'Publish job'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {analyticsJob && (
          <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white w-full max-w-xl rounded-2xl border border-slate-200 elev-md p-8 space-y-6 relative"
            >
              <button onClick={() => setAnalyticsJob(null)} className="absolute top-6 right-6 p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>

              <div className="border-b border-slate-100 pb-4">
                <span className="inline-block px-2.5 py-1 bg-primary-soft text-primary text-[11px] font-semibold rounded-md">
                  Live posting analytics
                </span>
                <h3 className="text-xl font-headline font-semibold text-slate-900 mt-2">{analyticsJob.title}</h3>
                <p className="text-slate-500 text-xs mt-1">Detailed performance and applicant flow metrics</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                  <p className="text-[11px] font-medium text-slate-500 mb-1">Total impressions</p>
                  <h4 className="text-2xl font-headline font-bold text-slate-900">1,850</h4>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                  <p className="text-[11px] font-medium text-slate-500 mb-1">Conversion rate</p>
                  <h4 className="text-2xl font-headline font-bold text-primary">24.3%</h4>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                  <p className="text-[11px] font-medium text-slate-500 mb-1">Applications</p>
                  <h4 className="text-2xl font-headline font-bold text-slate-900">{analyticsJob.apps}</h4>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-semibold text-slate-500">Recruitment pipeline breakdown</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                      <span>Applied candidates</span>
                      <span>{analyticsJob.apps}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-400 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                      <span>Shortlisted / passed screen</span>
                      <span>{Math.floor(analyticsJob.apps * 0.2)} candidates</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary/50 rounded-full" style={{ width: '20%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                      <span>Interview round</span>
                      <span>{Math.floor(analyticsJob.apps * 0.05)} candidates</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: '5%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-between gap-3">
                <button onClick={() => handleDelete(analyticsJob.id)} className="px-4 py-2.5 bg-danger-soft text-danger hover:opacity-80 text-sm font-semibold rounded-xl transition-opacity">
                  Delete posting
                </button>
                <button onClick={() => setAnalyticsJob(null)} className="px-4 py-2.5 border border-slate-300 bg-white text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors">
                  Close analytics
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
