'use client';

import { CheckCircle2, Eye, Minus } from 'lucide-react';

import { type AccessLevel } from '@/lib/permissionFeatures';
import { cn } from '@/lib/utils';

const LEVEL_META: Record<AccessLevel, { icon: React.ElementType; label: string }> = {
  full: { icon: CheckCircle2, label: 'Full' },
  none: { icon: Minus, label: 'None' },
  view: { icon: Eye, label: 'View' },
};

const ORDER: AccessLevel[] = ['none', 'view', 'full'];

/** Per-level colors for the read-only pill, where color communicates the access level. */
const READONLY_PILL_STYLES: Record<AccessLevel, string> = {
  full: 'bg-emerald text-cream-soft shadow-sm',
  none: 'bg-ink/10 text-ink/60',
  view: 'bg-gold-deep text-cream-soft shadow-sm',
};

/** Single selected color while editing (the admin panel's primary green from work-surface). */
const SELECTED_STYLE = 'bg-[#006b4f] text-white shadow-sm';

/**
 * A segmented None / View / Full control for a single feature's access level. Levels the feature
 * does not support are hidden. When `disabled`, it renders as a read-only pill of the current
 * level.
 */
export function PermissionLevelControl({
  disabled = false,
  onChange,
  supportedLevels,
  value,
}: {
  disabled?: boolean;
  onChange?: (level: AccessLevel) => void;
  supportedLevels: AccessLevel[];
  value: AccessLevel;
}) {
  const levels = ORDER.filter((level) => supportedLevels.includes(level));

  if (disabled) {
    const meta = LEVEL_META[value];
    const Icon = meta.icon;
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold',
          READONLY_PILL_STYLES[value],
        )}
      >
        <Icon className="h-3.5 w-3.5" />
        {meta.label}
      </span>
    );
  }

  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg bg-ink/8 p-0.5" role="group">
      {levels.map((level) => {
        const meta = LEVEL_META[level];
        const Icon = meta.icon;
        const active = value === level;
        return (
          <button
            aria-pressed={active}
            className={cn(
              'inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-bold transition',
              active ? SELECTED_STYLE : 'text-ink/45 hover:bg-white/70 hover:text-ink/75',
            )}
            key={level}
            onClick={() => onChange?.(level)}
            type="button"
          >
            <Icon className="h-3.5 w-3.5" />
            {meta.label}
          </button>
        );
      })}
    </div>
  );
}
