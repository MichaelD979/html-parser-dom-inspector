'use client';
import { createContext, useContext, useState, useEffect, HTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

const DialogContext = createContext<{ open: boolean; setOpen: (o: boolean) => void }>({ open: false, setOpen: () => {} });

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

export function Dialog({ open: controlledOpen, onOpenChange, children }: DialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (v: boolean) => { setInternalOpen(v); onOpenChange?.(v); };

  return (
    <DialogContext.Provider value={{ open, setOpen }}>
      {children}
    </DialogContext.Provider>
  );
}

export function DialogTrigger({ children, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = useContext(DialogContext);
  return <button onClick={() => setOpen(true)} className={className} {...props}>{children}</button>;
}

export function DialogContent({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const { open, setOpen } = useContext(DialogContext);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, setOpen]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className={cn(
        'relative z-10 w-full max-w-lg rounded-2xl border border-slate-700/50 bg-slate-800 p-6 shadow-2xl',
        'animate-fade-in', className,
      )} {...props}>
        <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-4', className)} {...props}>{children}</div>;
}

export function DialogTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('text-lg font-semibold text-white', className)} {...props}>{children}</h2>;
}

export function DialogDescription({ className, children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-slate-400 mt-1', className)} {...props}>{children}</p>;
}