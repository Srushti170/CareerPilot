import { motion } from 'motion/react';
import { Card } from './ui/Card';

// Re-exported so existing imports of `{ Card }` from this module keep working.
export { Card };

export function MetricCard({ label, value, subtext, progress, color = "primary", icon }) {
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
    <Card hover className="p-6">
      <div className="mb-5 flex items-center justify-between">
        {icon && (
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconClasses[color] || 'bg-slate-100 text-slate-600'}`}>
            <span className="material-symbols-outlined text-xl">{icon}</span>
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

      <div className="space-y-1">
        <h4 className="text-3xl font-headline font-bold leading-none tracking-tight text-slate-900">
          {value}
        </h4>
        <p className="text-sm font-medium text-slate-500">
          {label}
        </p>
      </div>

      {subtext && !isPositiveChange && (
        <p className="mt-3 text-sm leading-5 text-slate-400">
          {subtext}
        </p>
      )}

      {progress !== undefined && (
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
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
