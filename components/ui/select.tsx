'use client';
import { createContext, useContext, useState, useRef, useEffect, HTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

const SelectContext = createContext<{
  value: string;
  onValueChange: (v: string) => void;
  open: boolean;
  setOpen: (o: boolean) => void;
}>({ value: '', onValueChange: () => {}, open: false, setOpen: () => {} });

interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
}

export function Select({ value: controlledValue, defaultValue = '', onValueChange, children }: SelectProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const value = controlledValue ?? internalValue;

  const handleChange = (v: string) => {
    setInternalValue(v);
    onValueChange?.(v);
    setOpen(false);
  };

  return (
    <SelectContext.Provider value={{ value, onValueChange: handleChange, open, setOpen }}>
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({ children, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { open, setOpen } = useContext(SelectContext);
  return (
    <button
      onClick={() => setOpen(!open)}
      className={cn(
        'flex items-center justify-between w-full rounded-xl border border-slate-700 bg-slate-900/60',
        'px-3.5 py-2.5 text-sm text-slate-100 hover:border-slate-600 transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-blue-500',
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform', open && 'rotate-180')} />
    </button>
  );
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const { value } = useContext(SelectContext);
  return <span className={cn(!value && 'text-slate-500')}>{value || placeholder || 'Select...'}</span>;
}

export function SelectContent({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const { open, setOpen } = useContext(SelectContext);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.parentElement?.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, setOpen]);

  if (!open) return null;
  return (
    <div ref={ref} className={cn(
      'absolute z-50 mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 py-1 shadow-lg',
      'animate-fade-in', className,
    )} {...props}>
      {children}
    </div>
  );
}

interface SelectItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export function SelectItem({ value, children, className, ...props }: SelectItemProps) {
  const { value: selected, onValueChange } = useContext(SelectContext);
  return (
    <button
      onClick={() => onValueChange(value)}
      className={cn(
        'w-full text-left px-3.5 py-2 text-sm transition-colors',
        selected === value ? 'text-blue-400 bg-blue-500/10' : 'text-slate-300 hover:bg-slate-700/50',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}