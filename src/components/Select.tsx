import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  accent?: string;
}

interface SelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  size?: 'sm' | 'md';
  className?: string;
  leadingIcon?: React.ReactNode;
  variant?: 'well' | 'ghost' | 'solid';
}

export const Select: React.FC<SelectProps> = ({
  value,
  options,
  onChange,
  placeholder = 'Select',
  size = 'md',
  className = '',
  leadingIcon,
  variant = 'well'
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', keyHandler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', keyHandler);
    };
  }, []);

  const sizeCls = size === 'sm'
    ? 'h-7 px-2.5 text-[10px] gap-1.5'
    : 'h-8 px-3 text-xs gap-2';

  const variantCls = variant === 'ghost'
    ? 'bg-transparent border-transparent hover:bg-raised/40'
    : variant === 'solid'
    ? 'bg-raised border-line-strong'
    : 'bg-well border-line';

  return (
    <div ref={rootRef} className={`relative inline-flex ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center ${sizeCls} ${className.includes('w-full') ? 'w-full' : ''} rounded-lg border transition-all duration-150 cursor-pointer select-none whitespace-nowrap font-semibold text-ink ${variantCls} ${open ? 'ring-2 ring-accent/40 border-accent/40' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {leadingIcon && <span className="flex-shrink-0 text-ink-3">{leadingIcon}</span>}
        {selected?.accent && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: selected.accent }} />}
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-ink-3 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180 text-accent' : ''}`} />
      </button>

      {open && (
        <div
          className="absolute z-50 mt-1.5 min-w-full w-max max-w-[260px] rounded-xl border border-line-strong overflow-hidden animate-fade-in"
          style={{
            top: '100%',
            left: 0,
            background: 'linear-gradient(180deg, rgba(22,26,40,0.98), rgba(10,12,20,0.98))',
            backdropFilter: 'blur(20px) saturate(160%)',
            boxShadow: '0 18px 40px -8px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05), 0 0 24px -8px rgba(139,92,246,0.25)'
          }}
          role="listbox"
        >
          <div className="max-h-64 overflow-y-auto py-1.5">
            {options.map((opt) => {
              const isActive = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-xs font-medium transition-colors cursor-pointer ${isActive ? 'text-ink bg-accent/10' : 'text-ink-2 hover:text-ink hover:bg-raised/60'}`}
                >
                  {opt.accent && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: opt.accent, boxShadow: `0 0 6px ${opt.accent}` }} />}
                  <span className="flex-1 truncate">{opt.label}</span>
                  {isActive && <Check className="w-3.5 h-3.5 text-accent flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Select;