import { motion } from 'motion/react';

export interface JobProps {
  id?: string;
  title: string;
  company: string;
  location: string;
  logo?: string;
  match: number;
  type: string;
  missingSkills: string[];
  salary?: string;
  tags?: string[];
  key?: any;
}

export function JobCard(job: JobProps) {
  const logo = job.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&background=random`;
  
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/5 hover:shadow-md transition-all h-full flex flex-col"
    >
      <div className="flex items-center gap-4 mb-5">
        <div className="w-12 h-12 bg-surface-container-high rounded-lg flex items-center justify-center overflow-hidden shrink-0">
          <img src={logo} alt={job.company} className="w-8 h-8 object-contain" />
        </div>
        <div className="min-w-0">
          <h4 className="font-bold text-on-surface truncate">{job.title}</h4>
          <p className="text-xs text-slate-500 truncate">{job.company} • {job.location}</p>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="px-3 py-1 bg-secondary-container/20 text-secondary text-[10px] font-bold rounded-full border border-secondary/10">
          {job.match}% Match
        </span>
        <span className="px-3 py-1 bg-surface-container-low text-slate-500 text-[10px] font-bold rounded-full">
          {job.type}
        </span>
      </div>

      <div className="mb-6">
        <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Missing Skills</p>
        <div className="flex flex-wrap gap-2">
          {job.missingSkills.map(skill => (
            <span key={skill} className="text-xs text-tertiary bg-tertiary-container/10 px-2 py-0.5 rounded border border-tertiary/10">
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-auto">
        <button className="w-full py-2.5 bg-primary text-white font-bold rounded-lg text-sm hover:opacity-90 active:scale-95 transition-all">
          Apply Now
        </button>
      </div>
    </motion.div>
  );
}
