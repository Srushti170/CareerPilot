import { motion } from 'motion/react';
import { Card } from './MetricCard';
import { cn } from '../lib/utils';

export function Candidates() {
  const candidates = [
    { id: '1', name: 'James Wilson', role: 'Full Stack Engineer', university: 'UC Berkeley', match: 96, status: 'Interviewing', avatar: 'https://i.pravatar.cc/100?img=12' },
    { id: '2', name: 'Elena Rodriguez', role: 'Data Scientist', university: 'Stanford', match: 92, status: 'Shortlisted', avatar: 'https://i.pravatar.cc/100?img=25' },
    { id: '3', name: 'Kevin Park', role: 'DevOps Engineer', university: 'Georgia Tech', match: 89, status: 'On Hold', avatar: 'https://i.pravatar.cc/100?img=33' },
    { id: '4', name: 'Sophia Lee', role: 'Product Manager', university: 'MIT', match: 85, status: 'New Applied', avatar: 'https://i.pravatar.cc/100?img=47' },
  ];

  return (
    <div className="pt-24 px-8 pb-12 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-on-surface tracking-tighter">Unified Talent Pool</h2>
          <p className="text-slate-500 mt-1 font-medium">Access over 2,400 verified student profiles from partner universities.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-surface-container-low text-on-surface font-bold rounded-xl border border-outline-variant/10 hover:bg-slate-50 transition-colors">
            <span className="material-symbols-outlined text-xl">filter_list</span>
            Filters
          </button>
          <button className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform">
            <span className="material-symbols-outlined text-xl">person_search</span>
            Search Talent
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Candidates', value: '2.4k', icon: 'groups' },
          { label: 'Waitlisted', value: '450', icon: 'hourglass_empty' },
          { label: 'Top 10% Match', value: '240', icon: 'stars' },
          { label: 'Scheduled Today', value: '18', icon: 'calendar_month' }
        ].map(m => (
          <Card key={m.label} className="p-4 flex items-center gap-4">
             <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
               <span className="material-symbols-outlined text-2xl">{m.icon}</span>
             </div>
             <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{m.label}</p>
               <h4 className="text-xl font-black text-on-surface leading-none">{m.value}</h4>
             </div>
          </Card>
        ))}
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Candidate Name</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Role</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">University</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Score</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {candidates.map(can => (
                <tr key={can.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <img src={can.avatar} className="w-10 h-10 rounded-xl object-cover" alt={can.name} />
                      <span className="font-bold text-on-surface">{can.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-sm font-medium text-slate-600">{can.role}</td>
                  <td className="px-8 py-5 text-sm font-medium text-slate-600">{can.university}</td>
                  <td className="px-8 py-5">
                    <div className="flex items-center justify-center">
                      <div className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-black">
                        {can.match}%
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={cn(
                      "px-3 py-1 text-[10px] font-black uppercase rounded-full",
                      can.status === 'Interviewing' ? 'bg-purple-50 text-purple-600' :
                      can.status === 'Shortlisted' ? 'bg-blue-50 text-blue-600' :
                      can.status === 'On Hold' ? 'bg-orange-50 text-orange-600' : 'bg-slate-100 text-slate-400'
                    )}>
                      {can.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button className="material-symbols-outlined text-slate-300 hover:text-primary transition-colors cursor-pointer">more_vert</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
