'use client';

import { useState } from 'react';

import { Download, LoaderCircle } from 'lucide-react';

import { useToast } from '@/components/ui/ToastProvider';

export function SponsorshipCertificateButton({ matchId }: { matchId: string }) {
  const toast = useToast();
  const [downloading, setDownloading] = useState(false);

  const downloadCertificate = async () => {
    setDownloading(true);

    try {
      const response = await fetch(`/api/portal/sponsorships/${matchId}/certificate`);

      if (!response.ok) {
        const responseBody = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;

        toast({
          description: responseBody?.error ?? 'The certificate could not be generated.',
          title: 'Certificate not ready',
          type: 'error',
        });
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      const contentDisposition = response.headers.get('content-disposition');
      const fileName = contentDisposition?.match(/filename="?([^";]+)"?/i)?.[1];

      anchor.href = url;
      anchor.download = fileName ?? 'sponsorship-certificate.pdf';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast({
        description: 'Please check your connection and try again.',
        title: 'Download failed',
        type: 'error',
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      aria-busy={downloading}
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold text-[#075d46] underline-offset-4 transition hover:bg-white/70 hover:underline disabled:cursor-wait disabled:opacity-60"
      disabled={downloading}
      onClick={downloadCertificate}
      type="button"
    >
      {downloading ? (
        <LoaderCircle className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {downloading ? 'Preparing...' : 'Download Certificate'}
    </button>
  );
}
