
"use client";

import { CombinePdfPage } from '@/features/combine-pdf/components/combine-pdf-page';
import { FeaturePageLayout } from '@/layouts/feature-page-layout';

export default function CombinePdf() {
  return (
      <FeaturePageLayout title="Combine PDF" showModelSelector={false}>
        <CombinePdfPage />
      </FeaturePageLayout>
  );
}
