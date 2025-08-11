
"use client";

import { SoundsPage } from '@/features/transcript-audio/components/sounds-page';
import { FeaturePageLayout } from '@/layouts/feature-page-layout';
import { AuthGuard } from '@/components/auth/auth-guard';

export default function VoiceTranscript() {
  return (
      <FeaturePageLayout title="Voice Transcript" showModelSelector={true}>
        <AuthGuard>
          <SoundsPage />
        </AuthGuard>
      </FeaturePageLayout>
  );
}
