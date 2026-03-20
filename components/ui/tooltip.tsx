'use client';
import { createContext, useContext, useState, HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

const TooltipProviderContext = createContext<boolean>(true);

export function TooltipProvider({ children }: { children: ReactNode }) {
  return <TooltipProviderContext.Provider value={true}>{children}</TooltipProviderContext.Provider>;
}

const TooltipContext = createContext<{ open: boolean; setOpen: (o: boolean) => void }>({ open: false, setOpen: () => {} });

export function Tooltip({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <TooltipContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-flex">{children}</div>
    </TooltipContext.Provider>
  );
}

export function TooltipTrigger({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const { setOpen } = useContext(TooltipContext);
  return (
    <div
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      className={className}
      {...props}
    >
      {children}
    </div>
  );
}

export function TooltipContent({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const { open } = useContext(TooltipContext);
  if (!open) return null;
  return (
    <div className={cn(
      'absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50',
      'px-3 py-1.5 rounded-lg bg-slate-700 border border-slate-600 text-xs text-slate-200',
      'shadow-lg whitespace-nowrap animate-fade-in', className,
    )} {...props}>
      {children}
    </div>
  );
}