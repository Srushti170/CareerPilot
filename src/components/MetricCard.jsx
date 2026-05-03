import { motion } from 'motion/react';

export function Card({ children, className = "", ...props }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10 relative overflow-hidden group ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function MetricCard({ label, value, subtext, progress, color = "primary", icon }) {
  const colorClass = {
    primary: "text-primary bg-primary",
    secondary: "text-secondary bg-secondary",
    tertiary: "text-tertiary bg-tertiary"
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-opacity-5 rounded-full group-hover:scale-110 transition-transform flex items-center justify-center pointer-events-none">
        <div className={`w-full h-full ${color === 'primary' ? 'bg-primary' : color === 'secondary' ? 'bg-secondary' : 'bg-tertiary'} opacity-5 rounded-full`}></div>
      </div>
      <div className="flex justify-between items-start mb-4">
        <span className="text-slate-500 font-semibold text-xs uppercase tracking-widest">{label}</span>
        <span className={`font-black text-2xl ${color === 'primary' ? 'text-primary' : color === 'secondary' ? 'text-secondary' : 'text-tertiary'}`}>
          {value}
        </span>
      </div>
      {progress !== undefined && (
        <div className="w-full bg-surface-container-high h-3 rounded-full mb-3">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-3 rounded-full relative ${color === 'primary' ? 'bg-primary' : color === 'secondary' ? 'bg-secondary' : 'bg-tertiary'}`}
          >
            {color === 'primary' && progress > 80 && (
              <div className="absolute right-0 top-0 h-3 w-3 bg-white rounded-full border-2 border-primary animate-pulse"></div>
            )}
          </motion.div>
        </div>
      )}
      {subtext && (
        <p className="text-[11px] text-slate-500 flex items-center gap-1">
          {icon && <span className="material-symbols-outlined text-sm">{icon}</span>}
          {subtext}
        </p>
      )}
    </Card>
  );
}
