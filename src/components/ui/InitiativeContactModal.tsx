'use client';

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Headphones, Heart, MessageCircle, Phone, Sparkles, X } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { LampIllustration } from '@/components/ui/SponsorLampSuccessAnimation';

import { CONTACT } from '@/data/content';

import { cn } from '@/lib/utils';

export type SupportInitiative =
  | 'mosque'
  | 'school'
  | 'food-water'
  | 'essential-relief'
  | 'humanitarian';

type InitiativeContactContextValue = {
  openInitiativeContact: (initiative: SupportInitiative) => void;
};

type InitiativeContactButtonProps = {
  initiative: SupportInitiative;
  label: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'outline' | 'ghost' | 'light';
};

const InitiativeContactContext = createContext<InitiativeContactContextValue | null>(null);

const initiativeContent = {
  mosque: {
    eyebrow: 'Tent Mosque Initiative',
    intro: 'An intention can become a place of sujood.',
    title: 'Help faith find a home in Gaza.',
    description:
      'A tent mosque is more than shelter. It is where prayers rise, children learn, and a community stands together again.',
    closing: 'One conversation can begin a lasting Sadaqah Jariyah.',
    words: ['Faith', 'Unity'],
    whatsappMessage:
      'Assalamu Alaikum, I would like to learn how I can support a tent mosque in Gaza.',
  },
  school: {
    eyebrow: 'Tent School Initiative',
    intro: 'An intention can become a child’s first lesson.',
    title: 'Help learning rise, even among the ruins.',
    description:
      'A tent school gives children safety, rhythm and the courage to imagine tomorrow. Your call can help open its doors.',
    closing: 'One conversation can help a child believe in tomorrow again.',
    words: ['Learn', 'Hope'],
    whatsappMessage:
      'Assalamu Alaikum, I would like to learn how I can help build a tent school in Gaza.',
  },
  'food-water': {
    eyebrow: 'Food & Water Supply',
    intro: 'An intention can become nourishment and clean water.',
    title: 'Help essential care reach families in Gaza.',
    description:
      'Food and clean water protect health, restore daily stability and give families room to face tomorrow with dignity.',
    closing: 'One conversation can begin practical, verified support.',
    words: ['Nourish', 'Hope'],
    whatsappMessage:
      'Assalamu Alaikum, I would like to learn how I can support food and clean-water relief in Gaza.',
  },
  'essential-relief': {
    eyebrow: 'Essential Relief',
    intro: 'An intention can become shelter, warmth and safety.',
    title: 'Help urgent relief reach a family in Gaza.',
    description:
      'Essential relief responds to displacement with practical protection, seasonal support and the basics families need most.',
    closing: 'One conversation can help urgent care begin.',
    words: ['Safety', 'Dignity'],
    whatsappMessage:
      'Assalamu Alaikum, I would like to learn how I can support essential relief for families in Gaza.',
  },
  humanitarian: {
    eyebrow: 'General Humanitarian Support',
    intro: 'An intention can meet a need that cannot wait.',
    title: 'Stand with families through urgent and special cases.',
    description:
      'Flexible humanitarian support helps the team respond to verified needs with care shaped around each family’s circumstances.',
    closing: 'One conversation can open the way to meaningful care.',
    words: ['Care', 'Dignity'],
    whatsappMessage:
      'Assalamu Alaikum, I would like to learn how I can support urgent humanitarian needs in Gaza.',
  },
} as const;

export function InitiativeContactProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [initiative, setInitiative] = useState<SupportInitiative>('mosque');
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const openInitiativeContact = (nextInitiative: SupportInitiative) => {
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    setInitiative(nextInitiative);
    setOpen(true);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      window.setTimeout(() => returnFocusRef.current?.focus(), 180);
    }
  };

  return (
    <InitiativeContactContext.Provider value={{ openInitiativeContact }}>
      {children}
      <InitiativeContactModal initiative={initiative} onOpenChange={handleOpenChange} open={open} />
    </InitiativeContactContext.Provider>
  );
}

export function useInitiativeContact() {
  const context = useContext(InitiativeContactContext);

  if (!context) {
    throw new Error('useInitiativeContact must be used inside InitiativeContactProvider');
  }

  return context;
}

export function InitiativeContactButton({
  initiative,
  label,
  className,
  size = 'lg',
  variant = 'primary',
}: InitiativeContactButtonProps) {
  const { openInitiativeContact } = useInitiativeContact();

  return (
    <Button
      className={className}
      onClick={() => openInitiativeContact(initiative)}
      size={size}
      variant={variant}
    >
      {label}
      <Heart className="h-4 w-4" />
    </Button>
  );
}

