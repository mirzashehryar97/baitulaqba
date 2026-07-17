'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';

import { LoaderCircle } from 'lucide-react';
import useSWRInfinite from 'swr/infinite';

import { fetchApiData } from '@/lib/apiFetcher';
import { ADMIN_LIST_PAGE_SIZE, type PaginatedResult } from '@/lib/pagination';

type InfiniteAdminListOptions<T> = {
  initialPage?: PaginatedResult<T>;
  initialUrl: string;
  url: string;
};

export function useInfiniteAdminList<T>({
  initialPage,
  initialUrl,
  url,
}: InfiniteAdminListOptions<T>) {
  const getKey = useCallback(
    (pageIndex: number, previousPage: PaginatedResult<T> | null) => {
      if (previousPage && !previousPage.hasMore) return null;

      const separator = url.includes('?') ? '&' : '?';
      const params = new URLSearchParams({
        offset: String(pageIndex * ADMIN_LIST_PAGE_SIZE),
      });
      if (pageIndex > 0 && previousPage) {
        params.set('knownTotal', String(previousPage.total));
      }
      return `${url}${separator}${params.toString()}`;
    },
    [url],
  );

  const { data, error, isLoading, isValidating, mutate, setSize, size } = useSWRInfinite<
    PaginatedResult<T>
  >(getKey, fetchApiData, {
    dedupingInterval: 10_000,
    fallbackData: initialPage && url === initialUrl ? [initialPage] : undefined,
    persistSize: false,
    revalidateFirstPage: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });

  const items = useMemo(() => {
    const seen = new Set<string>();
    return (data ?? []).flatMap((page) =>
      page.items.filter((item) => {
        const id =
          typeof item === 'object' && item !== null && 'id' in item
            ? String((item as { id: unknown }).id)
            : JSON.stringify(item);
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      }),
    );
  }, [data]);

  const lastPage = data?.at(-1);
  const hasMore = lastPage?.hasMore ?? false;
  const isLoadingMore =
    isValidating && (isLoading || size > 1) && (!data || typeof data[size - 1] === 'undefined');
  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore) return;
    void setSize((current) => current + 1);
  }, [hasMore, isLoadingMore, setSize]);

  return {
    error,
    hasMore,
    isLoading,
    isLoadingMore,
    isValidating,
    items,
    loadMore,
    mutate,
    total: data?.[0]?.total ?? initialPage?.total ?? 0,
  };
}

export function InfiniteListLoader({
  hasMore,
  isLoadingMore,
  loadMore,
}: {
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMore: () => void;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: '400px 0px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  return (
    <div
      aria-live="polite"
      className="flex min-h-12 items-center justify-center border-t border-emerald/8 px-4 py-3 text-sm font-semibold text-ink/62"
      ref={sentinelRef}
    >
      {isLoadingMore ? (
        <span className="inline-flex items-center gap-2">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Loading 10 more...
        </span>
      ) : hasMore ? (
        <span>Scroll to load more</span>
      ) : (
        <span>All records loaded</span>
      )}
    </div>
  );
}
