import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from './ui/utils';

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Auswählen…',
  className = '',
  disabled = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((o) => !o)}
        className={cn(
          'flex h-9 w-full items-center justify-between gap-2 rounded-md border border-border-subtle bg-canvas px-3 text-sm transition-colors',
          'hover:border-border-strong focus:border-accent-500 focus:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-50',
        )}
      >
        <span className={cn('truncate', value ? 'text-text-primary' : 'text-text-muted')}>
          {value || placeholder}
        </span>
        <ChevronDown
          className={cn('size-4 shrink-0 text-text-muted transition-transform', isOpen && 'rotate-180')}
        />
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-md border border-border-subtle bg-elevated shadow-modal">
          <div className="max-h-60 overflow-y-auto p-1">
            {options.map((option) => {
              const selected = value === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors',
                    selected ? 'bg-accent-500/15 text-accent-500' : 'text-text-secondary hover:bg-elevated-hover hover:text-text-primary',
                  )}
                >
                  <span className="truncate">{option}</span>
                  {selected && <Check className="size-4 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
