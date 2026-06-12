import { cn } from '../../lib/utils';

const VARIANTS = {
  primary: 'bg-primary text-on-primary hover:bg-primary-hover',
  secondary: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  soft: 'bg-primary-soft text-primary hover:bg-primary-soft/70',
};

const SIZES = {
  sm: 'px-3 py-2 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-sm',
};

/**
 * Button — single source of truth for CTA styling.
 * Flat, brand-forward, no scale gimmicks. Focus ring uses brand color.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  className = '',
  children,
  ...props
}) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors duration-200',
        'focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:cursor-default disabled:opacity-70',
        VARIANTS[variant] || VARIANTS.primary,
        SIZES[size] || SIZES.md,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
