import { motion } from 'motion/react';
import { Card } from './MetricCard';

export function ResumeIntelligence() {
  const missingKeywords = ["Python", "Agile", "System Design", "AWS", "CI/CD"];
  const strengths = [
    { title: "Clear Formatting", desc: "ATS parsers can read your structural hierarchy easily." },
    { title: "Relevant Experience", desc: "Past 3 years of work align with the JD intent." },
    { title: "Header Clarity", desc: "Contact info and title are properly indexed." },
  ];

  return (
    <div className="pt-24 px-8 pb-12 max-w-6xl mx-auto space-y-10">
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-4">
          <label className="block text-sm font-semibold text-on-surface ml-1">Paste Job Description</label>
          <div className="relative group">
            <textarea 
              className="w-full h-64 p-6 rounded-xl border-none bg-surface-container-low focus:ring-2 focus:ring-primary/20 text-on-surface-variant font-sans resize-none editorial-shadow transition-all" 
              placeholder="Enter the role requirements, responsibilities, and qualifications..."
            />
            <div className="absolute top-4 right-4 text-primary opacity-20">
              <span className="material-symbols-outlined">description</span>
            </div>
          </div>
        </div>
        <div className="space-y-4 lg:mt-12">
          <label className="block text-sm font-semibold text-on-surface ml-1">Paste Resume Text</label>
          <div className="relative group">
            <textarea 
              className="w-full h-64 p-6 rounded-xl border-none bg-surface-container-low focus:ring-2 focus:ring-primary/20 text-on-surface-variant font-sans resize-none editorial-shadow transition-all" 
              placeholder="Paste your resume content or career history here..."
            />
            <div className="absolute top-4 right-4 text-primary opacity-20">
              <span className="material-symbols-outlined">person</span>
            </div>
          </div>
        </div>
        <div className="lg:col-span-2 flex justify-center pt-4">
          <button className="px-12 py-4 bg-gradient-to-r from-primary to-primary-container text-white text-lg font-bold rounded-full shadow-2xl hover:scale-105 transition-transform duration-200 flex items-center gap-3">
            Analyze Match
            <span className="material-symbols-outlined">bolt</span>
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 bg-surface-container-lowest rounded-xl p-8 editorial-shadow flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="relative w-48 h-48 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle className="text-surface-container-high" cx="96" cy="96" fill="transparent" r="80" stroke="currentColor" strokeWidth="12"></circle>
              <circle className="text-primary" cx="96" cy="96" fill="transparent" r="80" stroke="currentColor" strokeDasharray="502.6" strokeDashoffset="110" strokeWidth="12"></circle>
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-5xl font-extrabold text-on-surface tracking-tighter">78</span>
              <span className="text-xs font-bold uppercase text-slate-400">Match Score</span>
            </div>
          </div>
          <h3 className="mt-6 text-xl font-bold text-on-surface">Strong Candidate</h3>
          <p className="text-sm text-slate-500 mt-2">Your profile significantly aligns with the core requirements.</p>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-8 editorial-shadow flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-on-surface">Missing Keywords</h3>
            <span className="material-symbols-outlined text-tertiary">warning</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {missingKeywords.map(kw => (
              <span key={kw} className="px-4 py-2 bg-tertiary-container/10 text-tertiary rounded-lg text-sm font-semibold flex items-center gap-2">
                {kw} <span className="material-symbols-outlined text-xs">add</span>
              </span>
            ))}
          </div>
          <p className="mt-auto pt-6 text-xs text-slate-400 italic">Adding these naturally increases score by 15%</p>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-8 editorial-shadow flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-on-surface">Resume Strengths</h3>
            <span className="material-symbols-outlined text-primary">verified</span>
          </div>
          <ul className="space-y-4">
            {strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <div>
                  <span className="block font-semibold text-sm">{s.title}</span>
                  <span className="text-xs text-slate-500 leading-relaxed">{s.desc}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-surface-container-low rounded-xl p-8 border-l-4 border-primary">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-tertiary shadow-sm">
              <span className="material-symbols-outlined">priority_high</span>
            </div>
            <h3 className="text-xl font-bold text-on-surface">Critical Improvements</h3>
          </div>
          <div className="space-y-3">
            {[
              "Add quantitative metrics to your results",
              "Expand on 'Agile' methodologies used",
              "Simplify job title for better ATS mapping"
            ].map((item, i) => (
              <div key={i} className="p-4 bg-white/50 rounded-lg flex justify-between items-center group hover:bg-white transition-colors cursor-pointer">
                <span className="text-sm font-medium">{item}</span>
                <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">chevron_right</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface-container-low rounded-xl p-8 relative overflow-hidden">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white shadow-sm">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            </div>
            <h3 className="text-xl font-bold text-on-surface">AI Suggested Bullets</h3>
          </div>
          <div className="space-y-4">
            <div className="relative bg-slate-900 text-teal-100 p-6 rounded-xl font-mono text-xs leading-relaxed group">
              <p>"Optimized system performance using <span className="text-primary-fixed font-bold">Python</span>-based automation scripts, resulting in a <span className="text-primary-fixed font-bold">25% reduction</span> in server latency."</p>
              <button className="absolute top-4 right-4 p-2 bg-white/10 rounded-md hover:bg-white/20 transition-colors opacity-0 group-hover:opacity-100">
                <span className="material-symbols-outlined text-xs">content_copy</span>
              </button>
            </div>
            <div className="relative bg-slate-900 text-teal-100 p-6 rounded-xl font-mono text-xs leading-relaxed group">
              <p>"Collaborated within an <span className="text-primary-fixed font-bold">Agile</span> environment to deliver 12+ product features in bi-weekly sprints, ensuring 100% on-time deployment."</p>
              <button className="absolute top-4 right-4 p-2 bg-white/10 rounded-md hover:bg-white/20 transition-colors opacity-0 group-hover:opacity-100">
                <span className="material-symbols-outlined text-xs">content_copy</span>
              </button>
            </div>
          </div>
        </div>
      </section>
      
      <div className="fixed bottom-8 right-8 bg-surface-container-lowest rounded-full py-3 px-6 shadow-2xl flex items-center gap-3 ring-1 ring-primary/10 z-50">
        <div className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse"></div>
        <span className="text-sm font-bold text-primary">AI Engine Active</span>
      </div>
    </div>
  );
}
