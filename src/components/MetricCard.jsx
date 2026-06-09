import { motion } from 'motion/react';

export function Card({ children, className = "", ...props }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md hover:border-slate-200/80 group ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function MetricCard({ label, value, subtext, progress, color = "primary", icon }) {
  const bgClasses = {
    primary: "bg-primary/5 text-primary",
    secondary: "bg-secondary/5 text-secondary",
    tertiary: "bg-tertiary/5 text-tertiary"
  };

  const isPositiveChange = subtext && (subtext.startsWith('+') || subtext.toLowerCase().includes('active') || subtext.toLowerCase().includes('accepted'));

  return (
    <Card>
      <div className="flex justify-between items-center mb-5">
        {icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bgClasses[color] || 'bg-slate-50 text-slate-600'}`}>
            <span className="material-symbols-outlined text-xl">{icon}</span>
          </div>
        )}
        {progress !== undefined ? (
          <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg">
            {progress}% Rate
          </span>
        ) : subtext && isPositiveChange ? (
          <span className="text-[10px] font-black text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-100 uppercase tracking-wider">
            {subtext}
          </span>
        ) : null}
      </div>

      <div className="space-y-1">
        <h4 className="text-3xl font-black text-slate-800 tracking-tight leading-none">
          {value}
        </h4>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-normal">
          {label}
        </p>
      </div>

      {subtext && !isPositiveChange && (
        <div className="mt-4 pt-3 border-t border-slate-50 flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
          <span>{subtext}</span>
        </div>
      )}
      
      {progress !== undefined && (
        <div className="mt-4 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full rounded-full ${color === 'primary' ? 'bg-primary' : color === 'secondary' ? 'bg-secondary' : 'bg-tertiary'}`}
          />
        </div>
      )}
    </Card>
  );
}
