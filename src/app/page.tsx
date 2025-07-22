
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ThreeDotsLoader } from '@/components/shared/three-dots-loader';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/home');
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <ThreeDotsLoader />
    </div>
  );
}
