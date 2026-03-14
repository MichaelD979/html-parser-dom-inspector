import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
 
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}
 
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-slate-300">
          {label}
          {props.required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <input
        ref={ref}
        className={cn(
          'w-full rounded-xl border bg-slate-900/60 px-3.5 py-2.5 text-sm text-slate-100',
          'placeholder:text-slate-500 transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          error
            ? 'border-red-500/50 focus:ring-red-500'
            : 'border-slate-700 hover:border-slate-600',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  )
);
Input.displayName = 'Input';