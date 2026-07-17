export const DEFAULT_LIST_PAGE_SIZE = 10;
export const ADMIN_LIST_PAGE_SIZE = DEFAULT_LIST_PAGE_SIZE;

export type PaginationOptions = {
  knownTotal?: number;
  limit?: number;
  offset?: number;
};

export type NormalizedPaginationOptions = {
  knownTotal?: number;
  limit: number;
  offset: number;
};

export type PaginatedResult<T> = {
  hasMore: boolean;
  items: T[];
  total: number;
};

export function getPaginationOptions(url: URL): NormalizedPaginationOptions {
  const knownTotalParam = url.searchParams.get('knownTotal');
  const rawKnownTotal = knownTotalParam === null ? Number.NaN : Number(knownTotalParam);
  const rawOffset = Number(url.searchParams.get('offset'));
  const offset = Number.isInteger(rawOffset) && rawOffset > 0 ? rawOffset : 0;
  const knownTotal =
    offset > 0 && Number.isInteger(rawKnownTotal) && rawKnownTotal >= 0 ? rawKnownTotal : undefined;

  return { knownTotal, limit: DEFAULT_LIST_PAGE_SIZE, offset };
}

export function normalizePaginationOptions(
  options: PaginationOptions = {},
): NormalizedPaginationOptions {
  const offset =
    Number.isInteger(options.offset) && Number(options.offset) > 0 ? Number(options.offset) : 0;

  return {
    knownTotal:
      offset > 0 && Number.isInteger(options.knownTotal) && Number(options.knownTotal) >= 0
        ? Number(options.knownTotal)
        : undefined,
    limit: DEFAULT_LIST_PAGE_SIZE,
    offset,
  };
}

export function createPaginatedResult<T>(
  items: T[],
  total: number,
  options: NormalizedPaginationOptions,
): PaginatedResult<T> {
  return {
    hasMore: options.offset + items.length < total,
    items,
    total,
  };
}

export function paginateArray<T>(
  items: T[],
  options: NormalizedPaginationOptions,
): PaginatedResult<T> {
  return createPaginatedResult(
    items.slice(options.offset, options.offset + options.limit),
    items.length,
    options,
  );
}
