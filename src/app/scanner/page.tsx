'use client';

import { memo, useCallback, useState } from 'react';
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Clipboard,
  Layers3,
  ScanLine,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { FeaturePageLayout } from '@/layouts/feature-page-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { QRScanner } from '@/components/qr-scanner';
import { OptimizedQRScanner } from '@/components/optimized-qr-scanner';
import { SimpleQRScanner } from '@/components/simple-qr-scanner';
import { QRScannerSheet } from '@/components/qr-scanner-sheet';
import { cn } from '@/lib/utils';

type ScannerMode = 'optimized' | 'basic' | 'simple' | null;

const scannerOptions = [
  {
    id: 'optimized' as const,
    title: 'Smart scanner',
    description: 'Fast camera scanning with automatic fallbacks.',
    icon: Zap,
    recommended: true,
  },
  {
    id: 'basic' as const,
    title: 'Basic scanner',
    description: 'Standard camera scanner for modern browsers.',
    icon: Camera,
  },
  {
    id: 'simple' as const,
    title: 'Compatibility mode',
    description: 'Lightweight scanner for older devices.',
    icon: ScanLine,
  },
];

const ScannerPageComponent = function ScannerPage() {
  const [mode, setMode] = useState<ScannerMode>('optimized');
  const [showScannerSheet, setShowScannerSheet] = useState(false);
  const [lastScanResult, setLastScanResult] = useState('');
  const [scanError, setScanError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleScanSuccess = useCallback((data: string) => {
    setLastScanResult(data);
    setScanError('');
    setCopied(false);
  }, []);

  const handleScanError = useCallback((error: string) => {
    setScanError(error);
  }, []);

  const handleClose = useCallback(() => {
    setMode(null);
    setShowScannerSheet(false);
  }, []);

  const copyResult = useCallback(async () => {
    if (!lastScanResult) {
      return;
    }
    await navigator.clipboard.writeText(lastScanResult);
    setCopied(true);
  }, [lastScanResult]);

  return (
    <FeaturePageLayout title="QR Code Scanner">
      <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
            <Card className="overflow-hidden p-6 sm:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20">
                  <ScanLine className="h-6 w-6" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-400">
                    Camera workspace
                  </p>
                  <h2 className="mt-2 text-xl font-bold text-slate-950 dark:text-white sm:text-2xl">
                    Scan a QR code securely
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                    Point your camera at a code or upload an image. Scanning happens on your device.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-950 dark:text-white">
                  Private by design
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  Camera frames are processed locally.
                </p>
              </div>
            </Card>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {scannerOptions.map((option) => {
              const active = mode === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setMode(option.id)}
                  className={cn(
                    'relative rounded-xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900',
                    active
                      ? 'border-blue-500 ring-2 ring-blue-500/15 dark:border-blue-400'
                      : 'border-slate-200 hover:border-blue-200 dark:border-slate-800 dark:hover:border-blue-500/40'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-lg',
                        active
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'
                      )}
                    >
                      <option.icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    {option.recommended && (
                      <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="mt-4 text-sm font-semibold text-slate-950 dark:text-white">
                    {option.title}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    {option.description}
                  </p>
                </button>
              );
            })}
          </div>

          {lastScanResult && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                    Code detected
                  </p>
                  <p className="mt-1 break-all font-mono text-xs leading-5 text-emerald-800 dark:text-emerald-300">
                    {lastScanResult}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={copyResult}>
                  <Clipboard className="h-4 w-4" />
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>
          )}

          {scanError && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="text-sm font-semibold">Unable to scan</p>
                <p className="mt-1 text-sm">{scanError}</p>
              </div>
            </div>
          )}

          {mode && (
            <Card className="overflow-hidden p-4 sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-slate-950 dark:text-white">
                    {scannerOptions.find((option) => option.id === mode)?.title}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Allow camera access when prompted.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowScannerSheet(true)}>
                  <Layers3 className="h-4 w-4" />
                  Open sheet
                </Button>
              </div>

              {mode === 'optimized' && (
                <OptimizedQRScanner
                  onScanSuccess={handleScanSuccess}
                  onScanError={handleScanError}
                  onClose={handleClose}
                  className="mx-auto w-full max-w-md"
                  enableVibration
                  enableSound={false}
                  scanRegion="auto"
                  scanQuality="balanced"
                />
              )}
              {mode === 'basic' && (
                <QRScanner
                  onScanSuccess={handleScanSuccess}
                  onScanError={handleScanError}
                  onClose={handleClose}
                  className="mx-auto w-full max-w-md"
                />
              )}
              {mode === 'simple' && (
                <SimpleQRScanner
                  onScanSuccess={handleScanSuccess}
                  onScanError={handleScanError}
                  onClose={handleClose}
                  className="mx-auto w-full max-w-md"
                />
              )}
            </Card>
          )}

          <details className="rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <summary className="cursor-pointer font-semibold text-slate-700 dark:text-slate-200">
              Browser compatibility
            </summary>
            <dl className="mt-4 grid gap-3 text-xs text-slate-500 dark:text-slate-400 sm:grid-cols-2">
              <div>
                <dt className="font-medium text-slate-700 dark:text-slate-200">Secure context</dt>
                <dd className="mt-1">{typeof window !== 'undefined' && window.isSecureContext ? 'Available' : 'Unavailable'}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-700 dark:text-slate-200">Camera API</dt>
                <dd className="mt-1">
                  {typeof navigator !== 'undefined' &&
                  'mediaDevices' in navigator &&
                  typeof navigator.mediaDevices.getUserMedia === 'function'
                    ? 'Supported'
                    : 'Unsupported'}
                </dd>
              </div>
            </dl>
          </details>

          <QRScannerSheet
            open={showScannerSheet}
            onOpenChange={setShowScannerSheet}
            onScanSuccess={handleScanSuccess}
            onScanError={handleScanError}
          />
        </div>
      </div>
    </FeaturePageLayout>
  );
};

export default memo(ScannerPageComponent);
