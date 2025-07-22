
"use client";

import { XRayAnalysisPage } from '@/features/x-ray-analysis/components/x-ray-analysis-page';
import { FeaturePageLayout } from '@/layouts/feature-page-layout';

export default function XRayAnalysis() {
  return (
      <FeaturePageLayout title="X-Ray Analysis" showModelSelector={false}>
        <XRayAnalysisPage />
      </FeaturePageLayout>
  );
}
