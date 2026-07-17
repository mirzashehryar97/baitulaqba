import { SkeletonBlock } from '@/components/ui/SkeletonBlock';

import { cn } from '@/lib/utils';

const SKELETON_ROWS = ['one', 'two', 'three', 'four', 'five', 'six'];
const SKELETON_CELLS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
const CELL_WIDTHS = [
  'w-28',
  'w-36',
  'w-24',
  'w-32',
  'w-20',
  'w-28',
  'w-24',
  'w-20',
  'w-24',
  'w-16',
];

export function TableRowsSkeleton({ columns, rows = 6 }: { columns: number; rows?: number }) {
  const cells = SKELETON_CELLS.slice(0, columns);

  return (
    <>
      {SKELETON_ROWS.slice(0, rows).map((row) => (
        <tr className="border-t border-emerald/8" key={`table-row-skeleton-${row}`}>
          {cells.map((cell, cellIndex) => (
            <td className="px-3 py-4" key={`table-row-skeleton-${row}-${cell}`}>
              <SkeletonBlock className={cn('h-4', CELL_WIDTHS[cellIndex % CELL_WIDTHS.length])} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
