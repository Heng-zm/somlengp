"use client";

import { TextToolsPage } from '@/features/text-tools/components/text-tools-page';
import { FeaturePageLayout } from '@/layouts/feature-page-layout';

export default function TextTools() {
  return (
    <FeaturePageLayout title="Text Tools" showModelSelector={false}>
      <TextToolsPage />
    </FeaturePageLayout>
  );
}
