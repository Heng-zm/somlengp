
"use client";

import { TextToSpeechPage } from '@/features/text-to-speech/components/text-to-speech-page';
import { FeaturePageLayout } from '@/layouts/feature-page-layout';
import { useMemo, useContext } from 'react';
import { allTranslations } from '@/lib/translations';
import { LanguageContext } from '@/contexts/language-context';

export default function TextToSpeech() {
  const langContext = useContext(LanguageContext);
  if (!langContext) {
    throw new Error('TextToSpeech must be used within a LanguageProvider');
  }
  const { language } = langContext;
  const t = useMemo(() => allTranslations[language], [language]);

  return (
      <FeaturePageLayout title={t.textToSpeechTitle} showModelSelector={false}>
        <TextToSpeechPage />
      </FeaturePageLayout>
  );
}
