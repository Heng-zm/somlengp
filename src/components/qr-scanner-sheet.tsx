'use client';

import React, { useCallback, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  FileText,
  RefreshCw,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { OptimizedQRScanner } from './optimized-qr-scanner';
import { showErrorToast, showSuccessToast } from '@/lib/toast-utils';

interface QRScannerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScanSuccess?: (data: string) => void;
  onScanError?: (error: string) => void;
}

type QRContentType = 'URL' | 'Email' | 'Phone' | 'Wi-Fi' | 'Contact' | 'Text';

function getSafeWebUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

function getContentType(value: string): QRContentType {
  if (getSafeWebUrl(value)) return 'URL';
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Email';
  if (/^\+?[\d\s\-()]{7,}$/.test(value)) return 'Phone';
  if (value.startsWith('WIFI:')) return 'Wi-Fi';
  if (value.startsWith('VCARD:') || value.startsWith('BEGIN:VCARD')) return 'Contact';
  return 'Text';
}

async function copyText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textArea = document.createElement('textarea');
  textArea.value = value;
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  const copied = document.execCommand('copy');
  textArea.remove();
  if (!copied) throw new Error('Clipboard is unavailable');
}

export function QRScannerSheet({
  open,
  onOpenChange,
  onScanSuccess,
  onScanError,
}: QRScannerSheetProps) {
  const [scannedData, setScannedData] = useState('');
  const contentType = useMemo(() => getContentType(scannedData), [scannedData]);
  const webUrl = useMemo(() => getSafeWebUrl(scannedData), [scannedData]);

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    if (!nextOpen) setScannedData('');
    onOpenChange(nextOpen);
  }, [onOpenChange]);

  const handleClose = useCallback(() => {
    setScannedData('');
    onOpenChange(false);
  }, [onOpenChange]);

  const handleScanSuccess = useCallback((
    data: string,
    _location?: unknown,
    confidence?: number,
  ) => {
    setScannedData(data);
    showSuccessToast(
      'QR code scanned',
      confidence ? `${confidence}% detection confidence` : undefined,
      { silent: true },
    );
    onScanSuccess?.(data);
  }, [onScanSuccess]);

  const handleScanError = useCallback((error: string) => {
    showErrorToast('Unable to scan', error, { silent: true });
    onScanError?.(error);
  }, [onScanError]);

  const handleCopy = useCallback(async () => {
    if (!scannedData) return;

    try {
      await copyText(scannedData);
      showSuccessToast('Copied to clipboard', undefined, { silent: true });
    } catch {
      showErrorToast(
        'Copy failed',
        'Select the scanned content and copy it manually.',
        { silent: true },
      );
    }
  }, [scannedData]);

  const handleOpenUrl = useCallback(() => {
    if (!webUrl) return;
    window.open(webUrl.toString(), '_blank', 'noopener,noreferrer');
  }, [webUrl]);

  const handleScanAnother = useCallback(() => {
    setScannedData('');
  }, []);

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        className="flex max-h-[94dvh] flex-col rounded-t-3xl border-x-0 border-b-0 bg-background p-0 shadow-2xl"
      >
        <SheetHeader className="flex-none border-b border-border/70 px-5 pb-4 pt-3 text-left">
          <div className="mx-auto mb-2 h-1.5 w-11 rounded-full bg-muted-foreground/25" />
          <SheetTitle>{scannedData ? 'Scan complete' : 'Scan a QR code'}</SheetTitle>
          <SheetDescription>
            {scannedData
              ? 'Review the decoded content before copying it or opening a link.'
              : 'Point your camera at a QR code or scan one from an image.'}
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
          {!scannedData ? (
            <OptimizedQRScanner
              onScanSuccess={handleScanSuccess}
              onScanError={handleScanError}
              onClose={handleClose}
              className="mx-auto w-full max-w-xl"
              enableVibration
              enableSound={false}
              scanRegion="auto"
              scanQuality="balanced"
            />
          ) : (
            <div className="mx-auto w-full max-w-xl space-y-5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
              <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center dark:border-emerald-900/60 dark:bg-emerald-950/30">
                <CheckCircle2
                  className="mx-auto h-10 w-10 text-emerald-600 dark:text-emerald-400"
                  aria-hidden="true"
                />
                <h3 className="mt-3 text-lg font-semibold text-foreground">
                  QR code detected
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  The code was decoded successfully.
                </p>
              </section>

              <section
                className="rounded-2xl border border-border bg-card p-5"
                aria-labelledby="scanned-content-title"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <FileText className="h-5 w-5 flex-none text-muted-foreground" aria-hidden="true" />
                    <h3 id="scanned-content-title" className="truncate font-semibold text-foreground">
                      Scanned content
                    </h3>
                  </div>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    {contentType}
                  </span>
                </div>

                <div className="mt-4 max-h-48 overflow-auto rounded-xl bg-muted/70 p-4">
                  <p className="whitespace-pre-wrap break-all font-mono text-sm leading-relaxed text-foreground">
                    {scannedData}
                  </p>
                </div>
                <p className="mt-2 text-right text-xs text-muted-foreground">
                  {scannedData.length.toLocaleString()} characters
                </p>
              </section>

              <div className={`grid gap-3 ${webUrl ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
                <Button onClick={handleCopy} className="h-11 rounded-xl">
                  <Copy className="mr-2 h-4 w-4" aria-hidden="true" />
                  Copy content
                </Button>
                {webUrl && (
                  <Button
                    onClick={handleOpenUrl}
                    variant="outline"
                    className="h-11 rounded-xl"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
                    Open link
                  </Button>
                )}
              </div>

              <Button
                onClick={handleScanAnother}
                variant="ghost"
                className="h-11 w-full rounded-xl"
              >
                <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
                Scan another code
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
