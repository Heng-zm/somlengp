"use client";
import { useState, memo } from 'react';
import { Button } from '@/components/ui/button';
import { EMAIL_TEMPLATE_DEFAULT } from '@/config/contact';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// Gmail Components
import { GmailComponents } from '@/components/features/gmail/gmail-user-components';
import { GmailUserProfiles } from '@/components/features/gmail/gmail-user-profiles';
import { GmailNavigation } from '@/components/features/gmail/gmail-navigation';
import { GmailTemplateGenerator, IGmailEmailTemplate } from '@/components/features/gmail/gmail-template-generator';
// Sample Data
const sampleUsers = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    verified: true,
    online: true
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b5e5?w=150&h=150&fit=crop&crop=face',
    verified: true,
    online: false
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike.johnson@example.com',
    verified: false,
    online: true
  }
];
const sampleEmails = [
  {
    id: '1',
    from: sampleUsers[0],
    subject: 'Welcome to Gmail Redesign',
    preview: 'Thank you for trying out our new Gmail interface. We hope you enjoy the modern design and improved functionality.',
    timestamp: '2 hours ago',
    read: false,
    starred: true,
    hasAttachment: true,
    labels: ['Work', 'Important'],
    importance: 'high' as const
  },
  {
    id: '2',
    from: sampleUsers[1],
    subject: 'Meeting Schedule Update',
    preview: 'The team meeting has been rescheduled to Thursday at 3 PM. Please update your calendars accordingly.',
    timestamp: '5 hours ago',
    read: true,
    starred: false,
    hasAttachment: false,
    labels: ['Work']
  },
  {
    id: '3',
    from: sampleUsers[2],
    subject: 'Project Proposal',
    preview: 'I wanted to share the latest project proposal with you. Please review and let me know your thoughts.',
    timestamp: '1 day ago',
    read: true,
    starred: false,
    hasAttachment: true,
    labels: ['Personal', 'Review']
  }
];
const sampleProfile = {
  id: '1',
  name: 'John Doe',
  email: 'john.doe@example.com',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
  coverImage: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=400&fit=crop',
  bio: 'Product Manager with 8+ years of experience in tech. Passionate about building user-centric products that make a difference.',
  location: 'San Francisco, CA',
  website: 'https://johndoe.dev',
  company: 'Tech Corp',
  position: 'Senior Product Manager',
  joinDate: 'March 2020',
  lastActive: '2 hours ago',
  verified: true,
  premium: true,
  online: true,
  stats: {
    emails: 2847,
    contacts: 342,
    folders: 15
  },
  socialLinks: {
    twitter: 'https://twitter.com/johndoe',
    linkedin: 'https://linkedin.com/in/johndoe'
  }
};
const sampleTemplate: IGmailEmailTemplate = EMAIL_TEMPLATE_DEFAULT as IGmailEmailTemplate;
const GmailDemoPageComponent = function GmailDemoPage() {
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [emailTemplate, setEmailTemplate] = useState<IGmailEmailTemplate>(sampleTemplate);
  const handleEmailSelect = (emailId: string) => {
    setSelectedEmails(prev => 
      prev.includes(emailId) 
        ? prev.filter(id => id !== emailId)
        : [...prev, emailId]
    );
  };
  const handleEmailStar = (emailId: string) => {
    
  };
  const handleEmailArchive = (emailId: string) => {
    
  };
  const handleEmailDelete = (emailId: string) => {
    
  };
  const handleCompose = () => {
    
  };
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Gmail-Style Components Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Modern Gmail-inspired user interface components built with Tailwind CSS
          </p>
        </div>
        <Tabs defaultValue="layout" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="layout">Full Layout</TabsTrigger>
            <TabsTrigger value="components">Components</TabsTrigger>
            <TabsTrigger value="profiles">Profiles</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="inbox">Inbox</TabsTrigger>
            <TabsTrigger value="cards">User Cards</TabsTrigger>
          </TabsList>
          {/* Full Layout Demo */}
          <TabsContent value="layout" className="mt-6">
            <Card className="border-0 shadow-xl overflow-hidden">
              <CardHeader>
                <CardTitle>Gmail Layout Demo</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Complete Gmail-style layout with sidebar, navigation, and inbox
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[700px] bg-gray-50 dark:bg-gray-900">
                  <GmailNavigation.GmailLayout
                    sidebarCollapsed={sidebarCollapsed}
                    onSidebarToggle={setSidebarCollapsed}
                    onCompose={handleCompose}
                  >
                    <div className="flex flex-col h-full">
                      <GmailNavigation.GmailToolbar
                        selectedCount={selectedEmails.length}
                        onRefresh={() => {}}
                        onArchive={() => {}}
                        onDelete={() => {}}
                      />
                      <div className="flex-1 overflow-auto">
                        <GmailComponents.GmailInboxLayout
                          emails={sampleEmails}
                          selectedEmails={selectedEmails}
                          onEmailSelect={handleEmailSelect}
                          onEmailStar={handleEmailStar}
                          onEmailArchive={handleEmailArchive}
                          onEmailDelete={handleEmailDelete}
                        />
                      </div>
                    </div>
                  </GmailNavigation.GmailLayout>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          {/* Individual Components Demo */}
          <TabsContent value="components" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Navigation Sidebar */}
              <Card>
                <CardHeader>
                  <CardTitle>Gmail Sidebar</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-[500px] bg-gray-50 dark:bg-gray-900">
                    <GmailNavigation.GmailSidebar
                      collapsed={false}
                      onCompose={handleCompose}
                    />
                  </div>
                </CardContent>
              </Card>
              {/* Top Navigation */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Navigation & Toolbar</CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-4">
                  <GmailNavigation.GmailTopNav
                    onSearch={(query) => {}}
                  />
                  <GmailNavigation.GmailToolbar
                    selectedCount={2}
                    onRefresh={() => {}}
                    onArchive={() => {}}
                    onDelete={() => {}}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          {/* User Profiles Demo */}
          <TabsContent value="profiles" className="mt-6">
            <div className="space-y-8">
              {/* Profile Header */}
              <Card>
                <CardHeader>
                  <CardTitle>Gmail Profile Header</CardTitle>
                </CardHeader>
                <CardContent>
                  <GmailUserProfiles.GmailProfileHeader
                    profile={sampleProfile}
                    isOwnProfile={false}
                    onMessage={() => {}}
                    onFollow={() => {}}
                  />
                </CardContent>
              </Card>
              {/* Profile Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GmailUserProfiles.GmailProfileStats
                  profile={sampleProfile}
                />
                <GmailUserProfiles.GmailProfileCard
                  profile={sampleProfile}
                  variant="detailed"
                  showStats={true}
                  onClick={() => {}}
                />
              </div>
            </div>
          </TabsContent>
          {/* Email Templates Demo */}
          <TabsContent value="templates" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Template Builder */}
              <Card>
                <CardHeader>
                  <CardTitle>Template Builder</CardTitle>
                </CardHeader>
                <CardContent>
                  <GmailTemplateGenerator.GmailTemplateBuilder
                    template={emailTemplate}
                    onChange={setEmailTemplate}
                  />
                </CardContent>
              </Card>
              {/* Template Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Live Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <GmailTemplateGenerator.GmailEmailTemplate
                    template={emailTemplate}
                    preview={true}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          {/* Inbox Demo */}
          <TabsContent value="inbox" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Gmail Inbox Layout</CardTitle>
              </CardHeader>
              <CardContent>
                <GmailComponents.GmailInboxLayout
                  emails={sampleEmails}
                  selectedEmails={selectedEmails}
                  onEmailSelect={handleEmailSelect}
                  onEmailStar={handleEmailStar}
                  onEmailArchive={handleEmailArchive}
                  onEmailDelete={handleEmailDelete}
                />
              </CardContent>
            </Card>
          </TabsContent>
          {/* User Cards Demo */}
          <TabsContent value="cards" className="mt-6">
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">User Avatars</h3>
                <div className="flex space-x-4">
                  {sampleUsers.map(user => (
                    <GmailComponents.GmailUserAvatar
                      key={user.id}
                      user={user}
                      size="lg"
                      showOnline
                    />
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">User Cards - Detailed</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sampleUsers.map(user => (
                    <GmailComponents.GmailUserCard
                      key={user.id}
                      user={user}
                      variant="detailed"
                      showActions={true}
                      onClick={() => {}}
                    />
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">User Cards - Compact</h3>
                <div className="space-y-2 max-w-md">
                  {sampleUsers.map(user => (
                    <GmailComponents.GmailUserCard
                      key={user.id}
                      user={user}
                      variant="compact"
                      onClick={() => {}}
                    />
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Profile Cards</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <GmailUserProfiles.GmailProfileCard
                    profile={sampleProfile}
                    variant="minimal"
                    onClick={() => {}}
                  />
                  <GmailUserProfiles.GmailProfileCard
                    profile={sampleProfile}
                    variant="compact"
                    onClick={() => {}}
                  />
                  <GmailUserProfiles.GmailProfileCard
                    profile={sampleProfile}
                    variant="detailed"
                    showStats={true}
                    onClick={() => {}}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        {/* Documentation */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Components Documentation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Available Components</h4>
                <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>GmailUserAvatar - User avatar with verification and online status</li>
                  <li>GmailUserCard - User card with compact and detailed variants</li>
                  <li>GmailEmailItem - Individual email list item</li>
                  <li>GmailInboxLayout - Complete inbox interface</li>
                  <li>GmailSidebar - Collapsible navigation sidebar</li>
                  <li>GmailTopNav - Top navigation bar with search</li>
                  <li>GmailToolbar - Email action toolbar</li>
                  <li>GmailLayout - Complete Gmail layout wrapper</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Profile Components</h4>
                <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>GmailProfileHeader - Full profile header with cover image</li>
                  <li>GmailProfileStats - Activity statistics display</li>
                  <li>GmailProfileCard - Profile cards in various sizes</li>
                  <li>GmailTemplateGenerator - Email template builder</li>
                  <li>GmailTemplateBuilder - Interactive template editor</li>
                </ul>
              </div>
            </div>
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Usage:</strong> Import components from their respective modules and customize with Tailwind CSS classes.
                All components support dark mode and are fully responsive.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default memo(GmailDemoPageComponent);