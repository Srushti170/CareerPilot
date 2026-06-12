import { cn } from '../../lib/utils';

/**
 * SectionHeader — consistent section title with an optional right-aligned action.
 */
export function SectionHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={cn('flex items-end justify-between gap-4', className)}>
      <div>
        <h3 className="text-xl font-headline font-semibold tracking-tight text-slate-900">{title}</h3>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
