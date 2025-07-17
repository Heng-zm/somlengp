import { AppLayout } from '@/layouts/app-layout';
import { SoundsPage } from '@/features/transcript-audio/components/sounds-page';

export default function Home() {
  return (
    <AppLayout>
      <SoundsPage />
    </AppLayout>
  );
}
