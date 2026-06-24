import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'light';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = {
  href?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-gold text-emerald-deepest hover:bg-gold-soft shadow-[0_12px_30px_-12px_rgba(168,135,63,0.7)]',
  outline:
    'border border-gold text-cream-soft hover:border-gold-soft hover:text-gold-soft bg-transparent',
  ghost: 'border border-emerald/20 text-emerald-deep hover:bg-emerald/5 bg-transparent',
  light: 'bg-cream-soft text-emerald-deep hover:bg-white',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-xs',
  md: 'h-11 px-6 text-sm',
  lg: 'h-13 px-7 text-sm sm:text-base',
};

export function Button({
  href,
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(
    'inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-wide transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-transparent active:scale-[0.98]',
    VARIANTS[variant],
    SIZES[size],
    className,
  );

  if (href) {
    return (
      <a className={classes} href={href}>
        {children}
      </a>
    );
  }

  return (
    <button className={classes} type="button" {...props}>
      {children}
    </button>
  );
}
