
"use client";

import { ChatPage } from '@/features/chat-with-ai/components/chat-page';
import { FeaturePageLayout } from '@/layouts/feature-page-layout';

export default function ChatWithAi() {
  return (
      <FeaturePageLayout title="Chat With AI" showModelSelector={false}>
        <ChatPage />
      </FeaturePageLayout>
  );
}
