'use client';

import {
  createContext,
  type ElementType,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { AlertTriangle, CheckCircle2, Info, LoaderCircle, X } from 'lucide-react';

import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'info' | 'loading';

type ToastInput = {
  description?: string;
  durationMs?: number;
  title: string;
  type?: ToastType;
};

type ToastItem = Required<Pick<ToastInput, 'title' | 'type'>> &
  Pick<ToastInput, 'description'> & {
    id: string;
  };

const toastStyles: Record<
  ToastType,
  {
    accentClassName: string;
    descriptionClassName: string;
    icon: ElementType;
    iconClassName: string;
    iconWrapClassName: string;
    ringClassName: string;
    titleClassName: string;
  }
> = {
  error: {
    accentClassName: 'bg-[#ef4444]',
    descriptionClassName: 'text-[#7f1d1d]/78',
    icon: AlertTriangle,
    iconClassName: 'text-[#dc2626]',
    iconWrapClassName: 'bg-[#fee2e2]',
    ringClassName: 'border-[#f3a6a6] bg-[#fff1f1]',
    titleClassName: 'text-[#991b1b]',
  },
  info: {
    accentClassName: 'bg-emerald-deep',
    descriptionClassName: 'text-ink/72',
    icon: Info,
    iconClassName: 'text-emerald-deep',
    iconWrapClassName: 'bg-emerald/10',
    ringClassName: 'border-emerald/20 bg-emerald/8',
    titleClassName: 'text-emerald-deep',
  },
  loading: {
    accentClassName: 'bg-gold',
    descriptionClassName: 'text-ink/72',
    icon: LoaderCircle,
    iconClassName: 'animate-spin text-gold-deep',
    iconWrapClassName: 'bg-gold/14',
    ringClassName: 'border-gold/25 bg-gold/10',
    titleClassName: 'text-gold-deep',
  },
  success: {
    accentClassName: 'bg-[#16a34a]',
    descriptionClassName: 'text-[#14532d]/78',
    icon: CheckCircle2,
    iconClassName: 'text-[#0f7a3d]',
    iconWrapClassName: 'bg-[#d8f0e0]',
    ringClassName: 'border-[#91c9a5] bg-[#edf8f1]',
    titleClassName: 'text-[#075f32]',
  },
};

const ToastContext = createContext<((toast: ToastInput) => string) | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismissToast = useCallback((id: string) => {
    const timer = timers.current.get(id);

    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }

    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ description, durationMs = 5000, title, type = 'info' }: ToastInput) => {
      const id = crypto.randomUUID();

      setToasts((current) => [
        {
          description,
          id,
          title,
          type,
        },
        ...current,
      ]);

      if (durationMs > 0) {
        const timer = setTimeout(() => dismissToast(id), durationMs);
        timers.current.set(id, timer);
      }

      return id;
    },
    [dismissToast],
  );

  const value = useMemo(() => showToast, [showToast]);

  useEffect(() => {
    const currentTimers = timers.current;

    return () => {
      currentTimers.forEach((timer) => clearTimeout(timer));
      currentTimers.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3 sm:right-6 sm:top-6"
      >
        {toasts.map((toast) => (
          <ToastCard key={toast.id} onDismiss={() => dismissToast(toast.id)} toast={toast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const toast = useContext(ToastContext);

  if (!toast) {
    throw new Error('useToast must be used inside ToastProvider.');
  }

  return toast;
}

function ToastCard({ onDismiss, toast }: { onDismiss: () => void; toast: ToastItem }) {
  const style = toastStyles[toast.type];
  const Icon = style.icon;

  return (
    <div
      className={cn(
        'pointer-events-auto relative overflow-hidden rounded-xl border shadow-[0_22px_60px_-28px_rgba(7,39,29,0.55)] backdrop-blur',
        style.ringClassName,
      )}
      role={toast.type === 'error' ? 'alert' : 'status'}
    >
      <span className={cn('absolute inset-y-0 left-0 w-1', style.accentClassName)} />
      <div className="flex gap-3 p-4">
        <span
          className={cn(
            'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
            style.iconWrapClassName,
          )}
        >
          <Icon className={cn('h-5 w-5', style.iconClassName)} />
        </span>
        <div className="min-w-0 flex-1">
          <p className={cn('text-sm font-black', style.titleClassName)}>{toast.title}</p>
          {toast.description ? (
            <p
              className={cn(
                'mt-1 text-sm font-semibold leading-relaxed',
                style.descriptionClassName,
              )}
            >
              {toast.description}
            </p>
          ) : null}
        </div>
        <button
          aria-label="Dismiss notification"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink/58 transition hover:bg-white hover:text-emerald-deep"
          onClick={onDismiss}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
