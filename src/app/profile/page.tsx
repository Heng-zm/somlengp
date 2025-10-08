'use client';

import { useState, useEffect, useMemo } from 'react';
import { FeaturePageLayout } from '@/layouts/feature-page-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  Settings, 
  Bell, 
  Shield, 
  Eye, 
  Palette,
  Globe,
  Clock,
  Trash2,
  Save,
  Edit3
} from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { UserPreferences, defaultUserPreferences, mergePreferences, validatePreferences } from '@/lib/user-preferences';
import { toast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  joinedAt: string;
  preferences: UserPreferences;
}

export default function ProfilePage() {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<UserProfile>({
    id: '1',
    name: 'User',
    email: 'user@example.com',
    joinedAt: new Date().toISOString(),
    preferences: defaultUserPreferences
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [tempPreferences, setTempPreferences] = useState<UserPreferences>(defaultUserPreferences);

  useEffect(() => {
    // Load user profile from localStorage or API
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        setProfile(parsed);
        setTempPreferences(parsed.preferences);
      } catch (error) {
        console.error('Failed to load profile:', error);
      }
    }
  }, []);

  const handlePreferenceChange = (category: keyof UserPreferences, field: string, value: any) => {
    setTempPreferences(prev => {
      const updated = { ...prev };
      if (typeof updated[category] === 'object' && updated[category] !== null) {
        (updated[category] as any)[field] = value;
      } else {
        (updated as any)[category] = value;
      }
      return updated;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const validation = validatePreferences(tempPreferences);
      if (!validation.valid) {
        toast({
          title: 'Validation Error',
          description: validation.errors.join(', '),
          variant: 'destructive'
        });
        return;
      }

      const updatedProfile = {
        ...profile,
        preferences: mergePreferences(profile.preferences, tempPreferences)
      };

      // Save to localStorage (in real app, save to API)
      localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
      setProfile(updatedProfile);
      setIsEditing(false);

      toast({
        title: 'Profile Updated',
        description: 'Your preferences have been saved successfully.',
      });
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: 'Failed to save your preferences. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setTempPreferences(profile.preferences);
    setIsEditing(false);
  };

  const profileInfo = useMemo(() => (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={profile.avatar} alt={profile.name} />
            <AvatarFallback className="text-2xl">
              {profile.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-2xl">{profile.name}</CardTitle>
            <CardDescription className="text-base">{profile.email}</CardDescription>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary">
                Joined {new Date(profile.joinedAt).toLocaleDateString()}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  ), [profile]);

  const generalSettings = useMemo(() => (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="theme">Theme</Label>
          <Select
            value={tempPreferences.theme}
            onValueChange={(value) => handlePreferenceChange('theme', '', value)}
            disabled={!isEditing}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="language">Language</Label>
          <Select
            value={tempPreferences.language}
            onValueChange={(value) => handlePreferenceChange('language', '', value)}
            disabled={!isEditing}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="km">ខ្មែរ (Khmer)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Input
            id="timezone"
            value={tempPreferences.timezone}
            onChange={(e) => handlePreferenceChange('timezone', '', e.target.value)}
            disabled={!isEditing}
          />
        </div>
      </div>
    </div>
  ), [tempPreferences, isEditing]);

  const notificationSettings = useMemo(() => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>Email Notifications</Label>
            <p className="text-sm text-muted-foreground">Receive notifications via email</p>
          </div>
          <Switch
            checked={tempPreferences.notifications.email}
            onCheckedChange={(checked) => handlePreferenceChange('notifications', 'email', checked)}
            disabled={!isEditing}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Push Notifications</Label>
            <p className="text-sm text-muted-foreground">Receive push notifications</p>
          </div>
          <Switch
            checked={tempPreferences.notifications.push}
            onCheckedChange={(checked) => handlePreferenceChange('notifications', 'push', checked)}
            disabled={!isEditing}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>AI Assistant Updates</Label>
            <p className="text-sm text-muted-foreground">Get notified about AI assistant improvements</p>
          </div>
          <Switch
            checked={tempPreferences.notifications.aiAssistantUpdates}
            onCheckedChange={(checked) => handlePreferenceChange('notifications', 'aiAssistantUpdates', checked)}
            disabled={!isEditing}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Security Alerts</Label>
            <p className="text-sm text-muted-foreground">Important security notifications</p>
          </div>
          <Switch
            checked={tempPreferences.notifications.securityAlerts}
            onCheckedChange={(checked) => handlePreferenceChange('notifications', 'securityAlerts', checked)}
            disabled={!isEditing}
          />
        </div>
      </div>
    </div>
  ), [tempPreferences, isEditing]);

  const privacySettings = useMemo(() => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label>Profile Visibility</Label>
          <Select
            value={tempPreferences.privacy.profileVisibility}
            onValueChange={(value) => handlePreferenceChange('privacy', 'profileVisibility', value)}
            disabled={!isEditing}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="private">Private</SelectItem>
              <SelectItem value="friends">Friends Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Show Email</Label>
            <p className="text-sm text-muted-foreground">Display email on your profile</p>
          </div>
          <Switch
            checked={tempPreferences.privacy.showEmail}
            onCheckedChange={(checked) => handlePreferenceChange('privacy', 'showEmail', checked)}
            disabled={!isEditing}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Allow Analytics</Label>
            <p className="text-sm text-muted-foreground">Help improve the app with usage analytics</p>
          </div>
          <Switch
            checked={tempPreferences.privacy.allowAnalytics}
            onCheckedChange={(checked) => handlePreferenceChange('privacy', 'allowAnalytics', checked)}
            disabled={!isEditing}
          />
        </div>
      </div>
    </div>
  ), [tempPreferences, isEditing]);

  return (
    <FeaturePageLayout
      title="Profile"
      rightElement={
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
              >
                <Save className="h-4 w-4 mr-1" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit3 className="h-4 w-4 mr-1" />
              Edit
            </Button>
          )}
        </div>
      }
    >
      <div className="container max-w-4xl mx-auto p-4 space-y-6">
        {profileInfo}
        
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Privacy
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              AI Assistant
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  General Settings
                </CardTitle>
                <CardDescription>
                  Customize your app appearance and behavior
                </CardDescription>
              </CardHeader>
              <CardContent>
                {generalSettings}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Control how you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                {notificationSettings}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Privacy Settings
                </CardTitle>
                <CardDescription>
                  Control your data and profile visibility
                </CardDescription>
              </CardHeader>
              <CardContent>
                {privacySettings}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  AI Assistant Settings
                </CardTitle>
                <CardDescription>
                  Customize your AI assistant experience
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label>AI Model</Label>
                    <Select
                      value={tempPreferences.aiAssistant.model}
                      onValueChange={(value) => handlePreferenceChange('aiAssistant', 'model', value)}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash</SelectItem>
                        <SelectItem value="gemini-2.0-flash-exp">Gemini 2.0 Flash (Experimental)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto Save Conversations</Label>
                      <p className="text-sm text-muted-foreground">Automatically save chat history</p>
                    </div>
                    <Switch
                      checked={tempPreferences.aiAssistant.autoSave}
                      onCheckedChange={(checked) => handlePreferenceChange('aiAssistant', 'autoSave', checked)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </FeaturePageLayout>
  );
}