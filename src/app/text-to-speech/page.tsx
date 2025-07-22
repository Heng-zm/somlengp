
"use client";

import { TextToSpeechPage } from '@/features/text-to-speech/components/text-to-speech-page';
import { FeaturePageLayout } from '@/layouts/feature-page-layout';

export default function TextToSpeech() {
  return (
      <FeaturePageLayout title="Text to Speech" showModelSelector={false}>
        <TextToSpeechPage />
      </FeaturePageLayout>
  );
}
