import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

/**
 * Card — the standard surface primitive for the app.
 * Flat by default (border + subtle shadow). Pass `hover` to enable a quiet hover lift.
 */
export function Card({ children, className = '', hover = false, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn(
        'rounded-xl border border-slate-200 bg-white p-6 elev-sm transition-colors duration-200',
        hover && 'hover:border-slate-300',
        className,
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
