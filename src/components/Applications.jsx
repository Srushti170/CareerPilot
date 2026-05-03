import { motion } from 'motion/react';
import { Card } from './MetricCard';
import { cn } from '../lib/utils';

export function Applications() {
  const apps = [
    {
      id: '1',
      company: 'Google',
      role: 'Software Engineer Intern',
      appliedDate: 'Oct 12, 2023',
      status: 'Interview',
      logo: 'https://lh3.googleusercontent.com/COxitqShpfWnID95S3Y3KruvRPWzihth9659E7V9N0V_2SOn6P_Sthp6Q-fKbeV97-E=w170'
    },
    {
      id: '2',
      company: 'Amazon',
      role: 'AWS Cloud Support',
      appliedDate: 'Oct 05, 2023',
      status: 'Reviewing',
      logo: 'https://lh3.googleusercontent.com/proxy/N7m0I6Y_9_u9_6_r_Y_9_6_r_Y_9_6_r_Y_9_6_r_Y_9_6_r_Y_9_6_r_Y_9_6_r_Y_9_6_r_Y_9_6_r_Y_9_6_r_Y_9_6_r_Y_9_6_r_Y_9_6_r_Y_9_6_r_Y_9_6_r_Y_9_6_r_Y_9_6_r_Y_9_6_r_Y'
    },
    {
      id: '3',
      company: 'Meta',
      role: 'Frontend Developer',
      appliedDate: 'Sep 28, 2023',
      status: 'Rejected',
      logo: 'https://lh3.googleusercontent.com/proxy/z7_y_y_y_y_y_y_y_y_y_y_y_y_y_y_y_y_y_y_y_y_y_y_y_y_y_y_y_y_y_y_y_y_y_y_y_y_y_y_y_y_y_y_y_y_y_y_y_y_y_y_y_y_y_y'
    }
  ];

  // Fix broken logos with generic ones if needed, but I'll use placeholders
  const getLogo = (app) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(app.company)}&background=random&size=128`;
  };

  const statusColors = {
    'Reviewing': 'bg-blue-50 text-blue-600 border-blue-100',
    'Interview': 'bg-purple-50 text-purple-600 border-purple-100',
    'Offered': 'bg-green-50 text-green-600 border-green-100',
    'Rejected': 'bg-red-50 text-red-600 border-red-100',
    'Applied': 'bg-slate-50 text-slate-600 border-slate-100',
  };

  return (
    <div className="pt-24 px-8 pb-12 max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-on-surface tracking-tight">Active Applications</h2>
          <p className="text-slate-500 mt-2">Track your progress across 8 ongoing recruitment cycles.</p>
        </div>
        <div className="flex gap-4">
          <div className="flex -space-x-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="avatar" />
              </div>
            ))}
            <div className="w-8 h-8 rounded-full border-2 border-white bg-primary text-white text-[10px] font-bold flex items-center justify-center">+4</div>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {apps.map((app, index) => (
          <motion.div
            key={app.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-all group overflow-hidden">
              <div className="flex items-center gap-6 p-4">
                <div className="w-16 h-16 rounded-2xl bg-surface-container-low flex items-center justify-center p-3">
                  <img src={getLogo(app)} className="w-full h-full object-contain" alt={app.company} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-on-surface truncate tracking-tight">{app.role}</h3>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider",
                      statusColors[app.status] ?? 'bg-slate-50 text-slate-600 border-slate-100'
                    )}>
                      {app.status}
                    </span>                  </div>
                  <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">domain</span>
                      {app.company}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">event</span>
                      Applied on {app.appliedDate}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
                    Withdraw
                  </button>
                  <button className="px-6 py-2 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/10 hover:shadow-primary/25 transition-all">
                    View Details
                  </button>
                </div>
              </div>

              {/* Timeline Preview */}
              <div className="bg-surface-container-low/30 px-6 py-3 flex items-center justify-between border-t border-outline-variant/5">
                <div className="flex items-center gap-8">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <span className="text-[10px] font-bold text-on-surface uppercase opacity-60">Technical Round</span>
                  </div>
                  <div className="flex items-center gap-2 opacity-30">
                    <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                    <span className="text-[10px] font-bold text-on-surface uppercase tracking-tight">HR Discussion</span>
                  </div>
                </div>
                <div className="text-[10px] font-black text-primary uppercase tracking-widest cursor-pointer hover:underline">
                  View Full Timeline →
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
