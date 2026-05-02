import { motion } from 'motion/react';
import { Card } from './MetricCard';

export function StudentRecords() {
  const students = [
    { name: 'Alex Rivera', role: 'Full Stack', cgpa: 3.92, placement: 'Placed (Google)', initial: 'AR' },
    { name: 'Sonia Gupta', role: 'Data Analyst', cgpa: 3.85, placement: 'Placed (Accenture)', initial: 'SG' },
    { name: 'Rahul Dev', role: 'Backend Dev', cgpa: 3.72, placement: 'Open', initial: 'RD' },
    { name: 'Mira Nair', role: 'Designer', cgpa: 3.95, placement: 'In-Process', initial: 'MN' },
  ];

  return (
    <div className="pt-24 px-8 pb-12 max-w-7xl mx-auto space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-on-surface tracking-tighter">Student Registry</h2>
          <p className="text-slate-500 mt-1 font-medium">Monitoring academic and placement progress for 4,200 students.</p>
        </div>
        <div className="flex gap-4">
           <button className="px-6 py-3 bg-surface-container-low text-on-surface font-bold rounded-xl border border-outline-variant/10">Bulk Import</button>
           <button className="px-6 py-3 bg-primary text-white font-black rounded-xl shadow-lg">New Student Entry</button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-4 space-y-6">
           <Card className="p-8">
             <h3 className="font-bold text-on-surface mb-6 uppercase text-xs tracking-widest text-slate-400">Department Stats</h3>
             <div className="space-y-6">
               {[
                 { name: 'Computer Science', count: 1200, placed: 85 },
                 { name: 'Information Tech', count: 850, placed: 72 },
                 { name: 'Electronics', count: 420, placed: 45 }
               ].map(dept => (
                 <div key={dept.name}>
                   <div className="flex justify-between items-center mb-2">
                     <span className="text-sm font-bold text-on-surface">{dept.name}</span>
                     <span className="text-[10px] font-black text-primary">{dept.placed}% Placed</span>
                   </div>
                   <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                     <div className="h-full bg-primary" style={{ width: `${dept.placed}%` }}></div>
                   </div>
                 </div>
               ))}
             </div>
           </Card>
        </div>

        <div className="col-span-12 lg:col-span-8">
          <Card className="p-0 overflow-hidden">
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="bg-surface-container-low/50">
                   <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                   <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Role</th>
                   <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">CGPA</th>
                   <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-outline-variant/10">
                 {students.map(s => (
                   <tr key={s.name} className="hover:bg-slate-50 transition-colors">
                     <td className="px-8 py-5">
                       <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center font-bold text-xs">{s.initial}</div>
                         <span className="font-bold text-on-surface">{s.name}</span>
                       </div>
                     </td>
                     <td className="px-8 py-5 text-sm font-medium text-slate-500">{s.role}</td>
                     <td className="px-8 py-5 text-center font-bold text-slate-700">{s.cgpa}</td>
                     <td className="px-8 py-5">
                       <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                         s.placement.includes('Placed') ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-400'
                       }`}>
                         {s.placement}
                       </span>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </Card>
        </div>
      </div>
    </div>
  );
}
