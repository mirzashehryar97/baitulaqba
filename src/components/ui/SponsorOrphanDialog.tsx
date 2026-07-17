'use client';

import { type FormEvent, useEffect, useId, useRef, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import {
  Check,
  HeartHandshake,
  LoaderCircle,
  Lock,
  Mail,
  MapPin,
  MessageSquareText,
  PenLine,
  Phone,
  Send,
  User,
  X,
} from 'lucide-react';

import { BrandMark } from '@/components/ui/BrandMark';
import { SponsorLampSuccessAnimation } from '@/components/ui/SponsorLampSuccessAnimation';

import { cn } from '@/lib/utils';

type FormValues = {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  contactMethod: string;
  message: string;
  confirmedMinimum: boolean;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const defaultValues: FormValues = {
  fullName: '',
  email: '',
  phone: '',
  city: '',
  contactMethod: 'whatsapp',
  message: '',
  confirmedMinimum: false,
};

const contactMethods = [
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquareText },
  { value: 'phone', label: 'Phone Call', icon: Phone },
  { value: 'email', label: 'Email', icon: Mail },
];

function validateForm(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!values.fullName.trim()) {
    errors.fullName = 'Please enter your full name.';
  }

  if (!values.email.trim()) {
    errors.email = 'Please enter your email address.';
  } else if (!emailPattern.test(values.email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!values.phone.trim()) {
    errors.phone = 'Please enter your phone or WhatsApp number.';
  }

  if (!values.confirmedMinimum) {
    errors.confirmedMinimum = 'Please confirm the Rs. 36,000/- monthly minimum.';
  }

  return errors;
}

function FieldIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/65">
      {children}
    </span>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;

  return (
    <p className="mt-2 text-sm font-medium text-red-700" id={id} role="alert">
      {message}
    </p>
  );
}

