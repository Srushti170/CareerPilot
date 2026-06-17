import { motion } from 'motion/react';
import { Card } from './ui/Card';

// Re-exported so existing imports of `{ Card }` from this module keep working.
export { Card };

export function MetricCard({ label, value, subtext, progress, color = "primary", icon, compact = false }) {
  const iconClasses = {
    primary: "bg-primary-soft text-primary",
    secondary: "bg-primary-soft text-primary",
    tertiary: "bg-warning-soft text-warning",
  };

  const fillClasses = {
    primary: "bg-primary",
    secondary: "bg-primary",
    tertiary: "bg-warning",
  };

  const isPositiveChange = subtext && (subtext.startsWith('+') || subtext.toLowerCase().includes('active') || subtext.toLowerCase().includes('accepted'));

  return (
    <Card hover className={compact ? "p-5" : "p-6"}>
      <div className={`${compact ? 'mb-4' : 'mb-5'} flex items-center justify-between`}>
        {icon && (
          <div className={`flex ${compact ? 'h-9 w-9 rounded-md' : 'h-10 w-10 rounded-lg'} shrink-0 items-center justify-center ${iconClasses[color] || 'bg-slate-100 text-slate-600'}`}>
            <span className={`material-symbols-outlined ${compact ? 'text-lg' : 'text-xl'}`}>{icon}</span>
          </div>
        )}
        {progress !== undefined ? (
          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
            {progress}% rate
          </span>
        ) : subtext && isPositiveChange ? (
          <span className="rounded-md bg-success-soft px-2.5 py-1 text-[11px] font-semibold text-success">
            {subtext}
          </span>
        ) : null}
      </div>

      <div className={compact ? "space-y-0.5" : "space-y-1"}>
        <h4 className={`${compact ? 'text-2xl' : 'text-3xl'} font-headline font-bold leading-none tracking-tight text-slate-900`}>
          {value}
        </h4>
        <p className={`${compact ? 'text-[15px]' : 'text-sm'} font-medium text-slate-500`}>
          {label}
        </p>
      </div>

      {subtext && !isPositiveChange && (
        <p className={`${compact ? 'mt-2 text-[13px] leading-5' : 'mt-3 text-sm leading-5'} text-slate-400`}>
          {subtext}
        </p>
      )}

      {progress !== undefined && (
        <div className={`${compact ? 'mt-3' : 'mt-4'} h-1.5 w-full overflow-hidden rounded-full bg-slate-100`}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className={`h-full rounded-full ${fillClasses[color] || 'bg-primary'}`}
          />
        </div>
      )}
    </Card>
  );
}
