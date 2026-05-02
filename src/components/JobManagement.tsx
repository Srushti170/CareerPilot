import { motion } from 'motion/react';
import { Card } from './MetricCard';

export function JobManagement() {
  const jobs = [
    { title: 'SDE Intern', apps: 450, expires: '12 Days', status: 'Active' },
    { title: 'Product Analyst', apps: 128, expires: '5 Days', status: 'Closing Soon' },
    { title: 'ML Research', apps: 84, expires: '24 Days', status: 'Draft' },
  ];

  return (
    <div className="pt-24 px-8 pb-12 max-w-7xl mx-auto space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-on-surface tracking-tighter">Job Management</h2>
          <p className="text-slate-500 mt-1 font-medium">Create, edit and track performance of your job postings.</p>
        </div>
        <button className="flex items-center gap-2 px-8 py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform">
          <span className="material-symbols-outlined">post_add</span>
          New Posting
        </button>
      </div>

      <div className="grid gap-6">
        {jobs.map((job, i) => (
          <Card key={i} className="p-6 flex items-center justify-between group hover:border-primary/20 transition-all">
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
                   <button className="p-3 rounded-xl bg-surface-container-low text-on-surface hover:bg-slate-200 transition-colors">
                      <span className="material-symbols-outlined">edit</span>
                   </button>
                   <button className="p-3 rounded-xl bg-surface-container-low text-on-surface hover:bg-slate-200 transition-colors">
                      <span className="material-symbols-outlined">analytics</span>
                   </button>
                </div>
             </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
