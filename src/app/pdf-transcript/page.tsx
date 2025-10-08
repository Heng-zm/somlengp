
"use client";

import { PdfTranscriptPage } from '@/features/transcript-pdf/components/pdf-transcript-page';
import { FeaturePageLayout } from '@/layouts/feature-page-layout';

export default function PdfTranscript() {
  return (
      <FeaturePageLayout title="PDF Transcript">
        <PdfTranscriptPage />
      </FeaturePageLayout>
  );
}
