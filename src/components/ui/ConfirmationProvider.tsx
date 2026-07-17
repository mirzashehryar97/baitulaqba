'use client';

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { AlertTriangle, CheckCircle2, X } from 'lucide-react';

import { workSurface } from '@/components/ui/work-surface';

import { cn } from '@/lib/utils';

type ConfirmationVariant = 'default' | 'destructive';

export type ConfirmationInput = {
  cancelLabel?: string;
  confirmLabel?: string;
  description: string;
  title: string;
  variant?: ConfirmationVariant;
};

type ConfirmationState = Required<ConfirmationInput> & {
  resolve: (confirmed: boolean) => void;
};

const ConfirmationContext = createContext<((input: ConfirmationInput) => Promise<boolean>) | null>(
  null,
);

export function ConfirmationProvider({ children }: { children: ReactNode }) {
  const [confirmation, setConfirmation] = useState<ConfirmationState | null>(null);
  const activeResolveRef = useRef<((confirmed: boolean) => void) | null>(null);

  const close = useCallback((confirmed: boolean) => {
    activeResolveRef.current?.(confirmed);
    activeResolveRef.current = null;
    setConfirmation(null);
  }, []);

  const confirm = useCallback(
    (input: ConfirmationInput) =>
      new Promise<boolean>((resolve) => {
        activeResolveRef.current?.(false);
        activeResolveRef.current = resolve;
        setConfirmation({
          cancelLabel: input.cancelLabel ?? 'Cancel',
          confirmLabel: input.confirmLabel ?? 'Confirm',
          description: input.description,
          resolve,
          title: input.title,
          variant: input.variant ?? 'default',
        });
      }),
    [],
  );

  const value = useMemo(() => confirm, [confirm]);

  useEffect(() => {
    if (!confirmation) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [close, confirmation]);

  useEffect(
    () => () => {
      activeResolveRef.current?.(false);
    },
    [],
  );

  return (
    <ConfirmationContext.Provider value={value}>
      {children}
      {confirmation ? <ConfirmationDialog confirmation={confirmation} onClose={close} /> : null}
    </ConfirmationContext.Provider>
  );
}

export function useConfirmation() {
  const confirmation = useContext(ConfirmationContext);

  if (!confirmation) {
    throw new Error('useConfirmation must be used inside ConfirmationProvider.');
  }

  return confirmation;
}

function ConfirmationDialog({
  confirmation,
  onClose,
}: {
  confirmation: ConfirmationState;
  onClose: (confirmed: boolean) => void;
}) {
  const destructive = confirmation.variant === 'destructive';
  const Icon = destructive ? AlertTriangle : CheckCircle2;

  return (
    <div
      aria-modal="true"
      aria-labelledby="confirmation-dialog-title"
      className="fixed inset-0 z-[110] flex items-center justify-center bg-[#0b2f25]/62 p-4 font-sans backdrop-blur-md"
      role="dialog"
    >
      <button
        aria-label="Cancel confirmation"
        className="absolute inset-0 cursor-default"
        onClick={() => onClose(false)}
        type="button"
      />
      <section className="relative w-full max-w-[34rem] overflow-hidden rounded-lg border border-[#dfe5df] bg-white shadow-[0_34px_95px_-42px_rgba(17,24,39,0.85)]">
        <span
          className={cn(
            'absolute inset-x-0 top-0 h-1',
            destructive ? 'bg-red-500' : 'bg-[#006b4f]',
          )}
        />
        <div className="grid grid-cols-[3.5rem_1fr_auto] items-start gap-4 px-6 py-6">
          <span
            className={cn(
              'flex h-14 w-14 shrink-0 items-center justify-center rounded-lg',
              destructive ? workSurface.dangerIcon : workSurface.greenIcon,
            )}
          >
            <Icon className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <h2
              className="text-2xl font-semibold tracking-[-0.02em] text-[#111827]"
              id="confirmation-dialog-title"
            >
              {confirmation.title}
            </h2>
            <p className="mt-2 max-w-[26rem] text-base font-normal leading-7 text-[#5f6b7a]">
              {confirmation.description}
            </p>
          </div>
          <button
            aria-label="Close confirmation"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#6b7280] transition hover:bg-[#f4f6f4] hover:text-[#111827]"
            onClick={() => onClose(false)}
            type="button"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
        <div className="flex flex-col-reverse gap-3 border-t border-[#e5e7eb] bg-[#fbfbfa] px-6 py-5 sm:flex-row sm:justify-end">
          <button
            className={cn(workSurface.secondaryButton, 'h-12 px-6 text-base')}
            onClick={() => onClose(false)}
            type="button"
          >
            {confirmation.cancelLabel}
          </button>
          <button
            className={cn(
              'inline-flex h-12 items-center justify-center rounded-lg border px-6 text-base font-semibold text-white shadow-sm transition',
              destructive
                ? 'border-red-600 bg-red-600 hover:border-red-700 hover:bg-red-700'
                : 'border-[#006b4f] bg-[#006b4f] hover:border-[#07543f] hover:bg-[#07543f]',
            )}
            onClick={() => onClose(true)}
            type="button"
          >
            {confirmation.confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
