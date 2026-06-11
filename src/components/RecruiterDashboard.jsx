import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, MetricCard } from './MetricCard';
import { cn } from '../lib/utils';

export function RecruiterDashboard({ setActiveTab }) {
  const [candidates, setCandidates] = useState(() => {
    const stored = localStorage.getItem('careerpilot_candidates_recruiter');
    if (stored) return JSON.parse(stored);

    const defaults = [
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
        avatar: 'https://i.pravatar.cc/100?img=12'
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
        avatar: 'https://i.pravatar.cc/100?img=25'
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
        avatar: 'https://i.pravatar.cc/100?img=33'
      }
    ];
    localStorage.setItem('careerpilot_candidates_recruiter', JSON.stringify(defaults));
    return defaults;
  });

  const [minCgpa, setMinCgpa] = useState('All');
  const [branch, setBranch] = useState('All');
  const [matchPercent, setMatchPercent] = useState('All');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advancedRole, setAdvancedRole] = useState('All');

  const handleStatusChange = (id, newStatus) => {
    const updated = candidates.map(c => c.id === id ? { ...c, status: newStatus } : c);
    setCandidates(updated);
    localStorage.setItem('careerpilot_candidates_recruiter', JSON.stringify(updated));
  };

  const handleExportCSV = () => {
    const headers = ['Candidate', 'Ref', 'University', 'Branch', 'CGPA', 'Match Score', 'Status'];
    const rows = candidates.map(c => [c.name, c.ref, c.university, c.branch, c.cgpa, `${c.match}%`, c.status]);
    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "careerpilot_recruiter_pipeline.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter candidates
  const filteredCandidates = candidates.filter(c => {
    if (minCgpa !== 'All' && c.cgpa < parseFloat(minCgpa)) return false;
    if (branch !== 'All' && c.branch !== branch) return false;
    if (matchPercent !== 'All' && c.match < parseInt(matchPercent)) return false;
    if (advancedRole !== 'All' && !c.skills.some(s => s.toLowerCase().includes(advancedRole.toLowerCase()))) return false;
    return true;
  });

  return (
    <div className="pt-24 px-8 pb-12 max-w-7xl mx-auto space-y-10">
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard label="Total Applicants" value="1,240" subtext="+12% vs last mo" color="primary" icon="person_add" />
        <MetricCard label="Shortlisted" value={candidates.filter(c => c.status === 'Shortlisted').length.toString()} subtext="High Quality" color="secondary" icon="verified" />
        <MetricCard label="Active Jobs" value="12" icon="work" />
        <MetricCard label="Interviews" value={candidates.filter(c => c.status === 'Interview').length.toString()} icon="event_note" />
      </section>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 min-w-0">
          <Card className="p-0 overflow-hidden">
            <div className="p-6 border-b border-outline-variant/10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <h2 className="text-xl font-black text-on-surface">Talent Pipeline</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-slate-600 bg-surface-container-low rounded-lg hover:bg-surface-container-high transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">filter_list</span>
                    {showAdvanced ? 'Hide Filters' : 'Advanced Filters'}
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-slate-600 bg-surface-container-low rounded-lg hover:bg-surface-container-high transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">download</span>
                    Export CSV
                  </button>
                </div>
              </div>

              {/* Advanced Filter Drawer */}
              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4"
                  >
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Required Skill Keywords</label>
                      <select
                        value={advancedRole}
                        onChange={(e) => setAdvancedRole(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg text-sm p-2 outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="All">All Skills</option>
                        <option value="Python">Python</option>
                        <option value="AWS">AWS</option>
                        <option value="Rust">Rust</option>
                        <option value="C++">C++</option>
                        <option value="Go">Go</option>
                        <option value="Kubernetes">Kubernetes</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => { setMinCgpa('All'); setBranch('All'); setMatchPercent('All'); setAdvancedRole('All'); }}
                        className="w-full py-2 bg-slate-200 text-slate-700 font-bold rounded-lg text-xs uppercase tracking-wider hover:bg-slate-300 transition-colors"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Min CGPA</label>
                  <select
                    value={minCgpa}
                    onChange={(e) => setMinCgpa(e.target.value)}
                    className="w-full bg-surface-container-low border-none rounded-lg text-sm focus:ring-primary/20 p-2 cursor-pointer font-medium text-slate-700"
                  >
                    <option value="All">All Scores</option>
                    <option value="3.9">3.9+ GPA</option>
                    <option value="3.8">3.8+ GPA</option>
                    <option value="3.7">3.7+ GPA</option>
                  </select>
                </div>

                <div className="flex-1 min-w-[120px]">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Branch</label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full bg-surface-container-low border-none rounded-lg text-sm focus:ring-primary/20 p-2 cursor-pointer font-medium text-slate-700"
                  >
                    <option value="All">All Branches</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Math & Computing">Math & Computing</option>
                    <option value="Backend Systems">Backend Systems</option>
                  </select>
                </div>

                <div className="flex-1 min-w-[120px]">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Min Match Score</label>
                  <select
                    value={matchPercent}
                    onChange={(e) => setMatchPercent(e.target.value)}
                    className="w-full bg-surface-container-low border-none rounded-lg text-sm focus:ring-primary/20 p-2 cursor-pointer font-medium text-slate-700"
                  >
                    <option value="All">All Fits</option>
                    <option value="95">95%+ Match</option>
                    <option value="90">90%+ Match</option>
                    <option value="80">80%+ Match</option>
                  </select>
                </div>
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
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status / Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {filteredCandidates.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-slate-400 font-semibold text-sm">No candidates match current pipeline filters.</td>
                    </tr>
                  ) : (
                    filteredCandidates.map(candidate => (
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
                          <select
                            value={candidate.status}
                            onChange={(e) => handleStatusChange(candidate.id, e.target.value)}
                            className={cn(
                              "px-3 py-1 text-[10px] font-black uppercase rounded-full border-none focus:ring-1 focus:ring-primary/20 cursor-pointer",
                              candidate.status === 'Shortlisted' ? "bg-secondary-container text-on-secondary-container" :
                                candidate.status === 'Interview' ? "bg-teal-50 text-teal-600" : "bg-surface-container-high text-slate-600"
                            )}
                          >
                            <option value="Applied">Applied</option>
                            <option value="Shortlisted">Shortlisted</option>
                            <option value="Interview">Interview</option>
                            <option value="On Hold">On Hold</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <aside className="w-full lg:w-80 space-y-6">
          <button
            onClick={() => setActiveTab('jobs')}
            className="w-full bg-gradient-to-br from-primary to-primary-container text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            <span className="material-symbols-outlined">add_circle</span>
            Post New Job
          </button>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-on-surface">Recent Jobs</h3>
              <button
                onClick={() => setActiveTab('jobs')}
                className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline bg-transparent border-none"
              >
                View All
              </button>
            </div>
            <div className="space-y-4">
              {[
                { title: "SDE Intern - Summer 2026", apps: "450", date: "Oct 30", important: true },
                { title: "Product Analyst (New Grad)", apps: "128", date: "Nov 12" },
                { title: "ML Research Associate", apps: "84", date: "Nov 05" }
              ].map((job, i) => (
                <div
                  key={i}
                  onClick={() => setActiveTab('jobs')}
                  className="p-4 rounded-lg bg-surface-container-low/50 hover:bg-surface-container-low transition-colors group cursor-pointer"
                >
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
