'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2, Clock3, Sparkles } from 'lucide-react';

import { cn } from '@/lib/utils';

type SponsorLampSuccessAnimationProps = {
  titleId: string;
  descriptionId: string;
};

const glowWords = [
  { label: 'Hope', className: 'left-4 top-[24%] sm:left-[19%] sm:top-[31%]' },
  { label: 'Care', className: 'right-4 top-[24%] sm:right-[20%] sm:top-[31%]' },
  { label: 'Education', className: 'bottom-[27%] left-4 sm:bottom-[27%] sm:left-[13%]' },
  { label: 'Support', className: 'bottom-[27%] right-4 sm:bottom-[27%] sm:right-[15%]' },
];

const particles = [
  { className: 'left-[31%] top-[32%]', delay: 1.1 },
  { className: 'right-[32%] top-[34%]', delay: 1.35 },
  { className: 'left-[43%] top-[18%]', delay: 1.65 },
  { className: 'right-[43%] top-[18%]', delay: 1.9 },
  { className: 'left-[48%] bottom-[26%]', delay: 2.15 },
];

export function SponsorLampSuccessAnimation({
  titleId,
  descriptionId,
}: SponsorLampSuccessAnimationProps) {
  const reduceMotion = useReducedMotion();
  const messageDelay = reduceMotion ? 0 : 3.35;

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="relative mx-auto max-w-4xl overflow-hidden px-0 pb-0 pt-3 sm:px-4 sm:pt-2"
      exit={{ opacity: 0, y: -8 }}
      initial={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2 }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_24%,rgba(216,189,134,0.18),transparent_34%),radial-gradient(circle_at_50%_54%,rgba(200,163,91,0.16),transparent_42%)]" />
      <div className="text-center">
        <div className="relative z-10 mx-auto inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-gold-soft">
          <Sparkles className="h-4 w-4" />
          Request received
        </div>

        <div className="relative mx-auto mt-2 min-h-[19.5rem] overflow-visible p-0 sm:min-h-[20.5rem]">
          <OrnateLampBackdrop reduceMotion={Boolean(reduceMotion)} />
          <motion.div
            animate={
              reduceMotion
                ? { opacity: 0.9, scale: 1.15 }
                : { opacity: [0, 0.85], scale: [0.35, 1.25] }
            }
            className="absolute left-1/2 top-[45%] h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,220,132,0.62),rgba(216,189,134,0.2)_48%,transparent_72%)] blur-sm sm:h-64 sm:w-64"
            transition={{ delay: 0.7, duration: reduceMotion ? 0 : 1.6, ease: [0.22, 1, 0.36, 1] }}
          />
          <motion.div
            animate={
              reduceMotion
                ? { opacity: 0.45, scale: 1 }
                : { opacity: [0, 0.45, 0.28], scale: [0.6, 1.18, 1] }
            }
            className="absolute left-1/2 top-[45%] h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold/20 sm:h-96 sm:w-96"
            transition={{ delay: 1, duration: reduceMotion ? 0 : 2.2, ease: 'easeOut' }}
          />

          {particles.map((particle) => (
            <motion.span
              animate={
                reduceMotion
                  ? { opacity: 0.75, scale: 1 }
                  : { opacity: [0, 0.9, 0.25], scale: [0.6, 1, 0.72], y: [4, -8, -14] }
              }
              className={cn('absolute h-1.5 w-1.5 rounded-full bg-gold-soft', particle.className)}
              key={particle.className}
              transition={{
                delay: reduceMotion ? 0 : particle.delay,
                duration: reduceMotion ? 0 : 2.6,
                repeat: reduceMotion ? 0 : Number.POSITIVE_INFINITY,
                repeatDelay: 0.8,
              }}
            />
          ))}

          <div className="relative z-10 flex min-h-[15rem] items-center justify-center sm:min-h-[16rem]">
            <motion.div
              animate={{ opacity: 1, scale: 1, y: 0 }}
              initial={reduceMotion ? false : { opacity: 0, scale: 0.92, y: 16 }}
              transition={{ duration: reduceMotion ? 0 : 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <LampIllustration reduceMotion={Boolean(reduceMotion)} />
            </motion.div>
          </div>

          {glowWords.map((word, index) => (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'absolute z-20 font-display text-xl font-semibold text-gold-soft drop-shadow-[0_1px_12px_rgba(200,163,91,0.34)] sm:text-3xl',
                word.className,
              )}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              key={word.label}
              transition={{
                delay: reduceMotion ? 0 : 1.55 + index * 0.24,
                duration: reduceMotion ? 0 : 0.45,
              }}
            >
              <span>{word.label}</span>
              <span className="mx-auto mt-1 flex w-16 items-center justify-center gap-1 text-gold-soft/65 sm:w-20">
                <span className="h-px flex-1 bg-current" />
                <Sparkles className="h-3 w-3" />
                <span className="h-px flex-1 bg-current" />
              </span>
            </motion.div>
          ))}
        </div>

        <motion.div
          animate={{ opacity: 1, y: 0 }}
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          transition={{ delay: messageDelay, duration: reduceMotion ? 0 : 0.45 }}
        >
          <h2
            className="mt-2 font-display text-4xl font-semibold leading-tight text-cream-soft sm:text-5xl"
            id={titleId}
          >
            Your interest has been received
          </h2>
          <p
            className="mx-auto mt-3 max-w-2xl text-base font-medium leading-relaxed text-cream/75 sm:text-lg"
            id={descriptionId}
          >
            Our team will shortly contact you with verified orphan sponsorship details.
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-gold-soft sm:text-base">
            JazakAllah khair for taking the first step toward supporting an orphan in Gaza.
          </p>
        </motion.div>

        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 grid gap-2 rounded-2xl border border-gold/20 bg-cream-soft/8 p-2 sm:grid-cols-3"
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          transition={{ delay: messageDelay + 0.12, duration: reduceMotion ? 0 : 0.45 }}
        >
          <LampStatusStep active checked label="Request received" />
          <LampStatusStep active loading label="Profiles being prepared" />
          <LampStatusStep label="Team will contact you" />
        </motion.div>

        <motion.p
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto mt-3 max-w-3xl text-center text-xs font-semibold leading-relaxed text-cream/55 sm:text-sm"
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          transition={{ delay: messageDelay + 0.22, duration: reduceMotion ? 0 : 0.35 }}
        >
          Monthly support is given to the child&apos;s family or guardian in Gaza, who uses it
          according to the child&apos;s most urgent needs.
        </motion.p>
      </div>
    </motion.div>
  );
}

