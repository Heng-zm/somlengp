
"use client";

import { ConvertImageFormatPage } from '@/features/convert-image-format/components/convert-image-format-page';
import { FeaturePageLayout } from '@/layouts/feature-page-layout';

export default function ConvertImageFormat() {
  return (
      <FeaturePageLayout title="Convert Image Format" showModelSelector={false}>
        <ConvertImageFormatPage />
      </FeaturePageLayout>
  );
}
