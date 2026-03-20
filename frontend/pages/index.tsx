import React, { useState } from 'react'
import Head from 'next/head'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, FileText, Gavel, Shield, CheckCircle, Clock, TrendingUp } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { useSession, signIn } from 'next-auth/react'

export default function Home() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<'tenant' | 'attorney'>('tenant')

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleStartIntake = (role: 'tenant' | 'attorney') => {
    if (!session) {
      signIn()
      return
    }
    // Redirect to intake (to be implemented)
    window.location.href = role === 'attorney' ? '/attorney-intake' : '/tenant-intake'
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tenantguard.net'
  const ogImage = `${siteUrl}/assets/logo.png`

  const orgJsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "TenantGuard",
    "url": siteUrl,
    "logo": ogImage,
    "description": "Technology-enabled self-service platform connecting tenants with qualified attorneys for streamlined landlord-tenant dispute resolution.",
    "areaServed": { "@type": "State", "name": "Tennessee" }
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <Head>
        <title>TenantGuard - Transforming Tenant Legal Representation</title>
        <meta name="description" content="Technology-enabled self-service platform connecting tenants with qualified attorneys for streamlined landlord-tenant dispute resolution." />
        <link rel="canonical" href={siteUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="TenantGuard" />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:title" content="TenantGuard - Transforming Tenant Legal Representation" />
        <meta property="og:description" content="Technology-enabled self-service platform connecting tenants with qualified attorneys for streamlined landlord-tenant dispute resolution." />
        <meta property="og:image" content={ogImage} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="TenantGuard - Transforming Tenant Legal Representation" />
        <meta name="twitter:description" content="Technology-enabled self-service platform connecting tenants with qualified attorneys for streamlined landlord-tenant dispute resolution." />
        <meta name="twitter:image" content={ogImage} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: orgJsonLd }} />
      </Head>

      <Navbar 
        onNavigate={(sectionId) => {
          if (sectionId === 'home') window.scrollTo({ top: 0, behavior: 'smooth' })
          else scrollToSection(sectionId)
        }}
      />

      <main>
        {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <Badge variant="outline" className="mb-6 border-primary text-primary">
              Tenant-first
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-gray-900">
              Transforming Tenant
              <span className="block text-primary">Legal Representation</span>
            </h1>
            <p className="text-xl mb-8 max-w-3xl mx-auto text-gray-600">
              Technology-enabled self-service platform connecting tenants with qualified attorneys
              for streamlined landlord-tenant dispute resolution.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-primary text-white hover:opacity-90"
                onClick={() => handleStartIntake('tenant')}
              >
                Start Your Case <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-primary text-primary hover:bg-primary-light"
                onClick={() => handleStartIntake('attorney')}
              >
                Attorney Portal
              </Button>
            </div>
          </div>
        </section>

        {/* Challenge Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">The Challenge</h2>
              <p className="text-lg text-gray-600">
                Tennessee's eviction process creates significant barriers for tenant self-representation
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center">
                <CardHeader>
                  <div className="text-4xl font-bold text-red-800 mb-2">85%</div>
                  <CardTitle className="text-lg">Tenants lack legal representation</CardTitle>
                </CardHeader>
              </Card>
              <Card className="text-center">
                <CardHeader>
                  <div className="text-4xl font-bold text-red-800 mb-2">14 Days</div>
                  <CardTitle className="text-lg">Notice period before eviction filing</CardTitle>
                </CardHeader>
              </Card>
              <Card className="text-center">
                <CardHeader>
                  <div className="text-4xl font-bold text-red-800 mb-2">3-5 Hours</div>
                  <CardTitle className="text-lg">Attorney case setup time</CardTitle>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Platform Features */}
        <section id="features" className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Platform Features</h2>
              <p className="text-lg text-gray-600">
                Comprehensive tools for both tenants and attorneys
              </p>
            </div>

            <div className="flex justify-center mb-8">
              <div className="bg-gray-100 p-1 rounded-lg">
                <Button
                  variant={activeTab === 'tenant' ? 'default' : 'ghost'}
                  onClick={() => setActiveTab('tenant')}
                  className={activeTab === 'tenant' ? 'bg-red-800 text-white' : ''}
                >
                  For Tenants
                </Button>
                <Button
                  variant={activeTab === 'attorney' ? 'default' : 'ghost'}
                  onClick={() => setActiveTab('attorney')}
                  className={activeTab === 'attorney' ? 'bg-red-800 text-white' : ''}
                >
                  For Attorneys
                </Button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                {activeTab === 'tenant' ? (
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <FileText className="h-6 w-6 text-red-800 mt-1" />
                      <div>
                        <h3 className="text-xl font-semibold mb-2">Guided Case Intake</h3>
                        <p className="text-gray-600">Step-by-step dispute categorization and document collection</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <Gavel className="h-6 w-6 text-red-800 mt-1" />
                      <div>
                        <h3 className="text-xl font-semibold mb-2">Tennessee Legal Templates</h3>
                        <p className="text-gray-600">State-specific forms and legal document generation</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <Shield className="h-6 w-6 text-red-800 mt-1" />
                      <div>
                        <h3 className="text-xl font-semibold mb-2">Mobile-Responsive Dashboard</h3>
                        <p className="text-gray-600">Access your case anywhere with deadline tracking</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <CheckCircle className="h-6 w-6 text-red-800 mt-1" />
                      <div>
                        <h3 className="text-xl font-semibold mb-2">Pre-Qualified Cases</h3>
                        <p className="text-gray-600">Browse organized cases with complete documentation</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <Clock className="h-6 w-6 text-red-800 mt-1" />
                      <div>
                        <h3 className="text-xl font-semibold mb-2">Streamlined Intake</h3>
                        <p className="text-gray-600">70% reduction in case setup time</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <TrendingUp className="h-6 w-6 text-red-800 mt-1" />
                      <div>
                        <h3 className="text-xl font-semibold mb-2">Integrated Workflow</h3>
                        <p className="text-gray-600">Seamless case handoff and billing integration</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <img
                  src={activeTab === 'tenant' ? "/assets/tenant_signup_onboarding.png" : "/assets/attorney_dashboard.png"}
                  alt={activeTab === 'tenant' ? 'Tenant Signup Interface' : 'Attorney Dashboard'}
                  className="rounded-lg shadow-lg w-full"
                />
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
              <p className="text-lg text-gray-600">
                Simple, efficient process connecting tenants and attorneys
              </p>
            </div>

            <div className="mb-12">
              <img
                src="/assets/workflow_diagram.png"
                alt="TenantGuard Workflow"
                className="rounded-lg shadow-lg w-full max-w-4xl mx-auto"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-12">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl text-red-800">Tenant Journey</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    "Signup with guided situation assessment",
                    "Case intake with dispute categorization",
                    "Document upload and organization",
                    "Legal guidance and document generation"
                  ].map((step, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <div className="bg-red-800 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">{i + 1}</div>
                      <span>{step}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl text-red-800">Attorney Journey</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    "Browse pre-qualified cases with filters",
                    "Evaluate complete case documentation",
                    "Streamlined client handoff process",
                    "Integrated case and billing management"
                  ].map((step, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <div className="bg-red-800 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">{i + 1}</div>
                      <span>{step}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Platform Benefits */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Platform Benefits</h2>
              <p className="text-lg text-gray-600">
                Delivering value for both tenants and attorneys
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center">
                <CardHeader>
                  <div className="text-4xl font-bold text-red-800 mb-2">60%</div>
                  <CardTitle className="text-lg">Cost Reduction</CardTitle>
                  <CardDescription>
                    Average tenant legal costs reduced from $2,500 to $1,000
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="text-center">
                <CardHeader>
                  <div className="text-4xl font-bold text-red-800 mb-2">70%</div>
                  <CardTitle className="text-lg">Time Savings</CardTitle>
                  <CardDescription>
                    Attorney case intake setup reduced from 4.5 hours to under 1 hour
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="text-center">
                <CardHeader>
                  <div className="text-4xl font-bold text-red-800 mb-2">90%</div>
                  <CardTitle className="text-lg">Completeness</CardTitle>
                  <CardDescription>
                    Document organization and case preparation accuracy
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Modern Technology Stack */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Modern Technology Stack</h2>
              <p className="text-lg text-gray-600">Built for scalability and security</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-red-800">Frontend</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {[
                    ["Next.js", "16.1.6"],
                    ["React", "18.2.0"],
                    ["TypeScript", "5.9.3"],
                    ["Tailwind CSS", "4.2.1"],
                    ["NextAuth.js", "4.22.1"],
                  ].map(([name, version]) => (
                    <div key={name} className="flex justify-between">
                      <span className="text-gray-700">{name}</span>
                      <span className="text-gray-400 font-mono">{version}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-red-800">Backend</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {[
                    ["Django", "5.0.3"],
                    ["Django REST Framework", "3.15.1"],
                    ["SimpleJWT", "5.3.1"],
                    ["django-allauth", "0.61.1"],
                    ["OpenAI SDK", "2.28.0"],
                  ].map(([name, version]) => (
                    <div key={name} className="flex justify-between">
                      <span className="text-gray-700">{name}</span>
                      <span className="text-gray-400 font-mono">{version}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-red-800">AI & Data</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {[
                    ["GPT-4 Turbo", "Preview"],
                    ["DALL-E", "3"],
                    ["pypdf", "4.3.1"],
                    ["PostgreSQL", "18.2"],
                    ["Multi-agent pipeline", "Custom"],
                  ].map(([name, version]) => (
                    <div key={name} className="flex justify-between">
                      <span className="text-gray-700">{name}</span>
                      <span className="text-gray-400 font-mono">{version}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-red-800 text-white">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold mb-6">
              Ready to Transform Tenant Legal Representation?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join the platform that's revolutionizing landlord-tenant dispute resolution in Tennessee.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-red-800 hover:bg-gray-100" onClick={() => handleStartIntake('tenant')}>
                Get Started as Tenant
              </Button>
              <Button size="lg" variant="outline" className="text-white border-white bg-transparent hover:bg-red-700" onClick={() => handleStartIntake('attorney')}>
                Join as Attorney
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer id="contact" className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <img src="/assets/logo.png" alt="TenantGuard" className="h-6 w-6" />
                <span className="text-lg font-semibold">TenantGuard</span>
              </div>
              <p className="text-gray-400 text-sm">
                Transforming tenant legal representation in Tennessee.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-white">Home</button></li>
                <li><button onClick={() => scrollToSection('features')} className="hover:text-white">Features</button></li>
                <li><button onClick={() => scrollToSection('how-it-works')} className="hover:text-white">How It Works</button></li>
                <li><a href="/blog" className="hover:text-white">Blog</a></li>
                <li><a href="/contact" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">For Users</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><button onClick={() => handleStartIntake('tenant')} className="hover:text-white">Tenant Portal</button></li>
                <li><button onClick={() => handleStartIntake('attorney')} className="hover:text-white">Attorney Portal</button></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Contact</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>Tennessee</li>
                <li><a href="mailto:john@tenantguard.net" className="hover:text-white">john@tenantguard.net</a></li>
                <li><a href="mailto:karl@tenantguard.net" className="hover:text-white">karl@tenantguard.net</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
            <p>© 2026 TenantGuard. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
