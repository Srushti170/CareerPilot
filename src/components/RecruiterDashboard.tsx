import { motion } from 'motion/react';
import { Card, MetricCard } from './MetricCard';
import { cn } from '../lib/utils';

interface Candidate {
  id: string;
  name: string;
  ref: string;
  university: string;
  branch: string;
  cgpa: number;
  skills: string[];
  match: number;
  status: string;
  avatar: string;
}

export function RecruiterDashboard() {
  const candidates: Candidate[] = [
    {
      id: '1',
      name: 'Ethan Wright',
      ref: 'HL-8821',
      university: 'Stanford University',
      branch: 'Computer Science',
      cgpa: 3.92,
      skills: ['Python', 'AWS'],
      match: 95,
      status: 'Shortlisted',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBBRyQHFCCa9-NodWs4IAGbYJjmgXh5J9B07E6eiGEHB9pCv2_ytSCM2M8VpaHROrkajpCKjuN1iyMe3fBxxarK7R7FN7c3ghIUPWjM1ThnxP1Wvz9DMnPMwG9FSWRyDVwJf3VKiDrBMN-MMFlwNClK7m-AOqJQwXvMPc7RGgdG21NtzQq2ksno9iQYClnQTV56asN8w-NQaHqn7Owzr649DRPLXS26cijWypU11hOC_FyiUZm6PrInArhSjujBi3goWtUf3ZvlG-8'
    },
    {
      id: '2',
      name: 'Sarah Chen',
      ref: 'HL-8822',
      university: 'MIT',
      branch: 'Math & Computing',
      cgpa: 3.85,
      skills: ['C++', 'Rust'],
      match: 88,
      status: 'Interview',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAtZ6snGqeVpFAjXAavBt9jAHbAz0iYXpysdWVpDKpiFAqyhYdQenlj9X957VhBxAfjxorrOfkWRQGK5T0MYutXhEq4iza_-u5RCKfqsOQpclIVbJ_0L0DIozVkgh2zg3JYwIOkK8NJPJnjZKfRqHsvD0x17XZbP7QjiwJ7HRi79OUxIRUpZ6gATnEqF6rJJy5Y8TZwFpQHuDHdBp0xr1WghP4M8MiqoDASKyx30qAGVLswTrnmSRvVYQxzOxA_7f4XEwY1VXd41zk'
    },
    {
      id: '3',
      name: 'Marcus Lee',
      ref: 'HL-8823',
      university: 'Georgia Tech',
      branch: 'Backend Systems',
      cgpa: 3.78,
      skills: ['Go', 'Kubernetes'],
      match: 82,
      status: 'Applied',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCtNzu9GNDD6XpUrWJfbEh_3Zykr-N7MdojMqOZaxsW8-MBR3N_sFSpue1JYC4UA7Lff8Itb9IpoPiHl6Or-zEADyKFxGW_7jV_pCIIjBwJD9FmjRtPMdnVKOzc21ukNmGw47_Stf2wp2D4x0mXb_QTiWOKNyyMfx3buCK_lhIJLfotYidcUm-UNRDH763SDnLzTurc_5xz8h_yH79ZPMCGdHZxo1EgdQrWaEJQsAzrlZhLD49pSj5_31JZnZprEmVD7D6k_WWexYI'
    }
  ];

  return (
    <div className="pt-24 px-8 pb-12 max-w-7xl mx-auto space-y-10">
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard label="Total Applicants" value="1,240" subtext="+12% vs last mo" color="primary" icon="person_add" />
        <MetricCard label="Shortlisted" value="85" subtext="High Quality" color="secondary" icon="verified" />
        <MetricCard label="Active Jobs" value="12" icon="work" />
        <MetricCard label="Interviews" value="24" icon="event_note" />
      </section>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 min-w-0">
          <Card className="p-0 overflow-hidden">
            <div className="p-6 border-b border-outline-variant/10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <h2 className="text-xl font-black text-on-surface">Talent Pipeline</h2>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-slate-600 bg-surface-container-low rounded-lg hover:bg-surface-container-high transition-colors">
                    <span className="material-symbols-outlined text-sm">filter_list</span>
                    Advanced Filters
                  </button>
                  <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-slate-600 bg-surface-container-low rounded-lg hover:bg-surface-container-high transition-colors">
                    <span className="material-symbols-outlined text-sm">download</span>
                    Export CSV
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                {["Min CGPA", "Branch", "Key Skills", "Match %"].map(filter => (
                  <div key={filter} className="flex-1 min-w-[120px]">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{filter}</label>
                    <select className="w-full bg-surface-container-low border-none rounded-lg text-sm focus:ring-primary/20">
                      <option>All</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low/50">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Candidate</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Education</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">CGPA</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Skills</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Match</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {candidates.map(candidate => (
                    <tr key={candidate.id} className="hover:bg-surface-container-low transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={candidate.avatar} className="w-10 h-10 rounded-lg object-cover" alt={candidate.name} />
                          <div>
                            <p className="text-sm font-bold text-on-surface">{candidate.name}</p>
                            <p className="text-[10px] text-slate-500">Ref: {candidate.ref}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-semibold text-on-surface">{candidate.university}</p>
                        <p className="text-[10px] text-slate-500">{candidate.branch}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-bold text-on-surface">{candidate.cgpa}</span>
                        <span className="text-[10px] text-slate-400">/4.0</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {candidate.skills.map(skill => (
                            <span key={skill} className="px-2 py-0.5 bg-primary/5 text-primary text-[10px] font-bold rounded">{skill}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center">
                          <div className="relative w-10 h-10">
                            <svg className="w-full h-full -rotate-90">
                              <circle cx="20" cy="20" fill="transparent" r="16" stroke="#eceef0" strokeWidth="4" />
                              <circle cx="20" cy="20" fill="transparent" r="16" stroke="#006b5f" strokeDasharray="100.5" strokeDashoffset={(100 - candidate.match)} strokeWidth="4" />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-primary">{candidate.match}%</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-3 py-1 text-[10px] font-black uppercase rounded-full",
                          candidate.status === 'Shortlisted' ? "bg-secondary-container text-on-secondary-container" : 
                          candidate.status === 'Interview' ? "bg-teal-50 text-teal-600" : "bg-surface-container-high text-slate-600"
                        )}>
                          {candidate.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <aside className="w-full lg:w-80 space-y-6">
          <button className="w-full bg-gradient-to-br from-primary to-primary-container text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3">
            <span className="material-symbols-outlined">add_circle</span>
            Post New Job
          </button>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-on-surface">Recent Jobs</h3>
              <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">View All</button>
            </div>
            <div className="space-y-4">
              {[
                { title: "SDE Intern - Summer 2024", apps: "450", date: "Oct 30", important: true },
                { title: "Product Analyst (New Grad)", apps: "128", date: "Nov 12" },
                { title: "ML Research Associate", apps: "84", date: "Nov 05" }
              ].map((job, i) => (
                <div key={i} className="p-4 rounded-lg bg-surface-container-low/50 hover:bg-surface-container-low transition-colors group cursor-pointer">
                  <h4 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">{job.title}</h4>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-slate-400">group</span>
                      <span className="text-[10px] font-bold text-slate-600">{job.apps} App</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-slate-400">calendar_today</span>
                      <span className={`text-[10px] font-bold ${job.important ? 'text-tertiary' : 'text-slate-500'}`}>{job.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
