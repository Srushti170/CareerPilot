import { motion } from 'motion/react';
import { Card } from './MetricCard';

export function Profile() {
  const skills = ['React', 'TypeScript', 'Node.js', 'Python', 'AWS', 'Docker', 'System Design'];
  
  return (
    <div className="pt-24 px-8 pb-12 max-w-5xl mx-auto space-y-10">
      <header className="flex flex-col md:flex-row gap-8 items-start md:items-center">
        <div className="relative">
          <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-primary to-primary-container p-1 shadow-2xl">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC42WzyRRM9i-A-ICmV_pg60wrnV6wmP2YNel9d09qWP8QDl2Z5I0UTb-etCnEIu3CR6etIn6A1mvu9hW8Nu905W_iU-v39Jmhr3643oecpxiMi__iNi9fkrb5kxEv150M8m9agiFNGNyqvy1n9Tlo54Czu1umtCZOmVVDeD6ga9MEaDTIFsB23F95vkFtAHieg1w2r4MxiQwjFr6r77oUKzRgPhI45cIwOIef4r0P29jWL9GS1Y_j85DmndrFu8roy5VTB0UHtRB0" 
              className="w-full h-full rounded-[20px] object-cover" 
              alt="Profile" 
            />
          </div>
          <button className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-primary border border-slate-100 hover:scale-110 active:scale-95 transition-transform">
            <span className="material-symbols-outlined text-xl">edit</span>
          </button>
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-black text-on-surface tracking-tight">Alex Rivera</h1>
            <span className="px-3 py-1 bg-secondary-container text-on-secondary-container text-[10px] font-black uppercase rounded-full tracking-widest">Premium Student</span>
          </div>
          <p className="text-lg font-medium text-slate-500 mb-4 italic">Computer Science Senior @ Stanford University</p>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-surface-container-low rounded-xl border border-outline-variant/10">
              <span className="material-symbols-outlined text-primary">location_on</span>
              <span className="text-xs font-bold text-on-surface">Palo Alto, CA</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-surface-container-low rounded-xl border border-outline-variant/10">
              <span className="material-symbols-outlined text-secondary">mail</span>
              <span className="text-xs font-bold text-on-surface">alex.r@stanford.edu</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button className="px-6 py-3 bg-primary text-white font-bold rounded-xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform">Download Resume</button>
          <button className="p-3 bg-surface-container-lowest text-on-surface font-bold rounded-xl border border-outline-variant/20 hover:bg-slate-50 transition-colors">
            <span className="material-symbols-outlined">share</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 space-y-8">
          <section>
            <h3 className="text-xl font-black text-on-surface mb-6 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-primary rounded-full"></span>
              Professional Summary
            </h3>
            <Card className="p-8 leading-relaxed text-slate-600 font-medium">
              Passionate Computer Science student with a strong foundation in full-stack development and artificial intelligence. 
              Experienced in building scalable web applications using React and Node.js. 
              Actively seeking opportunities to contribute to innovative projects and grow as a software engineer.
              Currently focused on LLM integrations and distributed systems.
            </Card>
          </section>

          <section>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-on-surface flex items-center gap-2">
                <span className="w-1.5 h-6 bg-secondary rounded-full"></span>
                Key Skills & Expertise
              </h3>
              <button className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
                <span className="material-symbols-outlined text-sm">add</span> Add Skill
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              {skills.map(skill => (
                <div key={skill} className="px-6 py-3 bg-white rounded-2xl border border-outline-variant/10 shadow-sm hover:shadow-md transition-shadow cursor-default flex items-center gap-2 group">
                  <span className="w-2 h-2 rounded-full bg-primary/30 group-hover:bg-primary transition-colors"></span>
                  <span className="text-sm font-bold text-on-surface">{skill}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
             <h3 className="text-xl font-black text-on-surface mb-6 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-tertiary rounded-full"></span>
              Education
            </h3>
            <Card className="p-0 overflow-hidden">
               <div className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center p-2">
                      <img src="https://upload.wikimedia.org/wikipedia/en/thumb/b/b7/Stanford_University_seal.svg/1200px-Stanford_University_seal.svg.png" alt="Stanford" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-on-surface text-lg">B.S. in Computer Science</h4>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">2020 - 2024</span>
                      </div>
                      <p className="text-primary font-bold text-sm">Stanford University</p>
                      <p className="text-xs text-slate-500 mt-2 font-medium">Major GPA: 3.92/4.00 • Relevant Coursework: Algorithms, Operating Systems, Database Systems, Machine Learning.</p>
                    </div>
                  </div>
               </div>
            </Card>
          </section>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-8">
          <Card className="p-8 bg-gradient-to-br from-slate-900 to-black text-white border-0 shadow-2xl">
            <h3 className="text-xl font-bold mb-6">Profile Strength</h3>
            <div className="relative w-40 h-40 mx-auto mb-8">
              <svg className="w-full h-full -rotate-90">
                <circle cx="80" cy="80" r="70" fill="transparent" stroke="#ffffff10" strokeWidth="12" />
                <circle cx="80" cy="80" r="70" fill="transparent" stroke="url(#gradient-p)" strokeWidth="12" strokeDasharray="440" strokeDashoffset="44" strokeLinecap="round" />
                <defs>
                  <linearGradient id="gradient-p" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#d2e4ff" />
                    <stop offset="100%" stopColor="#2c5ff2" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black">90%</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Excellent</span>
              </div>
            </div>
            <p className="text-center text-slate-400 text-xs font-medium mb-8">Complete the following to reach 100%:</p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-green-400 text-sm">check_circle</span>
                <span className="text-xs font-bold">Verify Github Repos</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-orange-400 text-sm">radio_button_unchecked</span>
                <span className="text-xs font-bold">Add 2 more Recommendations</span>
              </div>
            </div>
            <button className="w-full mt-8 py-3 bg-white text-black font-black rounded-xl text-xs uppercase tracking-widest hover:bg-slate-100 transition-colors">Improve Profile</button>
          </Card>

          <Card className="p-6">
             <h4 className="font-bold text-on-surface mb-6">Social Connections</h4>
             <div className="space-y-4">
               {[
                 { name: 'LinkedIn', connected: true, icon: 'link' },
                 { name: 'GitHub', connected: true, icon: 'code' },
                 { name: 'Portfolio', connected: false, icon: 'language' }
               ].map(social => (
                 <div key={social.name} className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low/50">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-slate-400">{social.icon}</span>
                      <span className="text-sm font-bold text-on-surface">{social.name}</span>
                    </div>
                    {social.connected ? (
                      <span className="material-symbols-outlined text-green-500 text-sm">verified</span>
                    ) : (
                      <button className="text-[10px] font-black text-primary uppercase underline">Connect</button>
                    )}
                 </div>
               ))}
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
