export const APP_CURRENCY = 'PKR';
export const APP_CURRENCIES = [APP_CURRENCY] as const;

export function normalizeAppCurrency() {
  return APP_CURRENCY;
}

export function formatCurrency(amount: number | string | null | undefined) {
  const numericAmount = Number(amount ?? 0);

  return new Intl.NumberFormat('en-PK', {
    currency: APP_CURRENCY,
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(Number.isFinite(numericAmount) ? numericAmount : 0);
}
