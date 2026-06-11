import { motion } from 'motion/react';

export function JobCard({ job, onApply, applied, ...rest }) {
  const data = job || rest;
  const company = data.company || '';
  const title = data.title || '';
  const location = data.location || '';
  const match = data.match || 0;
  const type = data.type || 'Full-time';
  const missingSkills = data.missingSkills || [];
  const logo = data.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(company)}&background=random`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/5 hover:shadow-md transition-all h-full flex flex-col"
    >
      <div className="flex items-center gap-4 mb-5">
        <div className="w-12 h-12 bg-surface-container-high rounded-lg flex items-center justify-center overflow-hidden shrink-0">
          <img src={logo} alt={company} className="w-8 h-8 object-contain" />
        </div>
        <div className="min-w-0">
          <h4 className="font-bold text-on-surface truncate">{title}</h4>
          <p className="text-xs text-slate-500 truncate">{company} • {location}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="px-3 py-1 bg-secondary-container/20 text-secondary text-[10px] font-bold rounded-full border border-secondary/10">
          {match}% Match
        </span>
        <span className="px-3 py-1 bg-surface-container-low text-slate-500 text-[10px] font-bold rounded-full">
          {type}
        </span>
      </div>

      <div className="mb-6">
        <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Missing Skills</p>
        <div className="flex flex-wrap gap-2">
          {missingSkills.map(skill => (
            <span key={skill} className="text-xs text-tertiary bg-tertiary-container/10 px-2 py-0.5 rounded border border-tertiary/10">
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-auto">
        <button 
          onClick={applied ? undefined : onApply}
          disabled={applied}
          className={`w-full py-2.5 font-bold rounded-lg text-sm transition-all text-center flex items-center justify-center gap-1 ${
            applied 
              ? "bg-teal-50 text-teal-700 border border-teal-200 cursor-default" 
              : "bg-primary text-white hover:opacity-90 active:scale-95"
          }`}
        >
          {applied ? (
            <>
              <span className="material-symbols-outlined text-sm">check_circle</span>
              Applied
            </>
          ) : "Apply Now"}
        </button>
      </div>
    </motion.div>
  );
}
