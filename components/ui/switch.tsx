'use client';
import { cn } from '@/lib/utils';

interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export function Switch({ checked = false, onCheckedChange, disabled, label, className }: SwitchProps) {
  return (
    <label className={cn('inline-flex items-center gap-3 cursor-pointer', disabled && 'opacity-50 cursor-not-allowed', className)}>
      <button
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onCheckedChange?.(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200',
          checked ? 'bg-blue-600' : 'bg-slate-600',
        )}
      >
        <span className={cn(
          'inline-block h-4 w-4 rounded-full bg-white transition-transform duration-200 shadow-sm',
          checked ? 'translate-x-6' : 'translate-x-1',
        )} />
      </button>
      {label && <span className="text-sm text-slate-300">{label}</span>}
    </label>
  );
}