function InitiativeContactModal({
  open,
  initiative,
  onOpenChange,
}: {
  open: boolean;
  initiative: SupportInitiative;
  onOpenChange: (open: boolean) => void;
}) {
  const [stage, setStage] = useState<'intro' | 'contact'>('intro');
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const contactHeadingRef = useRef<HTMLHeadingElement>(null);
  const content = initiativeContent[initiative];

  useEffect(() => {
    if (!open) return;

    setStage('intro');
    const timer = window.setTimeout(() => setStage('contact'), reduceMotion ? 700 : 3350);

    return () => window.clearTimeout(timer);
  }, [initiative, open, reduceMotion]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false);
        return;
      }

      if (event.key !== 'Tab' || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
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
  }, [onOpenChange, open]);

  const whatsappHref = `${CONTACT.whatsapp.href}?text=${encodeURIComponent(content.whatsappMessage)}`;
  const phone = CONTACT.phones[0];

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          animate={{ opacity: 1 }}
          aria-describedby={stage === 'contact' ? descriptionId : undefined}
          aria-labelledby={titleId}
          aria-modal="true"
          className="fixed inset-0 z-[999] flex items-center justify-center overflow-hidden bg-emerald-deepest/85 px-3 py-4 backdrop-blur-md sm:px-5 sm:py-8"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onMouseDown={() => onOpenChange(false)}
          role="dialog"
          transition={{ duration: 0.2 }}
        >
          <motion.div
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative max-h-[calc(100svh-2rem)] w-full max-w-3xl overflow-y-auto overflow-x-hidden rounded-[1.75rem] border border-gold/20 bg-black shadow-[0_32px_100px_-30px_rgba(0,0,0,0.9)] sm:max-h-[calc(100svh-4rem)] sm:rounded-[2.25rem]"
            exit={{ opacity: 0, scale: 0.98, y: 14 }}
            initial={{ opacity: 0, scale: 0.97, y: 18 }}
            onMouseDown={(event) => event.stopPropagation()}
            ref={panelRef}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_26%,rgba(216,189,134,0.18),transparent_34%),linear-gradient(145deg,rgba(255,255,255,0.035),transparent_50%)]" />
            <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full border border-gold/10" />
            <div className="pointer-events-none absolute -bottom-40 -right-24 h-80 w-80 rounded-full border border-gold/10" />

            <button
              aria-label="Close support contact"
              className="absolute right-4 top-4 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-gold/30 bg-black/80 text-gold-soft shadow-soft backdrop-blur transition-colors hover:border-gold/70 hover:bg-gold/10 hover:text-cream-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-black sm:right-6 sm:top-6"
              onClick={() => onOpenChange(false)}
              ref={closeButtonRef}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>

            <AnimatePresence mode="wait">
              {stage === 'intro' ? (
                <LampIntro
                  content={content}
                  key={`intro-${initiative}`}
                  onContinue={() => setStage('contact')}
                  reduceMotion={Boolean(reduceMotion)}
                  titleId={titleId}
                />
              ) : (
                <ContactReveal
                  content={content}
                  descriptionId={descriptionId}
                  headingRef={contactHeadingRef}
                  key={`contact-${initiative}`}
                  phone={phone}
                  titleId={titleId}
                  whatsappHref={whatsappHref}
                />
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function LampIntro({
  content,
  titleId,
  reduceMotion,
  onContinue,
}: {
  content: (typeof initiativeContent)[SupportInitiative];
  titleId: string;
  reduceMotion: boolean;
  onContinue: () => void;
}) {
  return (
    <motion.div
      animate={{ opacity: 1 }}
      className="relative z-10 flex min-h-[34rem] flex-col items-center justify-center px-5 pb-8 pt-16 text-center sm:min-h-[38rem] sm:px-10 sm:pb-10 sm:pt-12"
      exit={{ opacity: 0, scale: 1.02 }}
      initial={{ opacity: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.28 }}
    >
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gold-soft sm:text-xs"
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        transition={{ duration: 0.45 }}
      >
        <Sparkles className="h-3.5 w-3.5" />A moment of intention
      </motion.div>

      <div className="relative mt-3 flex h-64 w-full items-center justify-center sm:h-72">
        <motion.div
          animate={
            reduceMotion
              ? { opacity: 0.7, scale: 1 }
              : { opacity: [0.2, 0.75, 0.45], scale: [0.75, 1.18, 1] }
          }
          className="absolute h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(255,220,132,0.52),rgba(216,189,134,0.14)_50%,transparent_72%)] blur-sm sm:h-64 sm:w-64"
          transition={{ duration: reduceMotion ? 0 : 2.2, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.div
          animate={
            reduceMotion
              ? { opacity: 0.28, scale: 1 }
              : { opacity: [0, 0.35, 0.2], scale: [0.6, 1.1, 1] }
          }
          className="absolute h-60 w-60 rounded-full border border-gold/25 sm:h-72 sm:w-72"
          transition={{ delay: 0.2, duration: reduceMotion ? 0 : 1.8 }}
        />

        {content.words.map((word, index) => (
          <motion.span
            animate={{ opacity: 1, x: 0 }}
            className={cn(
              'absolute z-20 font-display text-xl font-semibold text-gold-soft sm:text-2xl',
              index === 0 ? 'left-1 top-1/2 sm:left-12' : 'right-1 top-1/2 sm:right-12',
            )}
            initial={reduceMotion ? false : { opacity: 0, x: index === 0 ? -12 : 12 }}
            key={word}
            transition={{ delay: 0.85 + index * 0.2, duration: reduceMotion ? 0 : 0.5 }}
          >
            {word}
          </motion.span>
        ))}

        <motion.div
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative z-10"
          initial={reduceMotion ? false : { opacity: 0, scale: 0.88, y: 16 }}
          transition={{ duration: reduceMotion ? 0 : 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <LampIllustration reduceMotion={reduceMotion} />
        </motion.div>
      </div>

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        transition={{ delay: reduceMotion ? 0 : 1.15, duration: reduceMotion ? 0 : 0.5 }}
      >
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold/75">
          {content.eyebrow}
        </p>
        <h2
          className="mx-auto mt-3 max-w-xl text-balance font-display text-3xl font-semibold leading-tight text-cream-soft sm:text-5xl"
          id={titleId}
        >
          {content.intro}
        </h2>
      </motion.div>

      <button
        className="mt-8 text-xs font-semibold text-cream/45 underline decoration-gold/40 underline-offset-4 transition-colors hover:text-gold-soft"
        onClick={onContinue}
        type="button"
      >
        Continue to contact details
      </button>
    </motion.div>
  );
}

function ContactReveal({
  content,
  titleId,
  descriptionId,
  headingRef,
  whatsappHref,
  phone,
}: {
  content: (typeof initiativeContent)[SupportInitiative];
  titleId: string;
  descriptionId: string;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  whatsappHref: string;
  phone: string;
}) {
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [headingRef]);

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="relative z-10 px-5 pb-6 pt-20 sm:px-10 sm:pb-10 sm:pt-14 lg:px-14"
      exit={{ opacity: 0, y: -10 }}
      initial={{ opacity: 0, y: 14 }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-gold/30 bg-gold/10 text-gold-soft shadow-[0_0_45px_rgba(200,163,91,0.16)]">
          <Headphones className="h-7 w-7 stroke-[1.5]" />
        </div>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.22em] text-gold-soft">
          Speak directly with our team
        </p>
        <h2
          className="mt-3 text-balance font-display text-4xl font-semibold leading-tight text-cream-soft focus:outline-none sm:text-5xl"
          id={titleId}
          ref={headingRef}
          tabIndex={-1}
        >
          {content.title}
        </h2>
        <p
          className="mx-auto mt-4 max-w-xl text-sm font-medium leading-relaxed text-cream/70 sm:text-base"
          id={descriptionId}
        >
          {content.description}
        </p>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <ContactCard
          detail="Message our support team"
          href={whatsappHref}
          icon={MessageCircle}
          label="WhatsApp"
          number={CONTACT.whatsapp.label}
          target="_blank"
        />
        <ContactCard
          detail="Call our support team"
          href={`tel:${phone.replace(/\s+/g, '')}`}
          icon={Phone}
          label="Phone"
          number={phone}
        />
      </div>

      <div className="mt-5 rounded-2xl border border-gold/20 bg-gold/[0.07] px-5 py-4 text-center">
        <p className="font-display text-lg font-semibold text-gold-soft sm:text-xl">
          {content.closing}
        </p>
        <p className="mt-1.5 text-xs font-medium text-cream/55 sm:text-sm">
          No form required. Our team will guide you personally.
        </p>
      </div>
    </motion.div>
  );
}

function ContactCard({
  href,
  label,
  number,
  detail,
  icon: Icon,
  target,
}: {
  href: string;
  label: string;
  number: string;
  detail: string;
  icon: typeof Phone;
  target?: '_blank';
}) {
  return (
    <a
      className="group flex min-h-32 items-center gap-4 rounded-2xl border border-cream/12 bg-cream/[0.06] p-4 transition-all hover:-translate-y-0.5 hover:border-gold/45 hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:p-5"
      href={href}
      rel={target ? 'noreferrer' : undefined}
      target={target}
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold/35 bg-gold/10 text-gold-soft transition-colors group-hover:bg-gold group-hover:text-emerald-deepest">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-cream/50">
          {label}
        </span>
        <span className="mt-1 block font-display text-xl font-semibold text-cream-soft sm:text-2xl">
          {number}
        </span>
        <span className="mt-1 block text-xs font-medium text-gold-soft/80">{detail}</span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-gold-soft transition-transform group-hover:translate-x-1" />
    </a>
  );
}
