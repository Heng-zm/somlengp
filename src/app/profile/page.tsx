"use client";

import { AuthGuard } from '@/components/auth/auth-guard';
import { FeaturePageLayout } from '@/layouts/feature-page-layout';
import { OptimizedProfile } from '@/components/profile/optimized-profile';
import { memo } from 'react';


const ProfilePageComponent = memo(function ProfilePage() {
  return (
    <AuthGuard>
      <FeaturePageLayout title="Profile">
        <OptimizedProfile />
      </FeaturePageLayout>
    </AuthGuard>
  );
});

export default ProfilePageComponent;
