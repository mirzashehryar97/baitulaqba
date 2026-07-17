'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Image from 'next/image';

import {
  CheckCircle2,
  GraduationCap,
  HeartHandshake,
  LoaderCircle,
  MapPin,
  RefreshCw,
  Search,
  UserRound,
} from 'lucide-react';
import useSWRInfinite from 'swr/infinite';

import { useConfirmation } from '@/components/ui/ConfirmationProvider';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { useToast } from '@/components/ui/ToastProvider';
import { workSurface } from '@/components/ui/work-surface';

import { fetchApiData } from '@/lib/apiFetcher';
import { DEFAULT_LIST_PAGE_SIZE, type PaginatedResult } from '@/lib/pagination';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { cn } from '@/lib/utils';

import type { AvailableOrphanFilterOptions, AvailableOrphanSummary } from '@/types/portal';

const initialUrl = '/api/portal/available-orphans';

const ageOptions = [
  { label: 'All Ages', value: 'all' },
  { label: 'Under 8 years', value: 'under-8' },
  { label: '8–10 years', value: '8-10' },
  { label: '11 years and above', value: '11-plus' },
];

const profileSkeletonKeys = ['first', 'second', 'third', 'fourth'];

export function AvailableOrphansGrid({
  filterOptions,
  initialPage,
}: {
  filterOptions: AvailableOrphanFilterOptions;
  initialPage: PaginatedResult<AvailableOrphanSummary>;
}) {
  const toast = useToast();
  const confirm = useConfirmation();
  const [savingId, setSavingId] = useState('');
  const [sentIds, setSentIds] = useState<Set<string>>(() => new Set());
  const [search, setSearch] = useState('');
  const [age, setAge] = useState('all');
  const [location, setLocation] = useState('all');
  const [education, setEducation] = useState('all');
  const debouncedSearch = useDebouncedValue(search);
  const locationOptions = [
    { label: 'All Locations', value: 'all' },
    ...filterOptions.locations.map((value) => ({ label: value, value })),
  ];
  const educationOptions = [
    { label: 'All Education', value: 'all' },
    ...filterOptions.education.map((value) => ({ label: value, value })),
  ];
  const params = new URLSearchParams();
  if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
  if (age !== 'all') params.set('age', age);
  if (location !== 'all') params.set('location', location);
  if (education !== 'all') params.set('education', education);
  const url = params.size > 0 ? `${initialUrl}?${params.toString()}` : initialUrl;
  const getKey = useCallback(
    (pageIndex: number, previousPage: PaginatedResult<AvailableOrphanSummary> | null) => {
      if (previousPage && !previousPage.hasMore) return null;

      const separator = url.includes('?') ? '&' : '?';
      const params = new URLSearchParams({
        offset: String(pageIndex * DEFAULT_LIST_PAGE_SIZE),
      });
      if (pageIndex > 0 && previousPage) {
        params.set('knownTotal', String(previousPage.total));
      }
      return `${url}${separator}${params.toString()}`;
    },
    [url],
  );
  const { data, error, isLoading, isValidating, mutate, setSize, size } = useSWRInfinite<
    PaginatedResult<AvailableOrphanSummary>
  >(getKey, fetchApiData, {
    dedupingInterval: 10_000,
    fallbackData: url === initialUrl ? [initialPage] : undefined,
    persistSize: false,
    revalidateFirstPage: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });
  const orphans = useMemo(() => {
    const seen = new Set<string>();
    return (data ?? []).flatMap((result) =>
      result.items.filter((orphan) => {
        if (seen.has(orphan.id)) return false;
        seen.add(orphan.id);
        return true;
      }),
    );
  }, [data]);
  const lastPage = data?.at(-1);
  const hasMore = lastPage?.hasMore ?? false;
  const total = data?.[0]?.total ?? (url === initialUrl ? initialPage.total : 0);
  const isLoadingMore =
    isValidating && size > 1 && (!data || typeof data[size - 1] === 'undefined');
  const showListSkeleton = isLoading && orphans.length === 0 && !error;
  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore) return;
    void setSize((current) => current + 1);
  }, [hasMore, isLoadingMore, setSize]);
  const hasFilters = Boolean(search || age !== 'all' || location !== 'all' || education !== 'all');

  const expressInterest = async (id: string) => {
    const orphan = orphans.find((item) => item.id === id);
    const confirmed = await confirm({
      confirmLabel: 'Send Interest',
      description: `Notify the sponsorship team that you are interested in ${
        orphan?.orphanCode ?? 'this orphan profile'
      }. This does not create a match automatically.`,
      title: 'Express interest?',
    });

    if (!confirmed) return;

    setSavingId(id);

    try {
      const response = await fetch(`/api/portal/available-orphans/${id}/interest`, {
        method: 'POST',
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        toast({
          description: body?.error ?? 'The team could not be notified.',
          title: 'Interest not sent',
          type: 'error',
        });
        return;
      }

      setSentIds((current) => new Set(current).add(id));
      toast({
        description: 'The sponsorship team will follow up with you.',
        title: 'Interest sent',
        type: 'success',
      });
    } catch {
      toast({
        description: 'Please check your connection and try again.',
        title: 'Interest not sent',
        type: 'error',
      });
    } finally {
      setSavingId('');
    }
  };

  const resetFilters = () => {
    setSearch('');
    setAge('all');
    setLocation('all');
    setEducation('all');
  };

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-[#cadbd2] bg-[#f4f9f6] px-4 py-4 sm:px-5">
        <h2 className="text-lg font-semibold text-[#111827]">How sponsorship works</h2>
        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-center">
          <ProcessStep label="Browse verified profiles" number="1" />
          <span className="hidden h-px w-24 bg-[#89a99b] lg:block" />
          <ProcessStep label="Express your interest" number="2" />
          <span className="hidden h-px w-24 bg-[#89a99b] lg:block" />
          <ProcessStep label="Our team confirms the match" number="3" />
        </div>
        <p className="mt-4 text-sm text-[#5f6b65]">
          Expressing interest notifies the team and does not create a match automatically.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(16rem,1.8fr)_minmax(9rem,0.65fr)_minmax(9rem,0.75fr)_minmax(10rem,0.85fr)_auto] xl:items-center">
        <label className="relative block min-w-0 sm:col-span-2 xl:col-span-1">
          <span className="sr-only">Search available orphan profiles</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[#6b7280]" />
          <input
            className={cn(workSurface.field, 'h-12 w-full pl-10 pr-4')}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or profile ID"
            type="search"
            value={search}
          />
        </label>
        <CustomSelect
          ariaLabel="Filter profiles by age"
          onChange={setAge}
          options={ageOptions}
          triggerClassName="h-12 border-[#d8ded8] font-normal text-[#111827]"
          value={age}
        />
        <CustomSelect
          ariaLabel="Filter profiles by location"
          onChange={setLocation}
          options={locationOptions}
          triggerClassName="h-12 border-[#d8ded8] font-normal text-[#111827]"
          value={location}
        />
        <CustomSelect
          ariaLabel="Filter profiles by education"
          onChange={setEducation}
          options={educationOptions}
          triggerClassName="h-12 border-[#d8ded8] font-normal text-[#111827]"
          value={education}
        />
        <p className="whitespace-nowrap text-sm text-[#6b7280] sm:col-span-2 xl:col-span-1 xl:text-right">
          {showListSkeleton ? 'Loading profiles...' : `Showing ${orphans.length} of ${total}`}
        </p>
      </section>

      <section>
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold tracking-[-0.02em] text-[#111827]">
                Profiles awaiting sponsorship
              </h2>
              {isValidating && !showListSkeleton && !isLoadingMore ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6b7280]">
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                  Updating
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-[#6b7280]">
              Every profile shown here is approved and field verified.
            </p>
          </div>
          {hasFilters ? (
            <button
              className="shrink-0 text-sm font-semibold text-[#075d46] underline underline-offset-4"
              onClick={resetFilters}
              type="button"
            >
              Clear filters
            </button>
          ) : null}
        </div>

        {error && orphans.length > 0 ? (
          <div className="mt-4 flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
            <p>Could not refresh available profiles. Showing the profiles already loaded.</p>
            <button
              className="font-semibold underline underline-offset-4"
              onClick={() => void mutate()}
              type="button"
            >
              Try again
            </button>
          </div>
        ) : null}

        {showListSkeleton ? (
          <ProfileCardsSkeleton count={4} />
        ) : error && orphans.length === 0 ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-5 py-10 text-center text-red-700">
            <RefreshCw className="mx-auto h-8 w-8" />
            <p className="mt-3 text-sm font-medium">Could not load available profiles.</p>
            <button
              className="mt-3 text-sm font-semibold underline underline-offset-4"
              onClick={() => void mutate()}
              type="button"
            >
              Try again
            </button>
          </div>
        ) : orphans.length > 0 ? (
          <>
            <div className="mt-4 grid min-w-0 gap-3 xl:grid-cols-2">
              {orphans.map((orphan) => (
                <OrphanCard
                  interestSent={sentIds.has(orphan.id)}
                  key={orphan.id}
                  onExpressInterest={() => expressInterest(orphan.id)}
                  orphan={orphan}
                  saving={savingId === orphan.id}
                />
              ))}
            </div>
            <InfiniteProfilesLoader
              hasMore={hasMore}
              isLoadingMore={isLoadingMore}
              loadMore={loadMore}
            />
          </>
        ) : (
          <div className="mt-4 rounded-lg border border-dashed border-[#cfd7d1] bg-white px-5 py-10 text-center">
            {hasFilters ? (
              <Search className="mx-auto h-8 w-8 text-[#8b9891]" />
            ) : (
              <HeartHandshake className="mx-auto h-9 w-9 text-[#8b9891]" />
            )}
            <p className="mt-3 text-sm font-medium text-[#6b7280]">
              {hasFilters
                ? 'No profiles match the selected filters.'
                : 'No unmatched approved orphan profiles are available right now.'}
            </p>
            {hasFilters ? (
              <button
                className="mt-3 text-sm font-semibold text-[#075d46] underline underline-offset-4"
                onClick={resetFilters}
                type="button"
              >
                Clear filters
              </button>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}

function ProcessStep({ label, number }: { label: string; number: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#07543f] text-sm font-semibold text-white">
        {number}
      </span>
      <span className="text-sm font-medium text-[#1f2937]">{label}</span>
    </div>
  );
}

function OrphanCard({
  interestSent,
  onExpressInterest,
  orphan,
  saving,
}: {
  interestSent: boolean;
  onExpressInterest: () => void;
  orphan: AvailableOrphanSummary;
  saving: boolean;
}) {
  return (
    <article className="grid min-w-0 overflow-hidden rounded-lg border border-[#dfe5df] bg-white shadow-[0_14px_40px_-34px_rgba(17,24,39,0.45)] sm:grid-cols-[11.5rem_minmax(0,1fr)]">
      <OrphanImage orphan={orphan} />
      <div className="flex min-w-0 flex-col p-4">
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.04em] text-emerald-800">
            Field Verified
          </span>
          <span className="inline-flex rounded-md border border-[#e7c36d] bg-[#fff9ea] px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.04em] text-[#8a5700]">
            Available
          </span>
        </div>
        <p className="mt-2 text-sm font-medium text-[#4b5563]">{orphan.orphanCode}</p>
        <h3 className="mt-0.5 truncate text-xl font-semibold tracking-[-0.02em] text-[#111827]">
          {orphan.fullName}
        </h3>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#6b7280]">
          {orphan.ageEstimate !== null ? (
            <span className="inline-flex items-center gap-1">
              <UserRound className="h-3.5 w-3.5" />
              {orphan.ageEstimate} years
            </span>
          ) : null}
          {orphan.cityArea ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {orphan.cityArea}
            </span>
          ) : null}
          {orphan.educationStatus ? (
            <span className="inline-flex items-center gap-1">
              <GraduationCap className="h-3.5 w-3.5" />
              {orphan.educationStatus}
            </span>
          ) : null}
        </div>
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-[#5f6b65]">
          {orphan.backgroundSummary ??
            'The sponsorship team can share more background information during follow-up.'}
        </p>
        <button
          className={cn(
            workSurface.primaryButton,
            'mt-4 h-10 w-full px-4 text-sm sm:mt-auto sm:translate-y-0',
            interestSent && 'border-emerald-700 bg-emerald-700',
          )}
          disabled={saving || interestSent}
          onClick={onExpressInterest}
          type="button"
        >
          {interestSent ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <HeartHandshake className="h-4 w-4" />
          )}
          {saving ? 'Sending...' : interestSent ? 'Interest Sent' : 'Express Interest'}
        </button>
      </div>
    </article>
  );
}

function OrphanImage({ orphan }: { orphan: AvailableOrphanSummary }) {
  if (!orphan.profileImageUrl) {
    return (
      <div className="flex min-h-52 items-center justify-center bg-[#edf4ef] text-[#17634d] sm:min-h-full">
        <HeartHandshake className="h-12 w-12" strokeWidth={1.4} />
      </div>
    );
  }

  return (
    <div className="relative min-h-60 overflow-hidden bg-[#edf4ef] sm:min-h-full">
      <Image
        alt={`${orphan.fullName} profile`}
        className="object-cover"
        fill
        sizes="(min-width: 1280px) 184px, (min-width: 640px) 184px, 100vw"
        src={orphan.profileImageUrl}
        unoptimized
      />
    </div>
  );
}

function ProfileCardsSkeleton({ count }: { count: number }) {
  return (
    <div
      aria-label="Loading available orphan profiles"
      className="mt-4 grid gap-3 xl:grid-cols-2"
      role="status"
    >
      {profileSkeletonKeys.slice(0, count).map((key) => (
        <div
          className="grid min-h-64 animate-pulse overflow-hidden rounded-lg border border-[#dfe5df] bg-white sm:grid-cols-[11.5rem_minmax(0,1fr)]"
          key={key}
        >
          <div className="bg-[#e8efea]" />
          <div className="p-4">
            <div className="flex gap-2">
              <span className="h-6 w-24 rounded bg-[#e8efea]" />
              <span className="h-6 w-20 rounded bg-[#f3ead2]" />
            </div>
            <div className="mt-3 h-4 w-20 rounded bg-[#e8efea]" />
            <div className="mt-3 h-7 w-44 max-w-full rounded bg-[#e8efea]" />
            <div className="mt-3 h-4 w-56 max-w-full rounded bg-[#e8efea]" />
            <div className="mt-4 h-10 w-full rounded bg-[#dce8e1]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function InfiniteProfilesLoader({
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
      { rootMargin: '500px 0px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  return (
    <div
      aria-live="polite"
      className="mt-3 min-h-12 text-center text-sm font-medium text-[#6b7280]"
      ref={sentinelRef}
    >
      {isLoadingMore ? (
        <>
          <ProfileCardsSkeleton count={4} />
          <span className="mt-3 inline-flex items-center gap-2">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Loading 10 more profiles...
          </span>
        </>
      ) : hasMore ? (
        <span>Scroll to load more profiles</span>
      ) : (
        <span>All available profiles loaded</span>
      )}
    </div>
  );
}