export function LampIllustration({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className="h-40 w-40 overflow-visible sm:h-52 sm:w-52"
      fill="none"
      viewBox="0 0 220 240"
    >
      <motion.ellipse
        animate={
          reduceMotion
            ? { opacity: 0.42, scale: 1 }
            : { opacity: [0.12, 0.42, 0.28], scale: [0.86, 1.04, 1] }
        }
        cx="110"
        cy="218"
        fill="var(--color-gold)"
        initial={false}
        rx="62"
        ry="10"
        transition={{
          delay: 0.9,
          duration: reduceMotion ? 0 : 2.3,
          repeat: reduceMotion ? 0 : Number.POSITIVE_INFINITY,
          repeatDelay: 0.5,
        }}
      />
      <motion.path
        animate={reduceMotion ? { opacity: 0.44 } : { opacity: [0, 0.44] }}
        d="M110 79L158 213H62L110 79Z"
        fill="url(#lampGlow)"
        transition={{ delay: 0.9, duration: reduceMotion ? 0 : 1.5 }}
      />
      <path d="M110 22C100 29 99 41 111 48C104 44 104 34 110 22Z" fill="var(--color-gold)" />
      <circle cx="110" cy="56" fill="var(--color-gold)" r="5" />
      <path
        d="M102 56C102 44 110 36 119 33C115 43 119 53 130 56C121 63 110 64 102 56Z"
        stroke="var(--color-gold-deep)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
      <path d="M86 78C91 58 101 48 110 48C119 48 129 58 134 78H86Z" fill="url(#domeGold)" />
      <path
        d="M80 79H140L150 96H70L80 79Z"
        fill="var(--color-gold)"
        stroke="var(--color-gold-deep)"
        strokeLinejoin="round"
        strokeWidth="3"
      />
      <path
        d="M74 96H146L138 205H82L74 96Z"
        fill="url(#lanternBody)"
        stroke="var(--color-gold)"
        strokeLinejoin="round"
        strokeWidth="4"
      />
      <path
        d="M88 104H106V194H86L88 104Z"
        fill="rgba(250,245,234,0.18)"
        stroke="var(--color-gold-soft)"
        strokeWidth="2"
      />
      <path
        d="M114 104H132L134 194H114V104Z"
        fill="rgba(250,245,234,0.18)"
        stroke="var(--color-gold-soft)"
        strokeWidth="2"
      />
      <path
        d="M102 104H118V194H102V104Z"
        fill="rgba(250,245,234,0.12)"
        stroke="var(--color-gold)"
        strokeWidth="2"
      />
      <path
        d="M95 104C96 126 101 145 110 161C119 145 124 126 125 104"
        stroke="var(--color-gold-soft)"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path
        d="M91 118H129M89 139H131M87 160H133M85 181H135"
        stroke="var(--color-gold-deep)"
        strokeOpacity="0.55"
        strokeWidth="1.4"
      />
      <path
        d="M83 113L104 194M137 113L116 194M104 104L85 194M116 104L135 194"
        stroke="var(--color-gold-soft)"
        strokeOpacity="0.55"
        strokeWidth="1.2"
      />
      <motion.path
        animate={
          reduceMotion
            ? { opacity: 1, scale: 1 }
            : { opacity: [0, 1, 0.86, 1], scale: [0.86, 1.06, 0.96, 1.04] }
        }
        d="M110 148C101 161 99 172 99 181C99 195 109 202 110 202C111 202 121 195 121 181C121 172 119 161 110 148Z"
        fill="var(--color-gold-soft)"
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        transition={{
          delay: 1.05,
          duration: reduceMotion ? 0 : 2,
          repeat: reduceMotion ? 0 : Number.POSITIVE_INFINITY,
          repeatDelay: 0.6,
        }}
      />
      <path
        d="M84 205H136L146 218H74L84 205Z"
        fill="var(--color-gold)"
        stroke="var(--color-gold-deep)"
        strokeLinejoin="round"
        strokeWidth="3"
      />
      <path d="M92 218H128L134 229H86L92 218Z" fill="var(--color-gold-deep)" />
      <defs>
        <radialGradient cx="50%" cy="45%" id="lampGlow" r="65%">
          <stop offset="0%" stopColor="var(--color-gold-soft)" stopOpacity="0.72" />
          <stop offset="48%" stopColor="var(--color-gold)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--color-gold)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="domeGold" x1="86" x2="134" y1="48" y2="78">
          <stop stopColor="var(--color-gold-soft)" />
          <stop offset="0.48" stopColor="var(--color-gold)" />
          <stop offset="1" stopColor="var(--color-gold-deep)" />
        </linearGradient>
        <linearGradient id="lanternBody" x1="74" x2="146" y1="96" y2="205">
          <stop stopColor="var(--color-gold-deep)" />
          <stop offset="0.5" stopColor="var(--color-emerald-deepest)" />
          <stop offset="1" stopColor="var(--color-gold-deep)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function OrnateLampBackdrop({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
      fill="none"
      preserveAspectRatio="none"
      viewBox="0 0 900 430"
    >
      <motion.path
        animate={
          reduceMotion
            ? { opacity: 0.42, pathLength: 1 }
            : { opacity: [0, 0.42], pathLength: [0, 1] }
        }
        d="M365 246V154C365 119 396 103 450 58C504 103 535 119 535 154V246"
        initial={false}
        stroke="var(--color-gold)"
        strokeLinecap="round"
        strokeWidth="5"
        transition={{ delay: 0.35, duration: reduceMotion ? 0 : 1.5, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.path
        animate={
          reduceMotion ? { opacity: 0.3, pathLength: 1 } : { opacity: [0, 0.3], pathLength: [0, 1] }
        }
        d="M344 248V178C344 145 364 126 389 116M556 248V178C556 145 536 126 511 116"
        initial={false}
        stroke="var(--color-gold)"
        strokeLinecap="round"
        strokeWidth="4"
        transition={{ delay: 0.55, duration: reduceMotion ? 0 : 1.5, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.path
        animate={
          reduceMotion ? { opacity: 0.2, pathLength: 1 } : { opacity: [0, 0.2], pathLength: [0, 1] }
        }
        d="M134 256C236 205 313 211 397 255C435 276 470 277 503 255C588 200 663 206 766 256"
        initial={false}
        stroke="white"
        strokeLinecap="round"
        strokeWidth="2"
        transition={{ delay: 1.05, duration: reduceMotion ? 0 : 1.7, ease: 'easeOut' }}
      />
      <motion.path
        animate={
          reduceMotion ? { opacity: 0.2, pathLength: 1 } : { opacity: [0, 0.2], pathLength: [0, 1] }
        }
        d="M156 298C261 247 343 258 410 288C438 301 463 301 490 288C557 258 639 247 744 298"
        initial={false}
        stroke="var(--color-gold-soft)"
        strokeLinecap="round"
        strokeWidth="2"
        transition={{ delay: 1.25, duration: reduceMotion ? 0 : 1.8, ease: 'easeOut' }}
      />
      <g opacity="0.12" stroke="var(--color-gold)">
        <circle cx="450" cy="356" r="84" />
        <circle cx="450" cy="356" r="58" />
        <path d="M366 356H534M450 272V430M391 297L509 415M509 297L391 415" />
      </g>
    </svg>
  );
}

function LampStatusStep({
  label,
  checked,
  active,
  loading,
}: {
  label: string;
  checked?: boolean;
  active?: boolean;
  loading?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-cream-soft/10 px-3 py-3 text-left">
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border',
          active ? 'border-gold/50 bg-gold/18 text-gold-soft' : 'border-cream/20 text-cream/55',
        )}
      >
        {checked ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : loading ? (
          <Clock3 className="h-4 w-4 animate-pulse" />
        ) : (
          <span className="h-2 w-2 rounded-full bg-current" />
        )}
      </span>
      <span className={cn('text-sm font-bold', active ? 'text-cream-soft' : 'text-cream/55')}>
        {label}
      </span>
    </div>
  );
}
