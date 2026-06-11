import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export function JobCard({ job, onApply, applied, ...rest }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const data = job || rest;
  const company = data.company || '';
  const title = data.title || '';
  const location = data.location || '';
  const match = data.match || 0;
  const type = data.type || 'Full-time';
  const locationType = data.locationType || 'On-site';
  const salary = data.salary || '';
  const missingSkills = data.missingSkills || [];
  const logo = data.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(company)}&background=random`;

  const shortDescription = data.shortDescription || "Join our fast-paced engineering team to build next-generation software products.";
  const description = data.description || [
    "Strong foundation in Computer Science concepts, such as data structures, algorithms, and basic software architecture",
    "Experience or coursework in Software Development and Programming",
    "Understanding of Back-End Web Development, including APIs",
    "Knowledge of Object-Oriented Programming (OOP) principles"
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/5 hover:shadow-md transition-all flex flex-col"
    >
      <div className="flex flex-col gap-4 mb-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-surface-container-high rounded-lg flex items-center justify-center overflow-hidden shrink-0">
            <img src={logo} alt={company} className="w-8 h-8 object-contain" />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-on-surface truncate text-lg">{title}</h4>
            <p className="text-sm text-slate-500 truncate">{company} • {location}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 bg-surface-container-low text-slate-500 text-xs font-bold rounded-full">
            {type}
          </span>
          <span className="px-3 py-1 bg-surface-container-low text-slate-500 text-xs font-bold rounded-full">
            {locationType}
          </span>
          {salary && (
            <span className="px-3 py-1 bg-green-50 text-green-700 border border-green-200 text-xs font-bold rounded-full">
              {salary}
            </span>
          )}
        </div>
      </div>

      <div className="mb-6">
        <p className="text-sm text-slate-700 leading-relaxed font-medium mb-3">
          {shortDescription}
        </p>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-2 pb-4">
                <p className="text-sm text-slate-800 font-bold mb-3">Required Qualifications:</p>
                <ul className="list-disc pl-5 text-sm text-slate-600 space-y-2 mb-6">
                  {description.map((req, i) => (
                    <li key={i}>{req}</li>
                  ))}
                </ul>

                <div className="bg-[linear-gradient(180deg,#020617_0%,#064e3b_100%)] p-6 rounded-2xl flex flex-col items-center justify-center border border-teal-900/30 shadow-inner mb-4">
                  <div className="relative w-28 h-28 mb-4">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-teal-900/50"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <path
                        className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]"
                        strokeDasharray={`${match}, 100`}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white text-3xl font-light tracking-tighter">
                        {match}<span className="text-sm font-bold ml-0.5">%</span>
                      </span>
                    </div>
                  </div>
                  <p className="text-white font-black tracking-widest text-sm uppercase">
                    {match >= 90 ? 'Strong Match' : match >= 75 ? 'Good Match' : 'Fair Match'}
                  </p>
                </div>

                {missingSkills.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Missing Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {missingSkills.map(skill => (
                        <span key={skill} className="text-xs font-bold text-tertiary bg-tertiary/10 px-3 py-1 rounded-md border border-tertiary/20">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-primary text-xs font-bold uppercase tracking-widest hover:underline flex items-center gap-1 mt-2"
        >
          {isExpanded ? 'Show Less' : 'View Full Description'}
          <span className="material-symbols-outlined text-[14px]">
            {isExpanded ? 'expand_less' : 'expand_more'}
          </span>
        </button>
      </div>

      <div className="mt-4 flex gap-3">
        <button
          onClick={applied ? undefined : onApply}
          disabled={applied}
          className={`flex-1 py-3 font-bold rounded-xl text-sm transition-all text-center flex items-center justify-center gap-2 ${applied
              ? "bg-teal-50 text-teal-700 border border-teal-200 cursor-default"
              : "bg-primary text-white shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-95"
            }`}
        >
          {applied ? (
            <>
              <span className="material-symbols-outlined text-sm">check_circle</span>
              Applied
            </>
          ) : "Apply Now"}
        </button>
        <button className="px-6 py-3 font-bold rounded-xl text-sm transition-all border-2 border-primary text-primary hover:bg-primary/5 flex items-center gap-2 active:scale-95">
          <span className="material-symbols-outlined text-sm">auto_awesome</span>
          Tailor Resume
        </button>
      </div>
    </motion.div>
  );
}
