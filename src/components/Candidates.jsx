import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from './ui/Card';
import { cn } from '../lib/utils';

const selectClass = "w-full bg-white border border-slate-200 rounded-lg text-xs font-medium p-2.5 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 cursor-pointer transition-colors";

export function Candidates() {
  const [candidates, setCandidates] = useState(() => {
    const stored = localStorage.getItem('careerpilot_candidates_pool');
    if (stored) return JSON.parse(stored);

    const defaults = [
      { id: '1', name: 'James Wilson', role: 'Full Stack Engineer', university: 'UC Berkeley', match: 96, status: 'Interviewing', avatar: 'https://i.pravatar.cc/100?img=12' },
      { id: '2', name: 'Elena Rodriguez', role: 'Data Scientist', university: 'Stanford', match: 92, status: 'Shortlisted', avatar: 'https://i.pravatar.cc/100?img=25' },
      { id: '3', name: 'Kevin Park', role: 'DevOps Engineer', university: 'Georgia Tech', match: 89, status: 'On Hold', avatar: 'https://i.pravatar.cc/100?img=33' },
      { id: '4', name: 'Sophia Lee', role: 'Product Manager', university: 'MIT', match: 85, status: 'New Applied', avatar: 'https://i.pravatar.cc/100?img=47' },
    ];
    localStorage.setItem('careerpilot_candidates_pool', JSON.stringify(defaults));
    return defaults;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [filterUni, setFilterUni] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [minScore, setMinScore] = useState('All');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleStatusChange = (id, newStatus) => {
    const updated = candidates.map(c => c.id === id ? { ...c, status: newStatus } : c);
    setCandidates(updated);
    localStorage.setItem('careerpilot_candidates_pool', JSON.stringify(updated));
  };

  const handleExportCSV = () => {
    const headers = ['Candidate Name', 'Target Role', 'University', 'Match Score', 'Status'];
    const rows = filteredCandidates.map(c => [c.name, c.role, c.university, `${c.match}%`, c.status]);
    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "careerpilot_talent_pool.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredCandidates = candidates.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.university.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterRole !== 'All' && c.role !== filterRole) return false;
    if (filterUni !== 'All' && c.university !== filterUni) return false;
    if (filterStatus !== 'All' && c.status !== filterStatus) return false;
    if (minScore !== 'All' && c.match < parseInt(minScore)) return false;

    return true;
  });

  return (
    <div className="pt-24 px-8 pb-12 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-headline font-semibold text-slate-900 tracking-tight">Unified talent pool</h2>
          <p className="text-slate-500 mt-1 text-sm">Access verified student profiles from partner universities.</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate, role, or college..."
              className="w-full bg-white pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-colors"
            />
          </div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1.5 px-4 py-2.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-sm">tune</span>
            {showAdvanced ? 'Hide filters' : 'Filters'}
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-on-primary font-semibold text-sm rounded-lg hover:bg-primary-hover transition-colors"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Export CSV
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-white p-6 rounded-xl border border-slate-200 elev-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4"
          >
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Target role</label>
              <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className={selectClass}>
                <option value="All">All roles</option>
                <option value="Full Stack Engineer">Full Stack Engineer</option>
                <option value="Data Scientist">Data Scientist</option>
                <option value="DevOps Engineer">DevOps Engineer</option>
                <option value="Product Manager">Product Manager</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">University</label>
              <select value={filterUni} onChange={(e) => setFilterUni(e.target.value)} className={selectClass}>
                <option value="All">All colleges</option>
                <option value="Stanford">Stanford</option>
                <option value="MIT">MIT</option>
                <option value="UC Berkeley">UC Berkeley</option>
                <option value="Georgia Tech">Georgia Tech</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Status</label>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={selectClass}>
                <option value="All">All statuses</option>
                <option value="New Applied">New Applied</option>
                <option value="Shortlisted">Shortlisted</option>
                <option value="Interviewing">Interviewing</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Min match score</label>
              <select value={minScore} onChange={(e) => setMinScore(e.target.value)} className={selectClass}>
                <option value="All">Any score</option>
                <option value="95">95%+</option>
                <option value="90">90%+</option>
                <option value="85">85%+</option>
              </select>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total candidates', value: '2,400', icon: 'groups' },
          { label: 'Waitlisted', value: candidates.filter(c => c.status === 'On Hold').length.toString(), icon: 'hourglass_empty' },
          { label: 'Top 10% match', value: candidates.filter(c => c.match >= 90).length.toString(), icon: 'stars' },
          { label: 'Interviewing', value: candidates.filter(c => c.status === 'Interviewing').length.toString(), icon: 'calendar_month' }
        ].map(m => (
          <Card key={m.label} className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary-soft flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-2xl">{m.icon}</span>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 leading-none mb-1">{m.label}</p>
              <h4 className="text-xl font-headline font-bold text-slate-900 leading-none">{m.value}</h4>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-8 py-4 text-[11px] font-semibold text-slate-500">Candidate name</th>
                <th className="px-8 py-4 text-[11px] font-semibold text-slate-500">Target role</th>
                <th className="px-8 py-4 text-[11px] font-semibold text-slate-500">University</th>
                <th className="px-8 py-4 text-[11px] font-semibold text-slate-500 text-center">Score</th>
                <th className="px-8 py-4 text-[11px] font-semibold text-slate-500">Status / action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-8 py-10 text-center text-slate-400 text-sm">No candidates match search/filter requirements.</td>
                </tr>
              ) : (
                filteredCandidates.map(can => (
                  <tr key={can.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-4">
                        <img src={can.avatar} className="w-10 h-10 rounded-lg object-cover border border-slate-200" alt={can.name} />
                        <span className="font-semibold text-slate-900">{can.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-4 text-sm text-slate-600">{can.role}</td>
                    <td className="px-8 py-4 text-sm text-slate-600">{can.university}</td>
                    <td className="px-8 py-4">
                      <div className="flex items-center justify-center">
                        <div className="px-2.5 py-1 bg-success-soft text-success rounded-md text-xs font-semibold">
                          {can.match}%
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <select
                        value={can.status}
                        onChange={(e) => handleStatusChange(can.id, e.target.value)}
                        className={cn(
                          "px-3 py-1.5 text-[11px] font-semibold rounded-md border-none outline-none focus:ring-4 focus:ring-primary/10 cursor-pointer",
                          can.status === 'Interviewing' ? 'bg-primary-soft text-primary' :
                          can.status === 'Shortlisted' ? 'bg-primary-soft text-primary' :
                          can.status === 'On Hold' ? 'bg-warning-soft text-warning' : 'bg-slate-100 text-slate-500'
                        )}
                      >
                        <option value="New Applied">New Applied</option>
                        <option value="Shortlisted">Shortlisted</option>
                        <option value="Interviewing">Interviewing</option>
                        <option value="On Hold">On Hold</option>
                        <option value="Offered">Offered</option>
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
  );
}
