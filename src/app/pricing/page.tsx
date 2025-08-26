'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { ArrowRight, Check, Star, Sparkles, Zap, Crown, Users, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false)

  const pricingPlans = [
    {
      name: "Free",
      description: "Perfect for trying out our platform",
      monthlyPrice: 0,
      annualPrice: 0,
      icon: Sparkles,
      color: "text-gray-600 bg-gray-100",
      popular: false,
      features: [
        "5 transcription minutes/day",
        "Basic PDF tools",
        "Standard image conversion",
        "Community support",
        "Basic AI assistant",
        "Web-based access"
      ],
      limitations: [
        "Limited daily usage",
        "No API access",
        "Community support only",
        "Basic features only"
      ],
      cta: "Get Started",
      href: "/signup"
    },
    {
      name: "Pro",
      description: "Best for professionals and small teams",
      monthlyPrice: 19,
      annualPrice: 190, // ~16.67/month
      icon: Zap,
      color: "text-blue-600 bg-blue-100",
      popular: true,
      features: [
        "Unlimited transcription",
        "Advanced AI assistant",
        "Premium PDF tools",
        "Priority email support",
        "Export to multiple formats",
        "Team collaboration (up to 10)",
        "Advanced image processing",
        "Custom vocabulary",
        "API access (10K calls/month)",
        "Real-time transcription"
      ],
      limitations: [],
      cta: "Start Free Trial",
      href: "/signup"
    },
    {
      name: "Enterprise",
      description: "For large organizations with custom needs",
      monthlyPrice: "Custom",
      annualPrice: "Custom",
      icon: Crown,
      color: "text-purple-600 bg-purple-100",
      popular: false,
      features: [
        "Everything in Pro",
        "Unlimited team members",
        "Custom AI model training",
        "Dedicated support manager",
        "99.9% SLA guarantee",
        "Advanced security & compliance",
        "Custom integrations",
        "On-premise deployment options",
        "White-label solutions",
        "Advanced analytics",
        "Custom API limits",
        "Training and onboarding"
      ],
      limitations: [],
      cta: "Contact Sales",
      href: "/contact"
    }
  ]

  const additionalFeatures = [
    {
      category: "AI & Processing",
      icon: Sparkles,
      features: [
        { name: "Voice Transcription", free: "5 min/day", pro: "Unlimited", enterprise: "Unlimited + Custom Models" },
        { name: "AI Assistant", free: "Basic", pro: "Advanced", enterprise: "Custom Training" },
        { name: "Language Support", free: "10 languages", pro: "50+ languages", enterprise: "All languages + Custom" },
        { name: "Processing Speed", free: "Standard", pro: "Fast", enterprise: "Priority + Custom" }
      ]
    },
    {
      category: "Storage & Collaboration",
      icon: Users,
      features: [
        { name: "File Storage", free: "100 MB", pro: "10 GB", enterprise: "Unlimited" },
        { name: "Team Members", free: "1 user", pro: "10 users", enterprise: "Unlimited" },
        { name: "Project Sharing", free: "❌", pro: "✅", enterprise: "✅ + Advanced" },
        { name: "Version History", free: "❌", pro: "30 days", enterprise: "Unlimited" }
      ]
    },
    {
      category: "Integration & Support",
      icon: Shield,
      features: [
        { name: "API Access", free: "❌", pro: "10K calls/month", enterprise: "Custom limits" },
        { name: "Webhooks", free: "❌", pro: "✅", enterprise: "✅ + Custom" },
        { name: "Support", free: "Community", pro: "Email (24h)", enterprise: "Phone + Email (1h)" },
        { name: "SLA", free: "❌", pro: "95%", enterprise: "99.9%" }
      ]
    }
  ]

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Content Manager",
      company: "TechCorp",
      content: "The Pro plan has been perfect for our team. The unlimited transcription saves us hours every week.",
      avatar: "/api/placeholder/40/40"
    },
    {
      name: "Michael Rodriguez",
      role: "CTO", 
      company: "StartupXYZ",
      content: "Enterprise features like custom AI training and dedicated support have been game-changing for our business.",
      avatar: "/api/placeholder/40/40"
    }
  ]

  const faqs = [
    {
      question: "Can I change plans anytime?",
      answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any billing differences."
    },
    {
      question: "What happens if I exceed my usage limits?",
      answer: "For Free users, processing will be temporarily paused until the next day. Pro users have unlimited usage for most features."
    },
    {
      question: "Do you offer refunds?",
      answer: "Yes, we offer a 30-day money-back guarantee for all paid plans. No questions asked."
    },
    {
      question: "Is there a free trial for paid plans?",
      answer: "Yes, all paid plans come with a 14-day free trial. No credit card required to start."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, PayPal, and for Enterprise customers, we can arrange invoice billing."
    }
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
              <Link href="/features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</Link>
              <Link href="/contact" className="text-gray-600 hover:text-gray-900 transition-colors">Contact</Link>
              <Link href="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
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
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Simple, Transparent
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Pricing
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Choose the plan that fits your needs. Start free, upgrade when you&apos;re ready.
            All plans include our core AI-powered features.
          </p>

          {/* Annual/Monthly Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-12">
            <span className={`text-sm font-medium ${!isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>
              Monthly
            </span>
            <Switch
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
              className="data-[state=checked]:bg-blue-600"
            />
            <span className={`text-sm font-medium ${isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>
              Annual
            </span>
            <Badge className="bg-green-100 text-green-800 border-green-200">
              Save 20%
            </Badge>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={`relative border-2 ${plan.popular ? 'border-blue-500 shadow-2xl scale-105' : 'border-gray-200'} transition-all duration-300 hover:shadow-xl`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-1">
                    Most Popular
                  </Badge>
                )}
                
                <CardHeader className="text-center pb-8">
                  <div className={`w-16 h-16 rounded-full ${plan.color} flex items-center justify-center mx-auto mb-4`}>
                    <plan.icon className="h-8 w-8" />
                  </div>
                  
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="text-base">{plan.description}</CardDescription>
                  
                  <div className="mt-6">
                    <div className="flex items-baseline justify-center">
                      <span className="text-5xl font-bold text-gray-900">
                        {typeof plan.monthlyPrice === 'number' ? '$' : ''}
                        {isAnnual && typeof plan.annualPrice === 'number' 
                          ? Math.floor(plan.annualPrice / 12)
                          : plan.monthlyPrice}
                      </span>
                      {typeof plan.monthlyPrice === 'number' && (
                        <span className="text-xl text-gray-600 ml-2">/month</span>
                      )}
                    </div>
                    {isAnnual && typeof plan.annualPrice === 'number' && typeof plan.monthlyPrice === 'number' && (
                      <p className="text-sm text-green-600 mt-1">
                        ${plan.annualPrice}/year (save ${(plan.monthlyPrice * 12) - plan.annualPrice})
                      </p>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {plan.limitations.length > 0 && (
                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-sm text-gray-500 mb-2">Limitations:</p>
                      <ul className="space-y-1">
                        {plan.limitations.map((limitation, limitIndex) => (
                          <li key={limitIndex} className="text-sm text-gray-500">
                            • {limitation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <Link href={plan.href} className="block">
                    <Button 
                      className={`w-full mt-6 ${
                        plan.popular 
                          ? 'bg-blue-600 hover:bg-blue-700' 
                          : plan.name === 'Enterprise'
                          ? 'bg-purple-600 hover:bg-purple-700'
                          : ''
                      }`}
                      size="lg"
                    >
                      {plan.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-20 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Detailed Feature Comparison
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to know about what&apos;s included in each plan
            </p>
          </div>

          <div className="space-y-12">
            {additionalFeatures.map((category, categoryIndex) => (
              <Card key={categoryIndex} className="border-0 shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
                  <div className="flex items-center space-x-3">
                    <category.icon className="h-6 w-6 text-blue-600" />
                    <CardTitle className="text-xl">{category.category}</CardTitle>
                  </div>
                </CardHeader>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left p-4 font-medium text-gray-900">Feature</th>
                        <th className="text-center p-4 font-medium text-gray-600">Free</th>
                        <th className="text-center p-4 font-medium text-blue-600 bg-blue-50">Pro</th>
                        <th className="text-center p-4 font-medium text-purple-600 bg-purple-50">Enterprise</th>
                      </tr>
                    </thead>
                    <tbody>
                      {category.features.map((feature, featureIndex) => (
                        <tr key={featureIndex} className="border-b border-gray-50">
                          <td className="p-4 font-medium text-gray-900">{feature.name}</td>
                          <td className="p-4 text-center text-gray-600">{feature.free}</td>
                          <td className="p-4 text-center text-blue-600 bg-blue-25 font-medium">{feature.pro}</td>
                          <td className="p-4 text-center text-purple-600 bg-purple-25 font-medium">{feature.enterprise}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              What Our Customers Say
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="p-8">
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <blockquote className="text-gray-700 mb-6">
                    &quot;{testimonial.content}&quot;
                  </blockquote>
                  <div className="flex items-center">
                    <Image 
                      src={testimonial.avatar} 
                      alt={testimonial.name}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full mr-4"
                    />
                    <div>
                      <div className="font-semibold text-gray-900">{testimonial.name}</div>
                      <div className="text-sm text-gray-600">{testimonial.role} at {testimonial.company}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-600">
              Can&apos;t find what you&apos;re looking for? <Link href="/contact" className="text-blue-600 hover:text-blue-700">Contact our team</Link>.
            </p>
          </div>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <Card key={index} className="border-0 shadow-md">
                <CardContent className="p-8">
                  <h3 className="font-semibold text-gray-900 mb-3">{faq.question}</h3>
                  <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to get started?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of users who trust Somleng for their AI-powered workflow needs.
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
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
