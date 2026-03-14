import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface SeparatorProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  label?: string;
}

export function Separator({ className, orientation = 'horizontal', label, ...props }: SeparatorProps) {
  if (orientation === 'vertical') {
    return <div className={cn('w-px bg-slate-700/50 self-stretch', className)} {...props} />;
  }

  if (label) {
    return (
      <div className={cn('flex items-center gap-3 my-4', className)} {...props}>
        <div className="flex-1 h-px bg-slate-700/50" />
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</span>
        <div className="flex-1 h-px bg-slate-700/50" />
      </div>
    );
  }

  return <div className={cn('h-px bg-slate-700/50 my-4', className)} {...props} />;
}