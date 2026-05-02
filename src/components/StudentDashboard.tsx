import { MetricCard } from './MetricCard';
import { JobCard } from './JobCard';
import { motion } from 'motion/react';

export function StudentDashboard() {
  const jobs = [
    {
      id: '1',
      title: 'Associate Software Engineer',
      company: 'Google',
      location: 'Mountain View, CA',
      logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC6n9O4Yw1sHm33bnxv42c3Lc__KboJawPt7X0Q7ccBUqzaPBfqbyO3NijginBJ6pnNTcE0_zmA7b1bGoiapK3X6BW-S-8TbXCeAv06XaZs1HCk-oGvvv1g-VLo9cAZjCiqB0aOwe6GDt5BS-e1hdsRwWFNw_UkfrG-HrmWWGQZ8xxzZibnX37QHy3ASKJFheqhCdg0lpHIJRVgXK5s52Z5gSAIq78DMoGGiR60gBtoynaU4cZUm8k_PZT2u6YCkx7jmjC36lPZNho',
      match: 94,
      type: 'New Grad',
      missingSkills: ['GoLang', 'Docker']
    },
    {
      id: '2',
      title: 'Product Design Intern',
      company: 'Spotify',
      location: 'Remote',
      logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDg5TCxfVEVTwqJBz3K-PoZz7BV9o2AA5pVePpvL0rcQ2qmEXRmFlA0q4xQj7Ledty0tT-oWh2v2MJfW10NJ7T7tBsXlcXcFhkRCegUsSzWpq1n-AwnLT3vxcZslE9dqzR8qr6GivlnTq0nPfj52oIBX2EI5FBBkYXMZKOXFqLvniLWgMp_jvg1z5bBSSGNYbv98_i3eMvUx7ss6vf3rnSI7gZmquBT9kSXD_J-T9MEFc6Y8BfHITPC-q8VBN9vrnEJMIYTTXdwmiA',
      match: 88,
      type: 'Internship',
      missingSkills: ['Prototyping']
    }
  ];

  const actions = [
    { title: "Improve your Resume", desc: "Add your recent Hackathon project.", progress: 90, icon: "edit_document", color: "primary" },
    { title: "Mock Interview", desc: "Practice System Design concepts.", progress: 45, icon: "interpreter_mode", color: "secondary" },
    { title: "Apply to 3 Jobs", desc: "Hit your weekly application target.", progress: 33, icon: "send", color: "tertiary" },
  ];

  return (
    <div className="pt-24 px-8 pb-12 max-w-7xl mx-auto space-y-10">
      <section>
        <motion.h2 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-3xl font-extrabold tracking-tighter text-on-surface"
        >
          Welcome back, Alex! <span className="text-primary-container">Ready for the next loop?</span>
        </motion.h2>
        <p className="text-slate-500 mt-1">You have 2 upcoming interviews this week. Let's get prepared.</p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard label="Resume Score" value="82/100" subtext="You're 8% away from top candidates" progress={82} icon="trending_up" color="primary" />
        <MetricCard label="Job Match Avg" value="76%" subtext="Strong fit for Frontend roles" progress={76} icon="check_circle" color="secondary" />
        <MetricCard label="Interview Ready" value="Intermediate" subtext="3 mock tests recommended" progress={60} icon="warning" color="tertiary" />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <section className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold tracking-tight">Recommended for You</h3>
            <button className="text-primary text-sm font-semibold hover:underline">View All</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {jobs.map(job => <JobCard key={job.id} {...job} />)}
          </div>
        </section>

        <section className="space-y-6">
          <h3 className="text-xl font-bold tracking-tight">Next Best Actions</h3>
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/5 space-y-5">
            {actions.map((action, i) => (
              <div key={i} className="flex gap-4 group">
                <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  action.color === 'primary' ? 'bg-primary/10 text-primary' : 
                  action.color === 'secondary' ? 'bg-secondary/10 text-secondary' : 'bg-tertiary/10 text-tertiary'
                }`}>
                  <span className="material-symbols-outlined text-sm">{action.icon}</span>
                </div>
                <div className="flex-1 border-b border-slate-100 pb-4 last:border-0">
                  <p className="text-sm font-bold text-on-surface">{action.title}</p>
                  <p className="text-xs text-slate-500 mb-2">{action.desc}</p>
                  <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${action.progress}%` }}
                      className={`h-full ${
                        action.color === 'primary' ? 'bg-primary' : 
                        action.color === 'secondary' ? 'bg-secondary' : 'bg-tertiary'
                      }`} 
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold tracking-tight">Active Trackers</h3>
          <div className="flex gap-2">
            <button className="p-2 bg-white rounded-lg shadow-sm border border-outline-variant/10 hover:bg-slate-50 transition-colors">
              <span className="material-symbols-outlined text-slate-500">chevron_left</span>
            </button>
            <button className="p-2 bg-white rounded-lg shadow-sm border border-outline-variant/10 hover:bg-slate-50 transition-colors">
              <span className="material-symbols-outlined text-slate-500">chevron_right</span>
            </button>
          </div>
        </div>
        
        <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-outline-variant/5">
          <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-950 rounded-lg flex items-center justify-center overflow-hidden">
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCwmqkI3ugEyAnfsIVvXzR8vd1J9f9masmOZDuUcNxM7Pmv5auaHnJq4jqZ5RB7EIjvXQsdKUi2ABBHG3llgUqyEP5yE7D0qP5CkjcWdlKUA7oZBD_Dlw2-p_9z5NlKJZYVCIdL0Vm7HIl-f2boEq24HBF7pJTQqExh8pVkjGr08UsJTHsMsobEApFce94gIcP0x-ewbECTANIIia9-IFVjjnPsCN_GKmKcyFq7ad9D5XaRJsmIF7esEeXyeTEQEeY4oE8nnrrOxvY" className="w-7 h-7 object-contain" alt="Stripe" />
              </div>
              <div>
                <h4 className="font-bold">Software Engineer Intern</h4>
                <p className="text-xs text-slate-500">Stripe • San Francisco, CA</p>
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-xs text-slate-400 font-bold uppercase mb-1">Status</p>
              <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-full uppercase tracking-widest">Interview Stage</span>
            </div>
          </div>

          <div className="relative pt-4 overflow-x-auto">
            <div className="min-w-[600px] px-8">
              <div className="absolute top-[48px] left-[calc(12.5%+32px)] right-[calc(12.5%+32px)] h-1 bg-surface-container z-0"></div>
              <div className="absolute top-[48px] left-[calc(12.5%+32px)] w-[37.5%] h-1 bg-primary z-0"></div>
              
              <div className="relative z-10 flex justify-between items-center">
                {[
                  { label: "Applied", date: "Oct 12, 2023", active: true, done: true, icon: "check" },
                  { label: "Shortlisted", date: "Oct 15, 2023", active: true, done: true, icon: "check" },
                  { label: "Interview", date: "Tomorrow, 10 AM", active: true, current: true, icon: "schedule" },
                  { label: "Offer", date: "Pending", icon: "celebration" },
                  { label: "Decision", date: "--", icon: "cancel" }
                ].map((step, i) => (
                  <div key={i} className={`flex flex-col items-center gap-2 ${!step.active ? 'opacity-30' : ''}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all ${
                      step.done ? 'bg-primary text-white shadow-primary/20' : 
                      step.current ? 'bg-white border-2 border-primary text-primary animate-pulse' : 'bg-surface-container text-slate-400'
                    }`}>
                      <span className="material-symbols-outlined" style={step.done ? { fontVariationSettings: "'FILL' 1" } : {}}>{step.icon}</span>
                    </div>
                    <div className="text-center">
                      <p className={`text-xs font-bold ${step.current ? 'text-primary' : 'text-on-surface'}`}>{step.label}</p>
                      <p className={`text-[10px] ${step.current ? 'text-primary-container font-semibold' : 'text-slate-400'}`}>{step.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
