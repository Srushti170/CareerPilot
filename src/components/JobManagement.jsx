import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from './MetricCard';

const DEFAULT_JOBS = [
  { id: '1', title: 'SDE Intern', apps: 450, expires: '12 Days', status: 'Active' },
  { id: '2', title: 'Product Analyst', apps: 128, expires: '5 Days', status: 'Closing Soon' },
  { id: '3', title: 'ML Research', apps: 84, expires: '24 Days', status: 'Draft' },
];

export function JobManagement() {
  const [jobs, setJobs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null); // null when posting new, job object when editing

  // Form states
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
      // Editing
      updatedJobs = jobs.map(j => j.id === editingJob.id ? { ...j, title, status, expires } : j);
    } else {
      // Creating new
      const newJob = {
        id: Date.now().toString(),
        title,
        status,
        expires,
        apps: 0
      };
      updatedJobs = [newJob, ...jobs];
    }

    localStorage.setItem('careerpilot_jobs', JSON.stringify(updatedJobs));
    setJobs(updatedJobs);
    setShowModal(false);
  };

  return (
    <div className="pt-24 px-8 pb-12 max-w-7xl mx-auto space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-on-surface tracking-tighter">Job Management</h2>
          <p className="text-slate-500 mt-1 font-medium">Create, edit and track performance of your job postings.</p>
        </div>
        <button 
          onClick={handleOpenNew}
          className="flex items-center gap-2 px-8 py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform"
        >
          <span className="material-symbols-outlined">post_add</span>
          New Posting
        </button>
      </div>

      <div className="grid gap-6">
        {jobs.length === 0 ? (
          <p className="text-center py-12 text-slate-400 font-semibold text-sm">No job postings available. Click "New Posting" to create one.</p>
        ) : (
          jobs.map((job) => (
            <Card key={job.id} className="p-6 flex items-center justify-between group hover:border-primary/20 transition-all">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-surface-container-low flex items-center justify-center p-4 group-hover:bg-primary/5 transition-colors">
                  <span className="material-symbols-outlined text-4xl text-slate-400 group-hover:text-primary transition-colors">work</span>
                </div>
                <div>
                  <h3 className="text-xl font-black text-on-surface mb-1 group-hover:text-primary transition-colors">{job.title}</h3>
                  <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">group</span> {job.apps} Applicants</span>
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">schedule</span> Expires in {job.expires}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                  <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    job.status === 'Active' ? 'bg-green-50 text-green-600' :
                    job.status === 'Closing Soon' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {job.status}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleOpenEdit(job)}
                    className="p-3 rounded-xl bg-surface-container-low text-on-surface hover:bg-slate-200 transition-colors"
                  >
                    <span className="material-symbols-outlined">edit</span>
                  </button>
                  <button className="p-3 rounded-xl bg-surface-container-low text-on-surface hover:bg-slate-200 transition-colors">
                    <span className="material-symbols-outlined">analytics</span>
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Post/Edit Modal */}
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
                <h3 className="text-xl font-black text-slate-800">
                  {editingJob ? 'Edit Job Posting' : 'Post New Job'}
                </h3>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Job Title</label>
                  <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="e.g. SDE Intern"
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Expiry Window</label>
                    <input 
                      type="text" 
                      value={expires}
                      onChange={(e) => setExpires(e.target.value)}
                      required
                      placeholder="e.g. 15 Days"
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium"
                    >
                      <option>Active</option>
                      <option>Closing Soon</option>
                      <option>Draft</option>
                    </select>
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
                    {editingJob ? 'Save Changes' : 'Publish Job'}
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
