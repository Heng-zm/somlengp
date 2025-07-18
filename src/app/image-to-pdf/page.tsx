
"use client";

import { ImageToPdfPage } from '@/features/image-to-pdf/components/image-to-pdf-page';
import { FeaturePageLayout } from '@/layouts/feature-page-layout';

export default function ImageToPdf() {
  return (
      <FeaturePageLayout title="Image to PDF" showModelSelector={false}>
        <ImageToPdfPage />
      </FeaturePageLayout>
  );
}
