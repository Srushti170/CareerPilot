import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from './MetricCard';
import { JobCard } from './JobCard';
import { ResumeIntelligence } from './ResumeIntelligence';

export function JobSearch() {
  const [activeSearchTab, setActiveSearchTab] = useState<'listings' | 'intelligence'>('listings');
  const [searchQuery, setSearchQuery] = useState('');

  const featuredJobs = [
    {
      company: "Google",
      title: "Software Engineer III",
      location: "Mountain View, CA",
      type: "Full-time",
      match: 98,
      salary: "$165k - $220k",
      tags: ["Distributed Systems", "Cloud"],
      missingSkills: ["Go (Golang)"]
    },
    {
      company: "Stripe",
      title: "Frontend Engineer (Payments)",
      location: "Seattle, WA",
      type: "Remote",
      match: 94,
      salary: "$150k - $190k",
      tags: ["React", "Typescript", "Fintech"],
      missingSkills: ["GraphQL"]
    },
    {
       company: "Airbnb",
       title: "Product Designer",
       location: "San Francisco, CA",
       type: "Contract",
       match: 82,
       salary: "$90/hr",
       tags: ["Figma", "Design Systems"],
       missingSkills: ["Framer"]
    }
  ];

  return (
    <div className="pt-24 px-8 pb-12 max-w-7xl mx-auto space-y-8">
      <header className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-4xl font-black text-on-surface tracking-tighter">Opportunities</h2>
          <div className="flex p-1 bg-surface-container-low rounded-xl border border-outline-variant/10">
            <button 
              onClick={() => setActiveSearchTab('listings')}
              className={`px-6 py-2 rounded-lg text-sm font-black uppercase tracking-widest transition-all ${activeSearchTab === 'listings' ? 'bg-white shadow-sm text-primary' : 'text-slate-400 hover:text-on-surface'}`}
            >
              All Listings
            </button>
            <button 
              onClick={() => setActiveSearchTab('intelligence')}
              className={`px-6 py-2 rounded-lg text-sm font-black uppercase tracking-widest transition-all ${activeSearchTab === 'intelligence' ? 'bg-white shadow-sm text-primary' : 'text-slate-400 hover:text-on-surface'}`}
            >
              Resume AI Match
            </button>
          </div>
        </div>

        {activeSearchTab === 'listings' && (
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              <input 
                type="text" 
                placeholder="Search by role, company, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white pl-12 pr-6 py-4 rounded-2xl border-2 border-transparent focus:border-primary/20 focus:ring-0 shadow-sm transition-all text-on-surface font-medium"
              />
            </div>
            <button className="px-6 bg-white rounded-2xl border border-outline-variant/10 flex items-center gap-2 font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
              <span className="material-symbols-outlined">tune</span>
              Filters
            </button>
          </div>
        )}
      </header>

      <AnimatePresence mode="wait">
        {activeSearchTab === 'listings' ? (
          <motion.div 
            key="listings"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-12 gap-8"
          >
            <div className="col-span-12 lg:col-span-8 space-y-6">
              {featuredJobs.map((job, i) => (
                <JobCard key={i} {...job} />
              ))}
              
              <div className="flex justify-center pt-8">
                <button className="px-8 py-3 bg-surface-container-low text-on-surface font-black text-xs uppercase tracking-[0.2em] rounded-full hover:bg-surface-container transition-colors">
                  Load More Results
                </button>
              </div>
            </div>

            <aside className="col-span-12 lg:col-span-4 space-y-6">
              <Card className="p-6 bg-secondary-container/30 border-secondary/10">
                <h3 className="text-xl font-black text-on-secondary-container mb-4 font-headline">Editorial Pick</h3>
                <p className="text-sm font-medium text-slate-600 mb-6 leading-relaxed">
                  Based on your interest in <b>Distributed Systems</b>, we recommend exploring roles at <b>Snowflake</b> this week. They are hiring seniors for their core engine team.
                </p>
                <button className="w-full py-3 bg-secondary text-white font-bold rounded-xl shadow-lg shadow-secondary/20 hover:scale-[1.02] transition-transform">Explore Snowflake Jobs</button>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold text-on-surface mb-6">Trending Skills</h3>
                <div className="space-y-4">
                  {[
                    { name: 'Rust', growth: '+45%', color: 'text-orange-600' },
                    { name: 'PyTorch', growth: '+32%', color: 'text-red-600' },
                    { name: 'Next.js', growth: '+28%', color: 'text-blue-600' },
                    { name: 'K8s', growth: '+15%', color: 'text-cyan-600' }
                  ].map(skill => (
                    <div key={skill.name} className="flex justify-between items-center">
                       <span className="text-sm font-bold text-slate-700">{skill.name}</span>
                       <span className={`text-[10px] font-black ${skill.color}`}>{skill.growth}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </aside>
          </motion.div>
        ) : (
          <motion.div
            key="intelligence"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <ResumeIntelligence />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
