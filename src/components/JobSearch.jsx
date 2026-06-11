import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from './MetricCard';
import { JobCard } from './JobCard';
import { ResumeIntelligence } from './ResumeIntelligence';

export function JobSearch({ searchQuery = '', setSearchQuery, applications = [], setApplications, setActiveTab }) {
  const [activeSearchTab, setActiveSearchTab] = useState('listings');
  const [localQuery, setLocalQuery] = useState(searchQuery);

  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  const featuredJobs = [
    {
      company: "Google",
      title: "Software Engineer III",
      location: "Mountain View, CA",
      type: "Full-time",
      match: 98,
      salary: "$165k - $220k",
      tags: ["Distributed Systems", "Cloud"],
      logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuC6n9O4Yw1sHm33bnxv42c3Lc__KboJawPt7X0Q7ccBUqzaPBfqbyO3NijginBJ6pnNTcE0_zmA7b1bGoiapK3X6BW-S-8TbXCeAv06XaZs1HCk-oGvvv1g-VLo9cAZjCiqB0aOwe6GDt5BS-e1hdsRwWFNw_UkfrG-HrmWWGQZ8xxzZibnX37QHy3ASKJFheqhCdg0lpHIJRVgXK5s52Z5gSAIq78DMoGGiR60gBtoynaU4cZUm8k_PZT2u6YCkx7jmjC36lPZNho",
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
      logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuCwmqkI3ugEyAnfsIVvXzR8vd1J9f9masmOZDuUcNxM7Pmv5auaHnJq4jqZ5RB7EIjvXQsdKUi2ABBHG3llgUqyEP5yE7D0qP5CkjcWdlKUA7oZBD_Dlw2-p_9z5NlKJZYVCIdL0Vm7HIl-f2boEq24HBF7pJTQqExh8pVkjGr08UsJTHsMsobEApFce94gIcP0x-ewbECTANIIia9-IFVjjnPsCN_GKmKcyFq7ad9D5XaRJsmIF7esEeXyeTEQEeY4oE8nnrrOxvY",
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
      logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuDg5TCxfVEVTwqJBz3K-PoZz7BV9o2AA5pVePpvL0rcQ2qmEXRmFlA0q4xQj7Ledty0tT-oWh2v2MJfW10NJ7T7tBsXlcXcFhkRCegUsSzWpq1n-AwnLT3vxcZslE9dqzR8qr6GivlnTq0nPfj52oIBX2EI5FBBkYXMZKOXFqLvniLWgMp_jvg1z5bBSSGNYbv98_i3eMvUx7ss6vf3rnSI7gZmquBT9kSXD_J-T9MEFc6Y8BfHITPC-q8VBN9vrnEJMIYTTXdwmiA",
      missingSkills: ["Framer"]
    }
  ];

  const handleApply = (job) => {
    const isAlreadyApplied = applications.some(
      app => app.company.toLowerCase() === job.company.toLowerCase() && 
             app.role.toLowerCase() === job.title.toLowerCase()
    );
    if (isAlreadyApplied) return;

    const newApp = {
      id: Date.now().toString(),
      company: job.company,
      role: job.title,
      appliedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      status: 'Applied',
      logo: job.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&background=random`
    };

    setApplications([newApp, ...applications]);
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setLocalQuery(val);
    if (setSearchQuery) {
      setSearchQuery(val);
    }
  };

  const filteredJobs = featuredJobs.filter(job => {
    const q = localQuery.toLowerCase();
    return job.title.toLowerCase().includes(q) || 
           job.company.toLowerCase().includes(q) || 
           job.location.toLowerCase().includes(q) ||
           job.tags.some(tag => tag.toLowerCase().includes(q));
  });

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
                value={localQuery}
                onChange={handleSearchChange}
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
              {filteredJobs.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-outline-variant/10 text-center text-slate-400 font-medium">
                  No jobs match your search query. Try another keyword!
                </div>
              ) : (
                filteredJobs.map((job, i) => {
                  const isApplied = applications.some(
                    app => app.company.toLowerCase() === job.company.toLowerCase() && 
                           app.role.toLowerCase() === job.title.toLowerCase()
                  );
                  return (
                    <JobCard 
                      key={i} 
                      job={job} 
                      applied={isApplied} 
                      onApply={() => handleApply(job)} 
                    />
                  );
                })
              )}
              
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
