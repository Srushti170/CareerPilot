import { cn } from '../../lib/utils';

const TONES = {
  neutral: 'bg-slate-100 text-slate-600',
  brand: 'bg-primary-soft text-primary',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
};

/**
 * Badge — small status / metadata chip. Quiet by default, semantic tones for state.
 */
export function Badge({ tone = 'neutral', className = '', children, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-semibold',
        TONES[tone] || TONES.neutral,
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
