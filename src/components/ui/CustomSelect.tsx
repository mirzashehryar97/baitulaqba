'use client';

import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';

import { Check, ChevronDown } from 'lucide-react';
import { createPortal } from 'react-dom';

import { cn } from '@/lib/utils';

export type CustomSelectOption = {
  disabled?: boolean;
  label: string;
  value: string;
};

type NativeOptionProps = {
  children?: React.ReactNode;
  disabled?: boolean;
  value?: string | number;
};

export function CustomSelect({
  ariaLabel,
  children,
  className,
  disabled = false,
  menuClassName,
  onChange,
  options,
  triggerClassName,
  value,
}: {
  ariaLabel?: string;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  menuClassName?: string;
  onChange: (value: string) => void;
  options?: CustomSelectOption[];
  triggerClassName?: string;
  value: string;
}) {
  const generatedId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ left: 0, top: 0, width: 0 });

  const parsedOptions = useMemo(
    () => options ?? parseOptionChildren(children),
    [children, options],
  );
  const selectedOption =
    parsedOptions.find((option) => option.value === value) ?? parsedOptions[0] ?? null;

  const updateMenuPosition = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();

    if (!rect) {
      return;
    }

    const viewportPadding = 12;
    const maxWidth = Math.max(window.innerWidth - viewportPadding * 2, 0);
    const width = Math.min(rect.width, maxWidth);
    const left = Math.min(
      Math.max(rect.left, viewportPadding),
      Math.max(window.innerWidth - width - viewportPadding, viewportPadding),
    );

    setMenuPosition({
      left,
      top: rect.bottom + 6,
      width,
    });
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    updateMenuPosition();

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;

      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }

      setOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, updateMenuPosition]);

  return (
    <div className={cn('relative min-w-0', className)}>
      <button
        aria-controls={open ? generatedId : undefined}
        aria-expanded={open}
        aria-label={ariaLabel}
        className={cn(
          'flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-emerald/10 bg-white px-3 text-left text-sm font-bold text-ink/76 outline-none transition hover:border-gold/35 focus:border-gold focus:ring-4 focus:ring-gold/15 disabled:cursor-not-allowed disabled:bg-cream/70 disabled:text-ink/55',
          'min-w-0 max-w-full',
          triggerClassName,
        )}
        data-custom-select-trigger="true"
        disabled={disabled}
        onClick={() => {
          updateMenuPosition();
          setOpen((current) => !current);
        }}
        ref={triggerRef}
        type="button"
      >
        <span className="block min-w-0 truncate">{selectedOption?.label ?? 'Select'}</span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-ink/62 transition', open ? 'rotate-180' : '')}
        />
      </button>

      {mounted && open
        ? createPortal(
            <div
              className={cn(
                'fixed z-[120] max-h-72 overflow-auto rounded-xl border border-gold/24 bg-white p-1.5 shadow-[0_22px_55px_-28px_rgba(7,39,29,0.7)]',
                menuClassName,
              )}
              id={generatedId}
              ref={menuRef}
              role="listbox"
              style={{
                left: menuPosition.left,
                minWidth: menuPosition.width,
                top: menuPosition.top,
                width: menuPosition.width,
              }}
            >
              {parsedOptions.map((option) => {
                const selected = option.value === value;

                return (
                  <button
                    aria-selected={selected}
                    className={cn(
                      'flex min-h-9 w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-bold text-emerald-deep outline-none transition hover:bg-gold/12 focus:bg-gold/12 disabled:cursor-not-allowed disabled:opacity-45',
                      selected ? 'bg-gold/18 text-emerald-deepest' : '',
                    )}
                    disabled={option.disabled}
                    key={option.value}
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                      triggerRef.current?.focus();
                    }}
                    role="option"
                    type="button"
                  >
                    <Check
                      className={cn(
                        'h-4 w-4 shrink-0 text-gold',
                        selected ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <span className="block min-w-0 truncate">{option.label}</span>
                  </button>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function parseOptionChildren(children: React.ReactNode) {
  return Children.toArray(children)
    .filter(isValidElement)
    .map((child) => {
      const props = child.props as NativeOptionProps;
      const value = props.value === undefined ? optionLabel(props.children) : String(props.value);

      return {
        disabled: props.disabled,
        label: optionLabel(props.children),
        value,
      };
    });
}

function optionLabel(children: React.ReactNode) {
  return Children.toArray(children).join('');
}
