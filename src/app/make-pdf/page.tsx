
"use client";

import { MakePdfPage } from '@/features/make-pdf/components/make-pdf-page';
import { FeaturePageLayout } from '@/layouts/feature-page-layout';

export default function MakePdf() {
  return (
      <FeaturePageLayout title="Make PDF" showModelSelector={false}>
        <MakePdfPage />
      </FeaturePageLayout>
  );
}
