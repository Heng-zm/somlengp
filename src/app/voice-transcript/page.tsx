
"use client";

import { SoundsPage } from '@/features/transcript-audio/components/sounds-page';
import { FeaturePageLayout } from '@/layouts/feature-page-layout';

export default function VoiceTranscript() {
  return (
      <FeaturePageLayout title="Voice Transcript">
        <SoundsPage />
      </FeaturePageLayout>
  );
}
