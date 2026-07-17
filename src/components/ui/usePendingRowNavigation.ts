'use client';

import { useCallback, useState } from 'react';

import { useRouter } from 'next/navigation';

export function usePendingRowNavigation() {
  const router = useRouter();
  const [pendingRowId, setPendingRowId] = useState<string | null>(null);

  const navigateToRow = useCallback(
    (rowId: string, href: string) => {
      if (pendingRowId) return;

      setPendingRowId(rowId);
      router.push(href);
    },
    [pendingRowId, router],
  );

  return { navigateToRow, pendingRowId };
}
