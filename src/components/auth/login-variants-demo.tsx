"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginButton } from '@/components/auth/login-button';

export function LoginVariantsDemo() {
  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Google Login UI Variants
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Choose from multiple modern and attractive Google login button designs for your application.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Default Variant */}
        <Card className="p-6">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg">Default</CardTitle>
            <CardDescription>
              Clean and simple outline style
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <LoginButton variant="default" />
          </CardContent>
        </Card>

        {/* Modern Variant */}
        <Card className="p-6">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg">Modern</CardTitle>
            <CardDescription>
              Enhanced with security badge and hover effects
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <LoginButton variant="modern" />
          </CardContent>
        </Card>

        {/* Minimal Variant */}
        <Card className="p-6">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg">Minimal</CardTitle>
            <CardDescription>
              Subtle ghost style with blue accent
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <LoginButton variant="minimal" />
          </CardContent>
        </Card>

        {/* Gradient Variant */}
        <Card className="p-6">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg">Gradient</CardTitle>
            <CardDescription>
              Eye-catching gradient background
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <LoginButton variant="gradient" />
          </CardContent>
        </Card>
      </div>

      {/* Usage Examples */}
      <Card className="mt-12">
        <CardHeader>
          <CardTitle>Usage Examples</CardTitle>
          <CardDescription>
            How to use the different variants in your components
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="font-semibold mb-2">Sidebar (Recommended: Modern)</h4>
            <code className="text-sm text-green-600 dark:text-green-400">
              {`<LoginButton variant="modern" />`}
            </code>
          </div>
          
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="font-semibold mb-2">Hero Section (Recommended: Gradient)</h4>
            <code className="text-sm text-green-600 dark:text-green-400">
              {`<LoginButton variant="gradient" />`}
            </code>
          </div>
          
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="font-semibold mb-2">Inline Content (Recommended: Minimal)</h4>
            <code className="text-sm text-green-600 dark:text-green-400">
              {`<LoginButton variant="minimal" />`}
            </code>
          </div>
          
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="font-semibold mb-2">Forms (Recommended: Default)</h4>
            <code className="text-sm text-green-600 dark:text-green-400">
              {`<LoginButton variant="default" />`}
            </code>
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
        <CardHeader>
          <CardTitle>✨ Enhanced Features</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-blue-600 dark:text-blue-400">🎨 Design</h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Official Google brand colors</li>
              <li>• Smooth hover animations</li>
              <li>• Dark mode compatible</li>
              <li>• Responsive design</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold text-purple-600 dark:text-purple-400">🔐 Security</h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Enhanced error handling</li>
              <li>• Popup + Redirect fallback</li>
              <li>• Security indicators</li>
              <li>• User-friendly messages</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold text-green-600 dark:text-green-400">⚡ Performance</h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Fast loading states</li>
              <li>• Optimized animations</li>
              <li>• Efficient rendering</li>
              <li>• Minimal bundle impact</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold text-orange-600 dark:text-orange-400">👤 User Experience</h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Rich user dropdown</li>
              <li>• Online status indicator</li>
              <li>• Profile management</li>
              <li>• Smooth transitions</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
