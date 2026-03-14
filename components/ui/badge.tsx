import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
 
interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'brand';
  dot?: boolean;
}
 
const variants = {
  default: 'bg-slate-700/60 text-slate-300 border-slate-600/40',
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  error:   'bg-red-500/10 text-red-400 border-red-500/30',
  info:    'bg-sky-500/10 text-sky-400 border-sky-500/30',
  brand:   'bg-blue-500/10 text-blue-400 border-blue-500/30',
};
 
export function Badge({ className, variant = 'default', dot, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        variants[variant], className,
      )}
      {...props}
    >
      {dot && (
        <span className={cn(
          'h-1.5 w-1.5 rounded-full flex-shrink-0',
          variant === 'success' ? 'bg-emerald-400' :
          variant === 'warning' ? 'bg-amber-400' :
          variant === 'error'   ? 'bg-red-400' :
          variant === 'info'    ? 'bg-sky-400' :
          variant === 'brand'   ? 'bg-blue-400' :
          'bg-slate-400',
        )} />
      )}
      {children}
    </span>
  );
}