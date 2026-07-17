export type MonthOption = {
  label: string;
  value: string;
};

const monthLabelFormatter = new Intl.DateTimeFormat('en', {
  month: 'long',
  timeZone: 'UTC',
  year: 'numeric',
});

export function currentMonthValue(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    month: '2-digit',
    timeZone: 'Asia/Karachi',
    year: 'numeric',
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';

  return `${value('year')}-${value('month')}`;
}

/**
 * Build a rolling list of month options for a filter dropdown, newest first.
 * When `includeAll` is true (default) a leading "All months" entry with an
 * empty value is prepended.
 */
export function buildMonthOptions({
  includeAll = true,
  monthsAhead = 2,
  monthsBack = 24,
  now = new Date(),
}: {
  includeAll?: boolean;
  monthsAhead?: number;
  monthsBack?: number;
  now?: Date;
} = {}): MonthOption[] {
  const options: MonthOption[] = includeAll ? [{ label: 'All months', value: '' }] : [];
  const [currentYear, currentMonth] = currentMonthValue(now).split('-').map(Number);

  for (let offset = monthsAhead; offset >= -monthsBack; offset -= 1) {
    const date = new Date(Date.UTC(currentYear, currentMonth - 1 + offset, 1));
    options.push({
      label: monthLabelFormatter.format(date),
      value: `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`,
    });
  }

  return options;
}

/**
 * Convert a `YYYY-MM` month-picker value into the `YYYY-MM-01` donation-month
 * date the finance API expects. Returns an empty string when no month is set.
 */
export function monthValueToMonthStart(value: string) {
  return value ? `${value}-01` : '';
}
