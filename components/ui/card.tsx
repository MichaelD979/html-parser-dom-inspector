import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
 
interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
}
 
export function Card({ className, glow, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm',
        'transition-all duration-200',
        glow && 'hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/10',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
 
export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-6 py-4 border-b border-slate-700/50', className)} {...props}>
      {children}
    </div>
  );
}
 
export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-lg font-semibold text-slate-100', className)} {...props}>
      {children}
    </h3>
  );
}
 
export function CardContent({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-6 py-4', className)} {...props}>
      {children}
    </div>
  );
}