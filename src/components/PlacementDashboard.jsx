import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, MetricCard } from './MetricCard';

export function PlacementDashboard() {
  const [showModal, setShowModal] = useState(false);
  const [placements] = useState([
    { name: "Arjun Sharma", company: "Microsoft", package: "44.0", dept: "Computer Science", status: "Accepted", initial: "AS" },
    { name: "Priya Das", company: "Goldman Sachs", package: "28.5", dept: "Electronics", status: "Accepted", initial: "PD" },
    { name: "Rohan Kapoor", company: "Adobe", package: "32.0", dept: "Information Tech", status: "Pending Signature", initial: "RK" },
  ]);

  const visits = [
    { name: "TechNexus Solutions", date: "Oct 24, 2026", roles: "CS, IT, ECE", status: "Confirmed", logo: "https://ui-avatars.com/api/?name=TechNexus&background=random" },
    { name: "FinBridge Global", date: "Oct 28, 2026", roles: "All Streams", status: "Interviewing", logo: "https://ui-avatars.com/api/?name=FinBridge&background=random" },
  ];

  // Company registration form states
  const [companyName, setCompanyName] = useState('');
  const [tier, setTier] = useState('Platinum');
  const [hiring, setHiring] = useState(1);
  const [visitsCount, setVisitsCount] = useState(1);

  const handleExportCSV = () => {
    const headers = ['Student Name', 'Company', 'Package (LPA)', 'Department', 'Status'];
    const rows = placements.map(p => [p.name, p.company, p.package, p.dept, p.status]);
    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "careerpilot_placement_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRegisterCompany = (e) => {
    e.preventDefault();
    if (!companyName) return;

    // Load existing corporate partners
    const existing = JSON.parse(localStorage.getItem('careerpilot_companies') || '[]');
    const newPartner = {
      name: companyName,
      tier,
      hiring: Number(hiring),
      visits: Number(visitsCount),
      logo: `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName)}&background=random`
    };

    const updated = [newPartner, ...existing];
    localStorage.setItem('careerpilot_companies', JSON.stringify(updated));

    // Reset forms & close
    setCompanyName('');
    setTier('Platinum');
    setHiring(1);
    setVisitsCount(1);
    setShowModal(false);

    alert(`Successfully registered ${companyName}! You can view it under the Partner Companies tab.`);
  };

  return (
    <div className="pt-24 px-8 pb-12 max-w-7xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
        <div>
          <h3 className="text-3xl font-extrabold font-headline text-on-surface tracking-tight mb-2">Performance Analytics</h3>
          <p className="text-on-surface-variant opacity-80 font-medium">Overview for 2026-2026 Academic Year</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-6 py-3 bg-surface-container-highest text-primary font-bold rounded-xl hover:bg-surface-container-high transition-colors text-xs"
          >
            <span className="material-symbols-outlined text-sm">ios_share</span>
            Export Placement Report
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary-container text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[0.98] transition-transform text-xs"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Register New Company
          </button>
        </div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard label="Companies Registered" value="142" subtext="+12%" color="primary" icon="domain" />
        <MetricCard label="Students Placed" value="842" subtext="Active" color="secondary" icon="person_check" />
        <MetricCard label="Placement Percentage" value="85%" progress={85} color="tertiary" icon="analytics" />
        <MetricCard label="Average Package" value="₹12.4 LPA" subtext="Top package: ₹44.0 LPA" color="primary" icon="payments" />
      </section>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-7 bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/10">
          <div className="flex justify-between items-center mb-8">
            <h5 className="text-xl font-bold font-headline">Upcoming Company Visits</h5>
            <button className="text-primary font-bold text-sm hover:underline">View Calendar</button>
          </div>
          <div className="space-y-6">
            {visits.map((visit, i) => (
              <div key={i} className="flex items-center gap-6 group hover:translate-x-1 transition-transform">
                <div className="h-14 w-14 rounded-xl bg-surface-container flex items-center justify-center p-2">
                  <img src={visit.logo} className="w-full h-full object-contain" alt={visit.name} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h6 className="font-bold text-on-surface">{visit.name}</h6>
                    <span className={`text-xs font-bold py-1 px-3 rounded-full ${visit.status === 'Confirmed' ? 'bg-primary-container/10 text-primary' : 'bg-tertiary-container/10 text-tertiary'
                      }`}>{visit.status}</span>
                  </div>
                  <div className="flex gap-4 text-xs font-medium text-on-surface-variant">
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">calendar_today</span> {visit.date}</span>
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">school</span> {visit.roles}</span>
                  </div>
                </div>
                <button className="p-2 hover:bg-surface-container-low rounded-lg transition-colors">
                  <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5 bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/10">
          <div className="flex justify-between items-center mb-8">
            <h5 className="text-xl font-bold font-headline">Placement Trends</h5>
            <div className="flex gap-2">
              <div className="flex items-center gap-1 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                <span className="h-2 w-2 rounded-full bg-primary"></span> 2026
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-on-surface-variant opacity-40 uppercase tracking-wider">
                <span className="h-2 w-2 rounded-full bg-outline-variant"></span> 2025
              </div>
            </div>
          </div>
          <div className="relative h-64 w-full px-2 mt-4">
            <svg viewBox="0 -10 500 220" className="w-full h-full overflow-visible" preserveAspectRatio="none">
              <defs>
                <linearGradient id="gradient2026" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" className="text-primary" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0" className="text-primary" />
                </linearGradient>
              </defs>
              
              {/* Grid lines */}
              {[0, 50, 100, 150, 200].map(y => (
                <line key={y} x1="0" y1={y} x2="500" y2={y} stroke="currentColor" strokeWidth="1" className="text-outline-variant/20" strokeDasharray="4 4" />
              ))}
              
              {/* 2025 Line */}
              <path 
                d="M 0 140 L 125 100 L 250 80 L 375 40 L 500 90" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="3" 
                className="text-slate-300 drop-shadow-sm" 
              />
              
              {/* 2026 Area */}
              <path 
                d="M 0 120 L 125 70 L 250 30 L 375 0 L 500 60 L 500 200 L 0 200 Z" 
                fill="url(#gradient2026)" 
              />

              {/* 2026 Line */}
              <path 
                d="M 0 120 L 125 70 L 250 30 L 375 0 L 500 60" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="4" 
                className="text-primary drop-shadow-md" 
              />
              
              {/* Points for 2025 */}
              {[
                {x: 0, y: 140}, {x: 125, y: 100}, {x: 250, y: 80}, {x: 375, y: 40}, {x: 500, y: 90}
              ].map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="4" fill="currentColor" className="text-slate-300" />
              ))}

              {/* Points for 2026 */}
              {[
                {x: 0, y: 120}, {x: 125, y: 70}, {x: 250, y: 30}, {x: 375, y: 0}, {x: 500, y: 60}
              ].map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="6" fill="white" stroke="currentColor" strokeWidth="3" className="text-primary" />
              ))}
            </svg>
          </div>
          <div className="flex justify-between px-2 mt-4 text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-tighter relative z-10">
            {['Jul', 'Aug', 'Sep', 'Oct', 'Nov'].map(m => <span key={m}>{m}</span>)}
          </div>
        </div>
      </div>

      <section className="bg-surface-container-lowest rounded-xl overflow-hidden mb-12 border border-outline-variant/10">
        <div className="p-8 flex justify-between items-center">
          <h5 className="text-xl font-bold font-headline">Recent Placements</h5>
          <button className="p-2 rounded-lg hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant">filter_list</span>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant text-[12px] font-bold uppercase tracking-widest">
                <th className="px-8 py-4">Student Name</th>
                <th className="px-8 py-4">Company</th>
                <th className="px-8 py-4 text-right">Package (LPA)</th>
                <th className="px-8 py-4">Department</th>
                <th className="px-8 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low">
              {placements.map((p, i) => (
                <tr key={i} className="hover:bg-surface-container-low/30 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-surface-container text-xs font-bold flex items-center justify-center">{p.initial}</div>
                      <span className="font-bold text-on-surface">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5"><span className="font-medium text-on-surface-variant">{p.company}</span></td>
                  <td className="px-8 py-5 text-right font-bold text-primary">₹{p.package}</td>
                  <td className="px-8 py-5 text-on-surface-variant text-sm">{p.dept}</td>
                  <td className="px-8 py-5">
                    <span className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${p.status === 'Accepted' ? 'bg-primary' : 'bg-slate-400'}`}></span>
                      <span className={`text-sm font-bold ${p.status === 'Accepted' ? 'text-primary' : 'text-slate-500'}`}>{p.status}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Register Company Modal */}
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
                <h3 className="text-xl font-black text-slate-800">Register New Company</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              <form onSubmit={handleRegisterCompany} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Company Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                    placeholder="e.g. Google India"
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Tier</label>
                    <select
                      value={tier}
                      onChange={(e) => setTier(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium"
                    >
                      <option>Platinum</option>
                      <option>Gold</option>
                      <option>Silver</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Open Roles</label>
                    <input
                      type="number"
                      value={hiring}
                      onChange={(e) => setHiring(e.target.value)}
                      required
                      min="1"
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Visits</label>
                    <input
                      type="number"
                      value={visitsCount}
                      onChange={(e) => setVisitsCount(e.target.value)}
                      required
                      min="1"
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
                    Register Company
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
