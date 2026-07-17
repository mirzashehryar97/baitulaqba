'use client';

import { createContext, useContext, useState } from 'react';

import dynamic from 'next/dynamic';

// The dialog pulls in framer-motion, ~15 lucide icons and the lamp success
// animation. It is only ever shown after a user clicks "Sponsor", so it is
// loaded with next/dynamic and mounted lazily on first open — keeping this
// provider (imported eagerly by every public page) out of that heavy chunk.
const SponsorOrphanDialog = dynamic(
  () => import('@/components/ui/SponsorOrphanDialog').then((mod) => mod.SponsorOrphanDialog),
  { ssr: false },
);

type SponsorOrphanContextValue = {
  openSponsorForm: () => void;
};

const SponsorOrphanContext = createContext<SponsorOrphanContextValue | null>(null);

export function SponsorOrphanProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  // Once the dialog has been requested we keep it mounted so its close/exit
  // animation still runs when `open` flips back to false.
  const [hasOpened, setHasOpened] = useState(false);

  const openSponsorForm = () => {
    setHasOpened(true);
    setOpen(true);
  };

  return (
    <SponsorOrphanContext.Provider value={{ openSponsorForm }}>
      {children}
      {hasOpened ? <SponsorOrphanDialog open={open} onOpenChange={setOpen} /> : null}
    </SponsorOrphanContext.Provider>
  );
}

export function useSponsorOrphanForm() {
  const context = useContext(SponsorOrphanContext);

  if (!context) {
    throw new Error('useSponsorOrphanForm must be used inside SponsorOrphanProvider');
  }

  return context;
}
