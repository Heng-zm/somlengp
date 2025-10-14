'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Center, AuthCenter, LoadingCenter, ModalCenter, HeroCenter } from '@/components/ui/layout';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Loader2, 
  Star, 
  Heart, 
  Sparkles, 
  Target, 
  Grid3x3,
  Layout,
  MousePointer,
  Smartphone,
  Monitor
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DemoSectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}

const DemoSection = ({ title, description, children, className }: DemoSectionProps) => (
  <div className={cn('space-y-4', className)}>
    <div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
    {children}
    <Separator />
  </div>
);

const DemoCard = ({ children, title, className }: { children: React.ReactNode; title: string; className?: string }) => (
  <div className="space-y-2">
    <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
    <div className={cn('border rounded-lg p-4 min-h-[120px] relative', className)}>
      {children}
    </div>
  </div>
);

export default function CenterAlignmentDemo() {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const simulateLoading = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="center-content mb-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Perfect Center Alignment Demo</h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Explore all the centering patterns and utilities available in the design system.
          </p>
          <Badge variant="outline" className="text-sm">
            Interactive Demo
          </Badge>
        </div>
      </div>

      <ScrollArea className="h-[80vh]">
        <div className="space-y-8">
          
          {/* Basic Center Utilities */}
          <DemoSection
            title="Basic Center Utilities"
            description="Essential centering classes for everyday use"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <DemoCard title=".center-content" className="center-content">
                <div className="bg-primary text-primary-foreground px-4 py-2 rounded">
                  <Target className="w-6 h-6" />
                </div>
              </DemoCard>
              
              <DemoCard title=".center-x (horizontal only)" className="center-x">
                <div className="bg-secondary text-secondary-foreground px-4 py-2 rounded">
                  Centered Horizontally
                </div>
              </DemoCard>
              
              <DemoCard title=".center-y (vertical only)" className="center-y h-full">
                <div className="bg-accent text-accent-foreground px-4 py-2 rounded">
                  Centered Vertically
                </div>
              </DemoCard>
            </div>
          </DemoSection>

          {/* Card Centering */}
          <DemoSection
            title="Card Center Variants"
            description="Cards with different centering approaches"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card variant="centered" className="min-h-[200px]">
                <CardHeader centered>
                  <Star className="w-12 h-12 text-primary mb-4" />
                  <CardTitle>Centered Card</CardTitle>
                  <CardDescription>All content is perfectly centered</CardDescription>
                </CardHeader>
                <CardContent centered>
                  <Button>Action Button</Button>
                </CardContent>
              </Card>

              <Card variant="hero" className="min-h-[200px]">
                <CardContent className="center-card-content">
                  <Sparkles className="w-16 h-16 text-primary mb-4" />
                  <h3 className="text-2xl font-bold mb-2">Hero Card</h3>
                  <p className="text-muted-foreground mb-4">Perfect for showcasing features</p>
                  <Button size="lg">Get Started</Button>
                </CardContent>
              </Card>
            </div>
          </DemoSection>

          {/* Button Centering */}
          <DemoSection
            title="Button Center Alignment"
            description="Buttons with perfect icon and text centering"
          >
            <div className="center-button-group flex-wrap">
              <Button leftIcon={<Heart className="w-4 h-4" />}>
                With Left Icon
              </Button>
              <Button rightIcon={<Star className="w-4 h-4" />}>
                With Right Icon
              </Button>
              <Button 
                loading={loading}
                onClick={simulateLoading}
              >
                {loading ? 'Loading...' : 'Test Loading'}
              </Button>
              <Button size="icon" className="center-icon">
                <Grid3x3 className="w-4 h-4" />
              </Button>
            </div>
          </DemoSection>

          {/* Layout Components */}
          <DemoSection
            title="Layout Center Components"
            description="Specialized components for different centering needs"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <DemoCard title="Center Component (default)" className="bg-muted/30">
                <Center className="h-full">
                  <div className="bg-primary text-primary-foreground px-4 py-2 rounded">
                    Default Center
                  </div>
                </Center>
              </DemoCard>

              <DemoCard title="Center Component (constrained)" className="bg-muted/30">
                <Center size="sm" className="h-full">
                  <div className="bg-secondary text-secondary-foreground px-4 py-2 rounded text-center">
                    Small Constrained Center
                  </div>
                </Center>
              </DemoCard>

            </div>
          </DemoSection>

          {/* Loading States */}
          <DemoSection
            title="Loading State Centering"
            description="Perfect centering for loading indicators"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <DemoCard title="Loading Center" className="bg-muted/30">
                <LoadingCenter>
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </LoadingCenter>
              </DemoCard>

              <DemoCard title="Center Loading (utility)" className="bg-muted/30 center-loading">
                <div className="center-content">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mr-2" />
                  <span className="text-sm">Processing...</span>
                </div>
              </DemoCard>

            </div>
          </DemoSection>

          {/* Hero Sections */}
          <DemoSection
            title="Hero Section Centering"
            description="Perfect for landing pages and hero content"
          >
            <div className="border rounded-lg overflow-hidden">
              <HeroCenter className="bg-gradient-to-b from-primary/10 to-background min-h-[300px]">
                <div className="text-center space-y-4 max-w-lg">
                  <div className="center-content mb-4">
                    <Layout className="w-16 h-16 text-primary" />
                  </div>
                  <h2 className="text-3xl font-bold">Perfect Hero Section</h2>
                  <p className="text-lg text-muted-foreground">
                    Beautifully centered hero content with responsive design
                  </p>
                  <div className="center-button-group">
                    <Button size="lg">Primary Action</Button>
                    <Button variant="outline" size="lg">Secondary</Button>
                  </div>
                </div>
              </HeroCenter>
            </div>
          </DemoSection>

          {/* Modal/Dialog Centering */}
          <DemoSection
            title="Modal & Dialog Centering"
            description="Perfect modal positioning and content centering"
          >
            <div className="center-content">
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <MousePointer className="w-4 h-4 mr-2" />
                    Open Centered Dialog
                  </Button>
                </DialogTrigger>
                <DialogContent size="md" centered>
                  <DialogHeader centered>
                    <div className="center-icon mb-4">
                      <Sparkles className="w-12 h-12 text-primary" />
                    </div>
                    <DialogTitle>Perfectly Centered Dialog</DialogTitle>
                    <DialogDescription>
                      This dialog demonstrates perfect centering with custom size and positioning.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="center-content py-6">
                    <p className="text-center text-muted-foreground mb-6">
                      All content within this dialog is perfectly centered, creating a harmonious and professional appearance.
                    </p>
                    <div className="center-button-group">
                      <Button>Confirm</Button>
                      <Button variant="outline">Cancel</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </DemoSection>

          {/* Responsive Centering */}
          <DemoSection
            title="Responsive Center Utilities"
            description="Centering that adapts to different screen sizes"
          >
            <div className="space-y-4">
              
              <DemoCard title="Mobile vs Desktop Centering" className="bg-muted/30">
                <div className="center-mobile md:center-desktop h-full">
                  <div className="bg-primary text-primary-foreground px-4 py-2 rounded">
                    <Smartphone className="w-4 h-4 inline mr-2 md:hidden" />
                    <Monitor className="w-4 h-4 inline mr-2 hidden md:inline" />
                    Responsive Center
                  </div>
                </div>
              </DemoCard>

              <DemoCard title="Safe Area Centering" className="bg-muted/30 min-h-[150px]">
                <div className="center-safe relative h-full">
                  <div className="bg-secondary text-secondary-foreground px-4 py-2 rounded">
                    Safe Area Aware
                  </div>
                </div>
              </DemoCard>

            </div>
          </DemoSection>

          {/* Utility Classes Summary */}
          <DemoSection
            title="Available Utility Classes"
            description="Complete reference of all centering utilities"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Basic Centering</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <code className="block">.center-content</code>
                  <code className="block">.center-x</code>
                  <code className="block">.center-y</code>
                  <code className="block">.center-absolute</code>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Layout Centering</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <code className="block">.center-full</code>
                  <code className="block">.center-viewport</code>
                  <code className="block">.center-modal</code>
                  <code className="block">.center-hero</code>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Specialized</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <code className="block">.center-loading</code>
                  <code className="block">.center-button</code>
                  <code className="block">.center-icon</code>
                  <code className="block">.center-safe</code>
                </CardContent>
              </Card>

            </div>
          </DemoSection>

        </div>
      </ScrollArea>
    </div>
  );
}