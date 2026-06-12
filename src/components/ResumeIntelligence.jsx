import { motion } from 'motion/react';

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
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-700 ml-1">Paste job description</label>
          <div className="relative">
            <textarea
              className="w-full h-64 p-6 rounded-xl border border-slate-200 bg-white text-slate-600 font-sans text-sm resize-none outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/10"
              placeholder="Enter the role requirements, responsibilities, and qualifications..."
            />
            <div className="absolute top-4 right-4 text-slate-300">
              <span className="material-symbols-outlined">description</span>
            </div>
          </div>
        </div>
        <div className="space-y-3 lg:mt-12">
          <label className="block text-sm font-medium text-slate-700 ml-1">Paste resume text</label>
          <div className="relative">
            <textarea
              className="w-full h-64 p-6 rounded-xl border border-slate-200 bg-white text-slate-600 font-sans text-sm resize-none outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/10"
              placeholder="Paste your resume content or career history here..."
            />
            <div className="absolute top-4 right-4 text-slate-300">
              <span className="material-symbols-outlined">person</span>
            </div>
          </div>
        </div>
        <div className="lg:col-span-2 flex justify-center pt-2">
          <button className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary text-sm font-semibold rounded-xl transition-colors hover:bg-primary-hover focus:outline-none focus:ring-4 focus:ring-primary/10">
            Analyze match
            <span className="material-symbols-outlined text-base">bolt</span>
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 rounded-xl border border-slate-200 bg-white p-8 elev-sm flex flex-col items-center justify-center text-center">
          <div className="relative w-44 h-44 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle className="text-slate-100" cx="88" cy="88" fill="transparent" r="76" stroke="currentColor" strokeWidth="12"></circle>
              <circle className="text-primary" cx="88" cy="88" fill="transparent" r="76" stroke="currentColor" strokeDasharray="477.5" strokeDashoffset="105" strokeWidth="12" strokeLinecap="round"></circle>
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-5xl font-headline font-bold text-slate-900 tracking-tight">78</span>
              <span className="text-[11px] font-medium text-slate-400">Match score</span>
            </div>
          </div>
          <h3 className="mt-6 text-lg font-semibold text-slate-900">Strong candidate</h3>
          <p className="text-sm text-slate-500 mt-1">Your profile significantly aligns with the core requirements.</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-8 elev-sm flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-slate-900">Missing keywords</h3>
            <span className="material-symbols-outlined text-warning">warning</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {missingKeywords.map(kw => (
              <span key={kw} className="inline-flex items-center gap-1 px-2.5 py-1 bg-warning-soft text-warning rounded-md text-xs font-semibold">
                {kw} <span className="material-symbols-outlined text-[14px]">add</span>
              </span>
            ))}
          </div>
          <p className="mt-auto pt-6 text-xs text-slate-400">Adding these naturally increases score by 15%</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-8 elev-sm flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-slate-900">Resume strengths</h3>
            <span className="material-symbols-outlined text-primary">verified</span>
          </div>
          <ul className="space-y-4">
            {strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <div>
                  <span className="block font-semibold text-sm text-slate-900">{s.title}</span>
                  <span className="text-xs text-slate-500 leading-relaxed">{s.desc}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl bg-white p-8 border border-slate-200 border-l-4 border-l-primary elev-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-warning-soft rounded-lg flex items-center justify-center text-warning">
              <span className="material-symbols-outlined">priority_high</span>
            </div>
            <h3 className="text-base font-semibold text-slate-900">Critical improvements</h3>
          </div>
          <div className="space-y-2">
            {[
              "Add quantitative metrics to your results",
              "Expand on 'Agile' methodologies used",
              "Simplify job title for better ATS mapping"
            ].map((item, i) => (
              <div key={i} className="p-4 bg-slate-50 rounded-lg flex justify-between items-center group hover:bg-slate-100 transition-colors cursor-pointer">
                <span className="text-sm font-medium text-slate-700">{item}</span>
                <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">chevron_right</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-white p-8 border border-slate-200 elev-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-on-primary">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            </div>
            <h3 className="text-base font-semibold text-slate-900">AI suggested bullets</h3>
          </div>
          <div className="space-y-4">
            <div className="relative bg-slate-900 text-slate-100 p-6 rounded-xl font-mono text-xs leading-relaxed group">
              <p>"Optimized system performance using <span className="text-primary-soft font-semibold">Python</span>-based automation scripts, resulting in a <span className="text-primary-soft font-semibold">25% reduction</span> in server latency."</p>
              <button className="absolute top-4 right-4 p-2 bg-white/10 rounded-md hover:bg-white/20 transition-colors opacity-0 group-hover:opacity-100">
                <span className="material-symbols-outlined text-xs">content_copy</span>
              </button>
            </div>
            <div className="relative bg-slate-900 text-slate-100 p-6 rounded-xl font-mono text-xs leading-relaxed group">
              <p>"Collaborated within an <span className="text-primary-soft font-semibold">Agile</span> environment to deliver 12+ product features in bi-weekly sprints, ensuring 100% on-time deployment."</p>
              <button className="absolute top-4 right-4 p-2 bg-white/10 rounded-md hover:bg-white/20 transition-colors opacity-0 group-hover:opacity-100">
                <span className="material-symbols-outlined text-xs">content_copy</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="fixed bottom-8 right-8 bg-white rounded-full py-2.5 px-5 elev-md flex items-center gap-2.5 border border-slate-200 z-50">
        <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
        <span className="text-sm font-semibold text-primary">AI engine active</span>
      </div>
    </div>
  );
}
