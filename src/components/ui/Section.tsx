import { cn } from '@/lib/utils';

type SectionProps = {
  id?: string;
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
};

export function Section({ id, children, className, containerClassName }: SectionProps) {
  return (
    <section className={cn('relative w-full', className)} id={id}>
      <div className={cn('mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12', containerClassName)}>
        {children}
      </div>
    </section>
  );
}
