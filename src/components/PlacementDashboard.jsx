import { motion } from 'motion/react';
import { Card, MetricCard } from './MetricCard';

export function PlacementDashboard() {
  const placements = [
    { name: "Arjun Sharma", company: "Microsoft", package: "44.0", dept: "Computer Science", status: "Accepted", initial: "AS" },
    { name: "Priya Das", company: "Goldman Sachs", package: "28.5", dept: "Electronics", status: "Accepted", initial: "PD" },
    { name: "Rohan Kapoor", company: "Adobe", package: "32.0", dept: "Information Tech", status: "Pending Signature", initial: "RK" },
  ];

  const visits = [
    { name: "TechNexus Solutions", date: "Oct 24, 2023", roles: "CS, IT, ECE", status: "Confirmed", logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuBSf-YwvPQZjwUV6yeZZrjScJULSYV9F4DLRlpZLuAxvVl-f3C2YCwJ-sUSnwLxB3RgCLhfAeoQ7wD1x52rqjMz5q9zGECap6IhxQtlgZjQ_9jJARVPVQ_Y_cMySXzl8XsX_W86TaWLfgOKwxFkPK0Hi12Exwyhu1C491JvnxnW2wWoXjSkSnAmy039icfg_wDxlCIr2xoys1r1QVx_ydMrvR2s3WYIQuVxt3XQwT5tAhN8y1Sf-Iv83D6V6zsU3a5nir2IDLWycI4" },
    { name: "FinBridge Global", date: "Oct 28, 2023", roles: "All Streams", status: "Interviewing", logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuCOE5WIIgZuOFRVvuImIamfHIA-Efu1X-ArfcVMikFFwGLFRnHHFkYhO-yK4-LrW4GB6oiWN6ZoPBKvVY7s8urcqjPuJGeSse0J44ayQQ1M9_rVErBzSEH5J12UtPLD_wd4SUiJs_0gqjbrWRvcAgNtZYfwdtXVbjdRLKUEiAveqSxlwp0Glqj2A0KDLb0TIj_CKF7yxuPFsRe22zjWV10aUQ1SCCfLIh8zupdlL9hoLMjSfB0d8hSqeTJusv_arWR4BmiJKqYA3hw" },
  ];

  return (
    <div className="pt-24 px-8 pb-12 max-w-7xl mx-auto space-y-10">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h3 className="text-3xl font-extrabold font-headline text-on-surface tracking-tight mb-2">Performance Analytics</h3>
          <p className="text-on-surface-variant opacity-80 font-medium">Overview for 2023-2024 Academic Year</p>
        </div>
        <div className="flex gap-4">
          <button className="flex items-center gap-2 px-6 py-3 bg-surface-container-highest text-primary font-bold rounded-xl hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined">ios_share</span>
            Export Placement Report
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary-container text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[0.98] transition-transform">
            <span className="material-symbols-outlined">add</span>
            Register New Company
          </button>
        </div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard label="Companies Registered" value="142" subtext="+12%" color="primary" icon="domain" />
        <MetricCard label="Students Placed" value="842" subtext="Active" color="secondary" icon="person_check" />
        <div className="bg-surface-container-lowest p-6 rounded-xl relative overflow-hidden group border border-outline-variant/10">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-surface-container-low rounded-lg text-tertiary">
              <span className="material-symbols-outlined">analytics</span>
            </div>
            <div className="h-12 w-12 flex items-center justify-center">
              <svg className="w-full h-full text-tertiary" viewBox="0 0 36 36">
                <path className="stroke-current fill-none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" strokeDasharray="85, 100" strokeWidth="3" />
              </svg>
            </div>
          </div>
          <p className="text-sm font-medium text-on-surface-variant opacity-70 mb-1">Placement Percentage</p>
          <h4 className="text-3xl font-extrabold font-headline">85%</h4>
        </div>
        <MetricCard label="Average Package (LPA)" value="₹12.4" color="primary" icon="payments" />
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
                    <span className={`text-xs font-bold py-1 px-3 rounded-full ${
                      visit.status === 'Confirmed' ? 'bg-primary-container/10 text-primary' : 'bg-tertiary-container/10 text-tertiary'
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
                <span className="h-2 w-2 rounded-full bg-primary"></span> 2023
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-on-surface-variant opacity-40 uppercase tracking-wider">
                <span className="h-2 w-2 rounded-full bg-outline-variant"></span> 2022
              </div>
            </div>
          </div>
          <div className="relative h-64 w-full flex items-end justify-between px-2 gap-4">
             {[40, 65, 85, 100, 70].map((h, i) => (
                <div key={i} className="flex-1 bg-surface-container-low rounded-t-lg relative group" style={{ height: `${h}%` }}>
                  <div className="absolute bottom-0 w-full bg-primary/40 rounded-t-lg" style={{ height: `${90 - (i * 10)}%` }}></div>
                   <div className="absolute bottom-0 w-full bg-primary rounded-t-lg h-[40%] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
             ))}
          </div>
          <div className="flex justify-between px-2 mt-4 text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-tighter">
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
    </div>
  );
}
