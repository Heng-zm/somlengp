'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowRight, Check, Mic, FileText, Image as ImageIcon, Wand2, AudioLines, Sparkles, Play, Zap, Shield, Users, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function FeaturesPage() {
  const [activeFeature, setActiveFeature] = useState(0)

  const mainFeatures = [
    {
      icon: Mic,
      title: "Voice Transcription",
      description: "Convert speech to text with industry-leading accuracy",
      details: [
        "99% accuracy with advanced AI models",
        "Support for 50+ languages and dialects",
        "Real-time transcription capabilities",
        "Speaker identification and diarization",
        "Custom vocabulary and terminology",
        "Multiple audio format support"
      ],
      color: "text-blue-600 bg-blue-100",
      stats: { accuracy: "99%", languages: "50+", speed: "Real-time" }
    },
    {
      icon: Sparkles,
      title: "AI Assistant",
      description: "Intelligent assistant powered by Gemini 1.5 Flash",
      details: [
        "Natural conversation interface",
        "Context-aware responses",
        "Multi-modal capabilities (text, image, code)",
        "Task automation and scheduling",
        "Integration with popular tools",
        "Personalized recommendations"
      ],
      color: "text-purple-600 bg-purple-100",
      stats: { model: "Gemini 1.5", response: "<2s", accuracy: "95%" }
    },
    {
      icon: FileText,
      title: "PDF Processing",
      description: "Advanced PDF manipulation and analysis tools",
      details: [
        "Text extraction and OCR",
        "Document merging and splitting",
        "Form filling and data extraction",
        "Digital signature support",
        "Password protection and encryption",
        "Batch processing capabilities"
      ],
      color: "text-green-600 bg-green-100",
      stats: { formats: "20+", speed: "Fast", security: "Enterprise" }
    },
    {
      icon: AudioLines,
      title: "Text to Speech",
      description: "Natural-sounding voice synthesis",
      details: [
        "Neural voice models",
        "Multiple voice options and accents",
        "SSML markup support",
        "Custom pronunciation dictionaries",
        "Batch audio generation",
        "High-quality audio output"
      ],
      color: "text-orange-600 bg-orange-100",
      stats: { voices: "100+", quality: "HD", languages: "40+" }
    },
    {
      icon: ImageIcon,
      title: "Image Processing",
      description: "Comprehensive image editing and conversion",
      details: [
        "Format conversion (JPEG, PNG, WEBP, etc.)",
        "Resize and crop operations",
        "Compression optimization",
        "Watermark and annotation tools",
        "Background removal",
        "Batch processing support"
      ],
      color: "text-pink-600 bg-pink-100",
      stats: { formats: "15+", compression: "90%", speed: "Instant" }
    },
    {
      icon: Wand2,
      title: "Format Conversion",
      description: "Universal file format transformation",
      details: [
        "Document format conversion",
        "Video and audio processing",
        "Archive creation and extraction",
        "Metadata preservation",
        "Quality optimization",
        "Automated workflows"
      ],
      color: "text-indigo-600 bg-indigo-100",
      stats: { formats: "100+", preservation: "100%", automation: "Yes" }
    }
  ]

  const enterpriseFeatures = [
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-grade security for your sensitive data",
      features: ["End-to-end encryption", "SOC 2 compliance", "SSO integration", "Audit logs"]
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Work together seamlessly across your organization",
      features: ["Shared workspaces", "Role-based access", "Project management", "Real-time collaboration"]
    },
    {
      icon: BarChart3,
      title: "Analytics & Insights",
      description: "Detailed analytics to optimize your workflow",
      features: ["Usage analytics", "Performance metrics", "Custom reports", "Export capabilities"]
    },
    {
      icon: Zap,
      title: "API & Integrations",
      description: "Connect with your existing tools and workflows",
      features: ["RESTful API", "Webhooks", "Popular integrations", "Custom connectors"]
    }
  ]

  const comparisonFeatures = [
    { name: "Voice Transcription", free: "5 min/day", pro: "Unlimited", enterprise: "Unlimited + Custom Models" },
    { name: "AI Assistant", free: "Basic", pro: "Advanced", enterprise: "Custom Training" },
    { name: "PDF Processing", free: "Basic tools", pro: "Advanced tools", enterprise: "Enterprise tools + API" },
    { name: "File Storage", free: "100 MB", pro: "10 GB", enterprise: "Unlimited" },
    { name: "Team Members", free: "1", pro: "10", enterprise: "Unlimited" },
    { name: "API Access", free: "❌", pro: "✅", enterprise: "✅ + Priority" },
    { name: "Custom Integrations", free: "❌", pro: "❌", enterprise: "✅" },
    { name: "24/7 Support", free: "❌", pro: "Email", enterprise: "Phone + Email" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/home" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Somleng</span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</Link>
              <Link href="/contact" className="text-gray-600 hover:text-gray-900 transition-colors">Contact</Link>
              <Link href="/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-6 bg-blue-100 text-blue-800 border-blue-200">
            ⚡ Powered by Advanced AI Technology
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Powerful Features for
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Every Workflow
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Discover the comprehensive suite of AI-powered tools designed to transform 
            how you work with documents, audio, and multimedia content.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg">
                Try All Features Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="px-8 py-3 text-lg">
              <Play className="mr-2 h-5 w-5" />
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Feature Showcase */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4 max-w-2xl mx-auto mb-12">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="enterprise">Enterprise</TabsTrigger>
              <TabsTrigger value="comparison">Compare</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-12">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {mainFeatures.map((feature, index) => (
                  <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <CardHeader>
                      <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4`}>
                        <feature.icon className="h-6 w-6" />
                      </div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                      <CardDescription className="text-base">{feature.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        {Object.entries(feature.stats).map(([key, value], statIndex) => (
                          <div key={statIndex}>
                            <div className="font-semibold text-gray-900">{value}</div>
                            <div className="text-xs text-gray-600 capitalize">{key}</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="details" className="space-y-12">
              <div className="grid lg:grid-cols-2 gap-12">
                <div className="space-y-4">
                  {mainFeatures.map((feature, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveFeature(index)}
                      className={`w-full text-left p-4 rounded-lg border transition-all ${
                        activeFeature === index 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-lg ${feature.color} flex items-center justify-center`}>
                          <feature.icon className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                          <p className="text-sm text-gray-600">{feature.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                
                <Card className="border-0 shadow-xl">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg ${mainFeatures[activeFeature].color} flex items-center justify-center`}>
                        {(() => {
                          const IconComponent = mainFeatures[activeFeature].icon;
                          return <IconComponent className="h-5 w-5" />;
                        })()}
                      </div>
                      <div>
                        <CardTitle>{mainFeatures[activeFeature].title}</CardTitle>
                        <CardDescription>{mainFeatures[activeFeature].description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {mainFeatures[activeFeature].details.map((detail, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="enterprise" className="space-y-12">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Enterprise-Grade Features</h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  Advanced capabilities designed for large organizations and mission-critical workflows
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                {enterpriseFeatures.map((feature, index) => (
                  <Card key={index} className="border-0 shadow-lg">
                    <CardHeader>
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                        <feature.icon className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle>{feature.title}</CardTitle>
                      <CardDescription className="text-base">{feature.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {feature.features.map((item, itemIndex) => (
                          <li key={itemIndex} className="flex items-center">
                            <Check className="h-4 w-4 text-green-500 mr-2" />
                            <span className="text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="comparison" className="space-y-12">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Feature Comparison</h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  See what&apos;s included in each plan to choose the right option for you
                </p>
              </div>
              
              <Card className="border-0 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left p-6 font-semibold text-gray-900">Feature</th>
                        <th className="text-center p-6 font-semibold text-gray-900">Free</th>
                        <th className="text-center p-6 font-semibold text-blue-600 bg-blue-50">Pro</th>
                        <th className="text-center p-6 font-semibold text-purple-600 bg-purple-50">Enterprise</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonFeatures.map((feature, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="p-6 font-medium text-gray-900">{feature.name}</td>
                          <td className="p-6 text-center text-gray-600">{feature.free}</td>
                          <td className="p-6 text-center text-blue-600 bg-blue-50 font-medium">{feature.pro}</td>
                          <td className="p-6 text-center text-purple-600 bg-purple-50 font-medium">{feature.enterprise}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to experience these features?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Start your free trial today and discover how our AI-powered tools can transform your workflow.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 text-lg">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 text-lg">
                Schedule Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