export function SponsorOrphanDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [values, setValues] = useState<FormValues>(defaultValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const submitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const closeModal = () => {
    onOpenChange(false);
    window.setTimeout(() => {
      setValues(defaultValues);
      setErrors({});
      setSubmitError(null);
      setIsSubmitting(false);
      setIsSubmitted(false);
    }, 180);
  };

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeModal();
        return;
      }

      if (event.key !== 'Tab' || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );

      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    return () => {
      if (submitTimerRef.current) {
        clearTimeout(submitTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!open || !isSubmitted) return;

    requestAnimationFrame(() => {
      panelRef.current?.scrollTo({ top: 0, behavior: 'auto' });
    });
  }, [open, isSubmitted]);

  const updateValue = <Key extends keyof FormValues>(key: Key, value: FormValues[Key]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setSubmitError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateForm(values);
    setErrors(nextErrors);
    setSubmitError(null);

    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);

    try {
      const [response] = await Promise.all([
        fetch('/api/sponsorship-requests', {
          body: JSON.stringify({
            fullName: values.fullName,
            email: values.email,
            phone: values.phone,
            cityCountry: values.city,
            preferredContactMethod: values.contactMethod,
            message: values.message,
            confirmedMinimumAmount: values.confirmedMinimum,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
        }),
        new Promise((resolve) => window.setTimeout(resolve, 500)),
      ]);

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setSubmitError(body?.error ?? 'Could not submit your request. Please try again.');
        return;
      }

      setIsSubmitted(true);
    } catch {
      setSubmitError('Could not submit your request. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          animate={{ opacity: 1 }}
          aria-describedby={descriptionId}
          aria-labelledby={titleId}
          aria-modal="true"
          className="fixed inset-0 z-[999] flex items-center justify-center overflow-hidden bg-emerald-deepest/78 px-3 py-4 backdrop-blur-sm sm:px-5 sm:py-8"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onMouseDown={closeModal}
          role="dialog"
          transition={{ duration: 0.18 }}
        >
          <motion.div
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={cn(
              'relative max-h-[calc(100svh-2rem)] w-full max-w-5xl overflow-y-auto rounded-[1.75rem] border p-5 shadow-[0_28px_90px_-32px_rgba(0,0,0,0.65)] sm:max-h-[calc(100svh-4rem)] sm:p-8',
              isSubmitted
                ? 'border-gold/20 bg-black sm:p-6 lg:p-7'
                : 'border-gold/15 bg-offwhite lg:p-12',
            )}
            exit={{ opacity: 0, scale: 0.98, y: 12 }}
            initial={{ opacity: 0, scale: 0.98, y: 18 }}
            onMouseDown={(event) => event.stopPropagation()}
            ref={panelRef}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              aria-label="Close sponsorship form"
              className={cn(
                'absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border shadow-soft transition-colors',
                isSubmitted
                  ? 'border-gold/35 bg-gold/10 text-gold-soft hover:border-gold/70 hover:bg-gold/18 hover:text-cream-soft'
                  : 'border-emerald/10 bg-white/80 text-ink hover:border-gold/50 hover:text-emerald-deep',
              )}
              onClick={closeModal}
              ref={closeButtonRef}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>

            <AnimatePresence mode="wait">
              {isSubmitted ? (
                <SponsorLampSuccessAnimation
                  descriptionId={descriptionId}
                  key="success"
                  titleId={titleId}
                />
              ) : (
                <SponsorForm
                  descriptionId={descriptionId}
                  errors={errors}
                  isSubmitting={isSubmitting}
                  key="form"
                  onSubmit={handleSubmit}
                  onUpdate={updateValue}
                  submitError={submitError}
                  titleId={titleId}
                  values={values}
                />
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function SponsorForm({
  values,
  errors,
  isSubmitting,
  submitError,
  titleId,
  descriptionId,
  onUpdate,
  onSubmit,
}: {
  values: FormValues;
  errors: FormErrors;
  isSubmitting: boolean;
  submitError: string | null;
  titleId: string;
  descriptionId: string;
  onUpdate: <Key extends keyof FormValues>(key: Key, value: FormValues[Key]) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const fullNameErrorId = `${titleId}-full-name-error`;
  const emailErrorId = `${titleId}-email-error`;
  const phoneErrorId = `${titleId}-phone-error`;
  const confirmErrorId = `${titleId}-confirm-error`;

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      initial={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2 }}
    >
      <div className="mx-auto max-w-3xl text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-gold/25 bg-cream-soft p-2 shadow-soft">
          <BrandMark className="h-full w-full" />
        </div>
        <h2
          className="mt-5 font-display text-4xl font-semibold leading-none text-emerald-deep sm:text-5xl lg:text-6xl"
          id={titleId}
        >
          Sponsor an Orphan in Gaza
        </h2>
        <p
          className="mx-auto mt-4 max-w-2xl text-base font-medium leading-relaxed text-ink/70 sm:text-lg"
          id={descriptionId}
        >
          Fill out the form below and our team will contact you shortly with verified orphan
          profiles from Gaza.
        </p>
      </div>

      <div className="mx-auto mt-7 flex max-w-3xl gap-4 rounded-2xl border border-gold/30 bg-cream/35 p-4 sm:items-center sm:p-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold text-gold-deep">
          <HeartHandshake className="h-6 w-6" />
        </div>
        <div>
          <p className="text-base font-bold text-ink sm:text-lg">
            Minimum sponsorship amount: Rs. 36,000/- per month
          </p>
          <p className="mt-1 text-sm leading-relaxed text-ink/65 sm:text-base">
            This monthly support helps cover the child&apos;s essential needs, care, education and
            family support.
          </p>
        </div>
      </div>

      <form className="mt-7 space-y-5" noValidate onSubmit={onSubmit}>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-bold text-ink sm:text-base">
              Full Name <span className="text-red-700">*</span>
            </span>
            <span className="relative mt-2 block">
              <FieldIcon>
                <User className="h-5 w-5" />
              </FieldIcon>
              <input
                aria-describedby={errors.fullName ? fullNameErrorId : undefined}
                aria-invalid={Boolean(errors.fullName)}
                className={cn(
                  'h-14 w-full rounded-lg border bg-white/75 pl-14 pr-4 text-sm font-medium text-ink outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/15',
                  errors.fullName ? 'border-red-700' : 'border-emerald/15',
                )}
                onChange={(event) => onUpdate('fullName', event.target.value)}
                placeholder="Enter your full name"
                type="text"
                value={values.fullName}
              />
            </span>
            <FieldError id={fullNameErrorId} message={errors.fullName} />
          </label>

          <label className="block">
            <span className="text-sm font-bold text-ink sm:text-base">
              Email Address <span className="text-red-700">*</span>
            </span>
            <span className="relative mt-2 block">
              <FieldIcon>
                <Mail className="h-5 w-5" />
              </FieldIcon>
              <input
                aria-describedby={errors.email ? emailErrorId : undefined}
                aria-invalid={Boolean(errors.email)}
                className={cn(
                  'h-14 w-full rounded-lg border bg-white/75 pl-14 pr-4 text-sm font-medium text-ink outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/15',
                  errors.email ? 'border-red-700' : 'border-emerald/15',
                )}
                onChange={(event) => onUpdate('email', event.target.value)}
                placeholder="Enter your email address"
                type="email"
                value={values.email}
              />
            </span>
            <FieldError id={emailErrorId} message={errors.email} />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-bold text-ink sm:text-base">
            Phone / WhatsApp Number <span className="text-red-700">*</span>
          </span>
          <span className="relative mt-2 block">
            <FieldIcon>
              <Phone className="h-5 w-5" />
            </FieldIcon>
            <input
              aria-describedby={errors.phone ? phoneErrorId : undefined}
              aria-invalid={Boolean(errors.phone)}
              className={cn(
                'h-14 w-full rounded-lg border bg-white/75 pl-14 pr-4 text-sm font-medium text-ink outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/15',
                errors.phone ? 'border-red-700' : 'border-emerald/15',
              )}
              onChange={(event) => onUpdate('phone', event.target.value)}
              placeholder="Enter your phone number"
              type="tel"
              value={values.phone}
            />
          </span>
          <FieldError id={phoneErrorId} message={errors.phone} />
        </label>

        <div className="grid gap-5 lg:grid-cols-[1fr_1.55fr]">
          <label className="block">
            <span className="text-sm font-bold text-ink sm:text-base">City / Country</span>
            <span className="relative mt-2 block">
              <FieldIcon>
                <MapPin className="h-5 w-5" />
              </FieldIcon>
              <input
                className="h-14 w-full rounded-lg border border-emerald/15 bg-white/75 pl-14 pr-4 text-sm font-medium text-ink outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/15"
                onChange={(event) => onUpdate('city', event.target.value)}
                placeholder="Enter your city or country"
                type="text"
                value={values.city}
              />
            </span>
          </label>

          <fieldset>
            <legend className="text-sm font-bold text-ink sm:text-base">
              Preferred Contact Method
            </legend>
            <div className="mt-2 grid gap-3 sm:grid-cols-3">
              {contactMethods.map((method) => (
                <label
                  className={cn(
                    'flex h-14 cursor-pointer items-center justify-center gap-2 rounded-lg border bg-white/75 px-3 text-sm font-bold text-ink transition',
                    values.contactMethod === method.value
                      ? 'border-emerald-muted shadow-[0_0_0_3px_rgba(47,93,77,0.12)]'
                      : 'border-emerald/15 hover:border-gold/50',
                  )}
                  key={method.value}
                >
                  <input
                    checked={values.contactMethod === method.value}
                    className="sr-only"
                    name="contact-method"
                    onChange={() => onUpdate('contactMethod', method.value)}
                    type="radio"
                    value={method.value}
                  />
                  <span
                    aria-hidden="true"
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-full border',
                      values.contactMethod === method.value
                        ? 'border-emerald bg-emerald text-cream-soft'
                        : 'border-ink/20',
                    )}
                  >
                    {values.contactMethod === method.value ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : null}
                  </span>
                  <method.icon className="h-4.5 w-4.5" />
                  <span>{method.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <label className="block">
          <span className="text-sm font-bold text-ink sm:text-base">
            Message / Questions (Optional)
          </span>
          <span className="relative mt-2 block">
            <span className="pointer-events-none absolute left-4 top-5 text-ink/65">
              <PenLine className="h-5 w-5" />
            </span>
            <textarea
              className="min-h-24 w-full resize-y rounded-lg border border-emerald/15 bg-white/75 px-4 py-4 pl-14 text-sm font-medium text-ink outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/15"
              onChange={(event) => onUpdate('message', event.target.value)}
              placeholder="Write anything you'd like to ask or share..."
              value={values.message}
            />
          </span>
        </label>

        <label className="flex items-start gap-4 text-sm font-semibold leading-relaxed text-ink sm:text-base">
          <input
            aria-describedby={errors.confirmedMinimum ? confirmErrorId : undefined}
            aria-invalid={Boolean(errors.confirmedMinimum)}
            checked={values.confirmedMinimum}
            className="mt-0.5 h-7 w-7 shrink-0 rounded-md border-emerald/20 text-emerald-deep accent-emerald-deep"
            onChange={(event) => onUpdate('confirmedMinimum', event.target.checked)}
            type="checkbox"
          />
          <span>
            I understand that the minimum sponsorship amount is Rs. 36,000/- per month.{' '}
            <span className="text-red-700">*</span>
            <FieldError id={confirmErrorId} message={errors.confirmedMinimum} />
          </span>
        </label>

        <button
          className="flex h-15 w-full items-center justify-center gap-3 rounded-lg bg-emerald-deepest px-5 text-base font-bold text-cream-soft shadow-[0_16px_35px_-18px_rgba(7,39,29,0.9)] transition hover:bg-emerald-deep disabled:cursor-wait disabled:opacity-80 sm:text-lg"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? (
            <>
              <LoaderCircle className="h-5 w-5 animate-spin text-gold" />
              Preparing your request...
            </>
          ) : (
            <>
              <Send className="h-5 w-5 text-gold" />
              Request Orphan Sponsorship Details
            </>
          )}
        </button>

        {submitError ? (
          <p className="rounded-lg border border-red-700/20 bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-700">
            {submitError}
          </p>
        ) : null}

        <p className="flex items-center justify-center gap-2 text-center text-sm font-medium text-ink/50 sm:text-base">
          <Lock className="h-4 w-4" />
          Your information is safe with us and will never be shared.
        </p>
      </form>
    </motion.div>
  );
}
