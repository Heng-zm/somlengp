'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function PrivacyNotice() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Privacy Notice
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
              Your privacy is important to us. Learn how we collect, use, and protect your information.
            </p>
            <div className="mt-8 text-sm text-blue-200">
              Last updated: {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 py-4 overflow-x-auto">
            {[
              'Information We Collect',
              'How We Use Information',
              'Information Sharing',
              'Data Security',
              'Your Rights',
              'Cookies',
              'Contact Us'
            ].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                className="whitespace-nowrap text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors duration-200"
              >
                {item}
              </a>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Navigation</h3>
              <ul className="space-y-2">
                {[
                  { title: 'Information We Collect', id: 'information-we-collect' },
                  { title: 'How We Use Information', id: 'how-we-use-information' },
                  { title: 'Information Sharing', id: 'information-sharing' },
                  { title: 'Data Security', id: 'data-security' },
                  { title: 'Your Rights', id: 'your-rights' },
                  { title: 'Cookies & Tracking', id: 'cookies' },
                  { title: 'Contact Us', id: 'contact-us' }
                ].map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="text-sm text-gray-600 hover:text-blue-600 transition-colors duration-200 block py-1"
                    >
                      {item.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-8 md:p-12 space-y-12">
                
                {/* Introduction */}
                <section>
                  <div className="prose prose-lg max-w-none">
                    <p className="text-lg text-gray-700 leading-relaxed">
                      This Privacy Notice describes how we collect, use, and protect your personal information 
                      when you use our services. We are committed to protecting your privacy and ensuring 
                      transparency in our data practices.
                    </p>
                  </div>
                </section>

                {/* Information We Collect */}
                <section id="information-we-collect" className="scroll-mt-24">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-3">
                    Information We Collect
                  </h2>
                  
                  <div className="space-y-6">
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-r-lg">
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">
                        Personal Information
                      </h3>
                      <ul className="space-y-2 text-gray-700">
                        <li className="flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          Name, email address, and contact information
                        </li>
                        <li className="flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          Account credentials and profile information
                        </li>
                        <li className="flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          Payment and billing information (if applicable)
                        </li>
                      </ul>
                    </div>

                    <div className="bg-green-50 border-l-4 border-green-400 p-6 rounded-r-lg">
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">
                        Usage Information
                      </h3>
                      <ul className="space-y-2 text-gray-700">
                        <li className="flex items-start">
                          <span className="text-green-500 mr-2">•</span>
                          Device information and browser type
                        </li>
                        <li className="flex items-start">
                          <span className="text-green-500 mr-2">•</span>
                          IP address and location data
                        </li>
                        <li className="flex items-start">
                          <span className="text-green-500 mr-2">•</span>
                          Usage patterns and interaction data
                        </li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* How We Use Information */}
                <section id="how-we-use-information" className="scroll-mt-24">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-3">
                    How We Use Your Information
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                      <div className="flex items-center mb-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Service Provision</h3>
                      </div>
                      <p className="text-gray-600">
                        To provide, maintain, and improve our services and user experience.
                      </p>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                      <div className="flex items-center mb-4">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Communication</h3>
                      </div>
                      <p className="text-gray-600">
                        To send important updates, respond to inquiries, and provide customer support.
                      </p>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                      <div className="flex items-center mb-4">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Analytics</h3>
                      </div>
                      <p className="text-gray-600">
                        To analyze usage patterns and improve our services through data insights.
                      </p>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                      <div className="flex items-center mb-4">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                          <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Security</h3>
                      </div>
                      <p className="text-gray-600">
                        To protect against fraud, unauthorized access, and ensure platform security.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Information Sharing */}
                <section id="information-sharing" className="scroll-mt-24">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-3">
                    Information Sharing
                  </h2>
                  
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                    <div className="flex items-start">
                      <svg className="w-6 h-6 text-red-600 mt-1 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <div>
                        <h3 className="text-lg font-semibold text-red-800 mb-2">Important Notice</h3>
                        <p className="text-red-700">
                          We do not sell, rent, or trade your personal information to third parties for marketing purposes.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="prose prose-lg max-w-none">
                    <p className="text-gray-700 mb-4">
                      We may share your information only in the following circumstances:
                    </p>
                    <ul className="space-y-3 text-gray-700">
                      <li className="flex items-start">
                        <span className="text-blue-500 mr-2 mt-1">•</span>
                        <strong>Service Providers:</strong> With trusted third-party service providers who help us operate our services
                      </li>
                      <li className="flex items-start">
                        <span className="text-blue-500 mr-2 mt-1">•</span>
                        <strong>Legal Requirements:</strong> When required by law or to protect our rights and safety
                      </li>
                      <li className="flex items-start">
                        <span className="text-blue-500 mr-2 mt-1">•</span>
                        <strong>Business Transfers:</strong> In connection with mergers, acquisitions, or sale of assets
                      </li>
                      <li className="flex items-start">
                        <span className="text-blue-500 mr-2 mt-1">•</span>
                        <strong>With Consent:</strong> When you explicitly consent to sharing your information
                      </li>
                    </ul>
                  </div>
                </section>

                {/* Data Security */}
                <section id="data-security" className="scroll-mt-24">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-3">
                    Data Security
                  </h2>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Technical Safeguards</h3>
                        <ul className="space-y-2 text-gray-700">
                          <li className="flex items-center">
                            <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            SSL/TLS encryption
                          </li>
                          <li className="flex items-center">
                            <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Secure data storage
                          </li>
                          <li className="flex items-center">
                            <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Regular security audits
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Administrative Safeguards</h3>
                        <ul className="space-y-2 text-gray-700">
                          <li className="flex items-center">
                            <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Access controls
                          </li>
                          <li className="flex items-center">
                            <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Staff training
                          </li>
                          <li className="flex items-center">
                            <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Incident response
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Your Rights */}
                <section id="your-rights" className="scroll-mt-24">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-3">
                    Your Rights
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                      {
                        title: 'Access',
                        description: 'Request a copy of your personal data',
                        icon: '👁️'
                      },
                      {
                        title: 'Rectification',
                        description: 'Correct inaccurate or incomplete data',
                        icon: '✏️'
                      },
                      {
                        title: 'Erasure',
                        description: 'Request deletion of your personal data',
                        icon: '🗑️'
                      },
                      {
                        title: 'Portability',
                        description: 'Transfer your data to another service',
                        icon: '📦'
                      },
                      {
                        title: 'Object',
                        description: 'Object to processing of your data',
                        icon: '🛑'
                      },
                      {
                        title: 'Restrict',
                        description: 'Limit how we process your data',
                        icon: '⏸️'
                      }
                    ].map((right) => (
                      <div key={right.title} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                        <div className="text-2xl mb-3">{right.icon}</div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{right.title}</h3>
                        <p className="text-gray-600 text-sm">{right.description}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Cookies */}
                <section id="cookies" className="scroll-mt-24">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-3">
                    Cookies & Tracking Technologies
                  </h2>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                    <p className="text-blue-800 mb-4">
                      We use cookies and similar technologies to enhance your experience and analyze usage patterns.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">Essential Cookies</span>
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">Analytics Cookies</span>
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">Functional Cookies</span>
                    </div>
                  </div>
                  
                  <p className="text-gray-700">
                    You can manage cookie preferences through your browser settings. Note that disabling certain cookies may affect website functionality.
                  </p>
                </section>

                {/* Contact */}
                <section id="contact-us" className="scroll-mt-24">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-3">
                    Contact Us
                  </h2>
                  
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-gray-200 rounded-lg p-8">
                    <div className="text-center">
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">
                        Questions about your privacy?
                      </h3>
                      <p className="text-gray-600 mb-6">
                        If you have any questions about this Privacy Notice or how we handle your data, please don&apos;t hesitate to contact us.\n
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/contact">
                          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                            Contact Support
                          </Button>
                        </Link>
                        <Button variant="outline" className="border-gray-300">
                          privacy@company.com
                        </Button>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="text-gray-300 hover:text-white">Privacy Notice</Link></li>
                <li><Link href="/terms" className="text-gray-300 hover:text-white">Terms of Service</Link></li>
                <li><Link href="/cookies" className="text-gray-300 hover:text-white">Cookie Policy</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><Link href="/help" className="text-gray-300 hover:text-white">Help Center</Link></li>
                <li><Link href="/contact" className="text-gray-300 hover:text-white">Contact Us</Link></li>
                <li><Link href="/faq" className="text-gray-300 hover:text-white">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-gray-300 hover:text-white">About Us</Link></li>
                <li><Link href="/careers" className="text-gray-300 hover:text-white">Careers</Link></li>
                <li><Link href="/blog" className="text-gray-300 hover:text-white">Blog</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">
              © {new Date().getFullYear()} Your Company Name. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
