import React, { useCallback, useEffect, useRef, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle, ArrowLeft, CheckCircle, ChevronDown, ChevronUp,
  Clock, FileText, Loader2, Lock, Shield, Upload, X, Zap,
} from 'lucide-react'
import Navbar from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  getIntakeSubmission,
  uploadIntakeDocument,
  createCheckoutSession,
} from '@/lib/api'
import { authOptions } from '@/pages/api/auth/[...nextauth]'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Document {
  id: number
  doc_type: string
  original_filename: string
  uploaded_at: string
}

interface Notebook {
  summary: string
  facts: Array<{ fact: string; source: string; confidence: string }>
  timeline: Array<{ date: string; event: string; source: string; significance: string }>
  key_terms: Array<{ term: string; definition: string }>
  disputed_points: Array<{ issue: string; tenant_position: string; landlord_position: string }>
  open_questions: string[]
  urgent_deadlines: Array<{ date: string; action: string }>
  recommended_next_steps: string[]
}

interface Submission {
  id: number
  status: string
  payment_status: string
  urgency_level: string
  issue_type: string
  first_name: string
  last_name: string
  full_name: string
  county: string
  property_address: string
  landlord_name: string
  court_date: string | null
  notice_date: string | null
  created_at: string
  documents: Document[]
  notebook: Notebook | null
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STEPS = ['Intake', 'Documents', 'Unlock', 'Results'] as const

function getStep(s: Submission): number {
  if (s.status === 'complete') return 3
  if (s.status === 'analyzing') return 3
  if (s.payment_status === 'paid') return 3
  if (s.documents.length > 0) return 2
  return 1
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / 86400000)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
}

const DOC_LABELS: Record<string, string> = {
  lease: 'Lease Agreement',
  eviction_notice: 'Eviction Notice',
  correspondence: 'Correspondence / Letters',
  photo: 'Photo / Visual Evidence',
  court_filing: 'Court Filing',
  payment_record: 'Payment Record',
  other: 'Other',
}

const URGENCY_CONFIG: Record<string, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  immediate:    { label: 'Urgent',         bg: 'bg-red-50 border-red-200',    text: 'text-red-700',    icon: <AlertTriangle className="h-4 w-4" /> },
  within_days:  { label: 'Time-Sensitive', bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700', icon: <Clock className="h-4 w-4" /> },
  within_weeks: { label: 'Active',         bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700', icon: <Clock className="h-4 w-4" /> },
  not_urgent:   { label: 'Standard',       bg: 'bg-green-50 border-green-200',   text: 'text-green-700',  icon: <CheckCircle className="h-4 w-4" /> },
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StepTracker({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 w-full max-w-sm mx-auto">
      {STEPS.map((label, i) => (
        <React.Fragment key={label}>
          <div className="flex flex-col items-center gap-1">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              i < current ? 'bg-primary text-white' :
              i === current ? 'bg-primary text-white ring-4 ring-primary/20' :
              'bg-gray-100 text-gray-400'
            }`}>
              {i < current ? <CheckCircle className="h-4 w-4" /> : i + 1}
            </div>
            <span className={`text-[10px] font-medium whitespace-nowrap ${i <= current ? 'text-primary' : 'text-gray-400'}`}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mb-4 mx-1 transition-colors ${i < current ? 'bg-primary' : 'bg-gray-200'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

function UrgencyBanner({ submission }: { submission: Submission }) {
  const courtDays = daysUntil(submission.court_date)
  const cfg = URGENCY_CONFIG[submission.urgency_level] ?? URGENCY_CONFIG.not_urgent

  if (!submission.court_date && !submission.urgency_level) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-3 rounded-xl border p-4 ${cfg.bg} ${cfg.text}`}
    >
      {cfg.icon}
      <div className="text-sm">
        <span className="font-semibold">{cfg.label}</span>
        {courtDays !== null && courtDays >= 0 && (
          <span className="ml-2">
            {courtDays === 0 ? 'Court date is today.' :
             courtDays === 1 ? 'Court date is tomorrow.' :
             `Court date in ${courtDays} day${courtDays !== 1 ? 's' : ''}.`}
          </span>
        )}
        {submission.notice_date && !submission.court_date && (
          <span className="ml-2">Notice received {formatDate(submission.notice_date)}.</span>
        )}
      </div>
    </motion.div>
  )
}

function DocumentUploadPanel({
  submissionId, token, existingDocs, onUploaded,
}: {
  submissionId: number
  token: string
  existingDocs: Document[]
  onUploaded: () => void
}) {
  const [docType, setDocType] = useState('eviction_notice')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setError('')
    try {
      await uploadIntakeDocument(submissionId, docType, file, token)
      setFile(null)
      if (inputRef.current) inputRef.current.value = ''
      onUploaded()
    } catch {
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-gray-600 mb-4">
          Upload any documents related to your case — the more you provide, the more detailed your analysis will be. All files are encrypted and securely stored.
        </p>

        {/* Existing docs */}
        {existingDocs.length > 0 && (
          <div className="space-y-2 mb-4">
            {existingDocs.map((doc) => (
              <div key={doc.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm">
                <FileText className="h-4 w-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{doc.original_filename}</p>
                  <p className="text-xs text-gray-500">{DOC_LABELS[doc.doc_type] ?? doc.doc_type}</p>
                </div>
                <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
              </div>
            ))}
          </div>
        )}

        {/* Upload form */}
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 space-y-3">
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            {Object.entries(DOC_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>

          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => inputRef.current?.click()}
          >
            <div className="flex-1 h-10 rounded-lg border border-gray-200 bg-gray-50 flex items-center px-3 text-sm text-gray-500 truncate">
              {file ? file.name : 'Choose a file…'}
            </div>
            <Button type="button" variant="outline" size="sm" className="shrink-0">
              <Upload className="h-4 w-4 mr-1.5" />
              Browse
            </Button>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.txt,.png,.jpg,.jpeg,.doc,.docx"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />

          {error && <p className="text-xs text-red-600">{error}</p>}

          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full bg-primary hover:opacity-90"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
            {uploading ? 'Uploading…' : 'Upload Document'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function PaymentCTA({
  submissionId, token, priceDisplay, onCheckout,
}: {
  submissionId: number
  token: string
  priceDisplay: string
  onCheckout: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePay = async () => {
    setLoading(true)
    setError('')
    try {
      const { checkout_url } = await createCheckoutSession(submissionId, token)
      window.location.href = checkout_url
    } catch {
      setError('Could not start checkout. Please try again.')
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-primary/20 bg-primary/5 p-6"
    >
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Zap className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 text-lg mb-1">Unlock Your Case Analysis</h3>
          <p className="text-sm text-gray-600 mb-4">
            Get a complete plain-English breakdown of your case for just <strong>{priceDisplay}</strong> —
            a fraction of what a single attorney consultation costs.
          </p>
          <ul className="space-y-1.5 mb-5">
            {[
              'Your rights under Tennessee landlord-tenant law',
              'Every deadline you need to know — clearly explained',
              'A step-by-step action plan you can follow yourself',
              'What your landlord is required to do by law',
              'Key legal terms translated into plain English',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
          {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
          <Button
            onClick={handlePay}
            disabled={loading}
            className="w-full bg-primary hover:opacity-90 py-6 text-base font-semibold"
          >
            {loading
              ? <Loader2 className="h-5 w-5 animate-spin mr-2" />
              : <Lock className="h-5 w-5 mr-2" />}
            {loading ? 'Redirecting to checkout…' : `Analyze My Case — ${priceDisplay}`}
          </Button>
          <p className="text-center text-xs text-gray-400 mt-3">
            Secure payment via Stripe. No subscription — one-time fee.
          </p>
        </div>
      </div>
    </motion.div>
  )
}

function AnalyzingState() {
  const steps = [
    'Reading your uploaded documents…',
    'Extracting key dates and facts…',
    'Researching Tennessee tenant law…',
    'Building your timeline…',
    'Writing your rights summary…',
  ]
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setCurrentStep((s) => (s + 1) % steps.length), 2200)
    return () => clearInterval(id)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center py-16 gap-6 text-center"
    >
      <div className="relative">
        <div className="h-20 w-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <Shield className="h-8 w-8 text-primary absolute inset-0 m-auto" />
      </div>
      <div>
        <h3 className="font-bold text-gray-900 text-xl mb-2">Analyzing Your Case</h3>
        <p className="text-gray-500 text-sm max-w-xs">
          Our AI is reviewing your documents and preparing your personalized rights summary.
        </p>
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          key={currentStep}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="text-sm text-primary font-medium"
        >
          {steps[currentStep]}
        </motion.p>
      </AnimatePresence>
    </motion.div>
  )
}

function Collapsible({ title, children, defaultOpen = false }: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-gray-900">{title}</span>
        {open ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-5 pb-5 pt-1 border-t border-gray-100">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function NotebookResults({ notebook }: { notebook: Notebook }) {
  return (
    <div className="space-y-4">

      {/* Executive Summary */}
      <div className="bg-primary/5 border border-primary/15 rounded-xl p-5">
        <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" /> Your Situation — Plain English Summary
        </h3>
        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{notebook.summary}</p>
      </div>

      {/* Urgent deadlines */}
      {notebook.urgent_deadlines.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <h3 className="font-bold text-red-800 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Deadlines — Act By These Dates
          </h3>
          <ul className="space-y-2">
            {notebook.urgent_deadlines.map((d, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <span className="font-mono font-bold text-red-700 shrink-0 pt-0.5 min-w-[90px]">
                  {d.date}
                </span>
                <span className="text-red-800">{d.action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommended next steps */}
      {notebook.recommended_next_steps.length > 0 && (
        <Collapsible title="✅ What You Should Do — Step by Step" defaultOpen>
          <ol className="space-y-3 mt-2">
            {notebook.recommended_next_steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                <span className="h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </Collapsible>
      )}

      {/* Key terms / Your rights */}
      {notebook.key_terms.length > 0 && (
        <Collapsible title="⚖️ Your Rights — Key Legal Terms Explained" defaultOpen>
          <dl className="space-y-3 mt-2">
            {notebook.key_terms.map((t, i) => (
              <div key={i}>
                <dt className="font-semibold text-gray-900 text-sm">{t.term}</dt>
                <dd className="text-sm text-gray-600 mt-0.5">{t.definition}</dd>
              </div>
            ))}
          </dl>
        </Collapsible>
      )}

      {/* Timeline */}
      {notebook.timeline.length > 0 && (
        <Collapsible title="📅 Timeline of Events">
          <ol className="relative border-l border-gray-200 ml-3 mt-2 space-y-4">
            {notebook.timeline.map((e, i) => (
              <li key={i} className="ml-5">
                <span className="absolute -left-1.5 h-3 w-3 rounded-full bg-primary/70" />
                <p className="text-xs text-gray-500 font-mono">{e.date}</p>
                <p className="text-sm font-medium text-gray-800">{e.event}</p>
                {e.significance && (
                  <p className="text-xs text-gray-500 mt-0.5">{e.significance}</p>
                )}
              </li>
            ))}
          </ol>
        </Collapsible>
      )}

      {/* Facts */}
      {notebook.facts.length > 0 && (
        <Collapsible title="📋 Established Facts">
          <ul className="space-y-2 mt-2">
            {notebook.facts.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <Badge variant="outline" className={`shrink-0 text-[10px] ${
                  f.confidence === 'high' ? 'border-green-300 text-green-700' :
                  f.confidence === 'medium' ? 'border-yellow-300 text-yellow-700' :
                  'border-gray-300 text-gray-500'
                }`}>
                  {f.confidence}
                </Badge>
                <span className="text-gray-700">{f.fact}</span>
              </li>
            ))}
          </ul>
        </Collapsible>
      )}

      {/* Disputed points */}
      {notebook.disputed_points.length > 0 && (
        <Collapsible title="⚠️ Points of Dispute">
          <div className="space-y-4 mt-2">
            {notebook.disputed_points.map((d, i) => (
              <div key={i} className="text-sm">
                <p className="font-semibold text-gray-900 mb-1">{d.issue}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-blue-50 rounded-lg p-2">
                    <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wide mb-1">Your Position</p>
                    <p className="text-blue-900">{d.tenant_position}</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-2">
                    <p className="text-[10px] font-bold text-red-700 uppercase tracking-wide mb-1">Landlord's Claim</p>
                    <p className="text-red-900">{d.landlord_position}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Collapsible>
      )}

      {/* Open questions */}
      {notebook.open_questions.length > 0 && (
        <Collapsible title="❓ Questions You Should Be Ready to Answer">
          <ul className="space-y-2 mt-2 text-sm text-gray-700">
            {notebook.open_questions.map((q, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-primary font-bold shrink-0">·</span>
                {q}
              </li>
            ))}
          </ul>
        </Collapsible>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

interface Props {
  initialSubmission: Submission
  priceDisplay: string
}

export default function CasePage({ initialSubmission, priceDisplay }: Props) {
  const router = useRouter()
  const { data: session } = useSession()
  const token = (session as any)?.access_token as string | undefined

  const [submission, setSubmission] = useState<Submission>(initialSubmission)
  const [refreshing, setRefreshing] = useState(false)
  const paymentSuccess = router.query.payment === 'success'

  const refresh = useCallback(async () => {
    if (!token) return
    setRefreshing(true)
    try {
      const updated = await getIntakeSubmission(submission.id, token)
      setSubmission(updated)
    } finally {
      setRefreshing(false)
    }
  }, [token, submission.id])

  // Poll while analyzing
  useEffect(() => {
    if (submission.status !== 'analyzing') return
    const id = setInterval(refresh, 5000)
    return () => clearInterval(id)
  }, [submission.status, refresh])

  const step = getStep(submission)
  const showDocUpload = step <= 2 && submission.status !== 'analyzing'
  const showPayment = step === 2 && submission.payment_status !== 'paid'
  const isAnalyzing = submission.status === 'analyzing'
  const isComplete = submission.status === 'complete'

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Your Case — TenantGuard</title>
        <meta name="robots" content="noindex" />
      </Head>

      <Navbar />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Back link */}
        <Link href="/intake" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-800 gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Back to chat
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your Case</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Case #{submission.id} · Opened {formatDate(submission.created_at)}
            </p>
          </div>
          {refreshing && <Loader2 className="h-4 w-4 animate-spin text-gray-400 mt-2" />}
        </div>

        {/* Step tracker */}
        <StepTracker current={step} />

        {/* Payment success toast */}
        <AnimatePresence>
          {paymentSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-800 rounded-xl p-4 text-sm"
            >
              <CheckCircle className="h-5 w-5 shrink-0" />
              <span>Payment confirmed — your case analysis has started.</span>
              <button onClick={() => router.replace(`/case/${submission.id}`, undefined, { shallow: true })} className="ml-auto">
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Urgency banner */}
        <UrgencyBanner submission={submission} />

        {/* Main content */}
        {isAnalyzing && <AnalyzingState />}

        {isComplete && submission.notebook && (
          <NotebookResults notebook={submission.notebook} />
        )}

        {isComplete && !submission.notebook && (
          <div className="text-center py-12 text-gray-400">
            <p>Analysis complete — results are being prepared.</p>
            <Button variant="outline" className="mt-4" onClick={refresh}>Refresh</Button>
          </div>
        )}

        {!isAnalyzing && !isComplete && (
          <div className="space-y-6">
            {/* Case summary card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-3">Case Summary</h2>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                {submission.issue_type && (
                  <>
                    <dt className="text-gray-500">Issue</dt>
                    <dd className="text-gray-900 font-medium capitalize">{submission.issue_type.replace(/_/g, ' ')}</dd>
                  </>
                )}
                {submission.property_address && (
                  <>
                    <dt className="text-gray-500">Property</dt>
                    <dd className="text-gray-900 truncate">{submission.property_address}</dd>
                  </>
                )}
                {submission.landlord_name && (
                  <>
                    <dt className="text-gray-500">Landlord</dt>
                    <dd className="text-gray-900">{submission.landlord_name}</dd>
                  </>
                )}
                {submission.court_date && (
                  <>
                    <dt className="text-gray-500">Court Date</dt>
                    <dd className="text-red-700 font-semibold">{formatDate(submission.court_date)}</dd>
                  </>
                )}
              </dl>
            </div>

            {/* Document upload */}
            {showDocUpload && token && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h2 className="font-semibold text-gray-900 mb-1">
                  Step {step === 1 ? '2' : '2'}: Upload Your Documents
                </h2>
                <DocumentUploadPanel
                  submissionId={submission.id}
                  token={token}
                  existingDocs={submission.documents}
                  onUploaded={refresh}
                />
              </div>
            )}

            {/* Payment CTA */}
            {showPayment && token && (
              <PaymentCTA
                submissionId={submission.id}
                token={token}
                priceDisplay={priceDisplay}
                onCheckout={refresh}
              />
            )}
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-center text-xs text-gray-400 pb-4">
          TenantGuard is not a law firm and does not provide legal advice.
          This analysis is for informational purposes only.{' '}
          <Link href="/privacy" className="underline hover:text-gray-600">Privacy Policy</Link>
        </p>
      </main>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)

  if (!session) {
    return {
      redirect: { destination: '/api/auth/signin', permanent: false },
    }
  }

  const token = (session as any).access_token
  const id = parseInt(context.params?.id as string)

  if (!id || isNaN(id)) {
    return { notFound: true }
  }

  try {
    const [submission] = await Promise.all([
      getIntakeSubmission(id, token),
    ])

    // Simple price default — the real price endpoint requires auth which SSR has
    const priceDisplay = process.env.INTAKE_ANALYSIS_PRICE_DISPLAY ?? '$49'

    return {
      props: { initialSubmission: submission, priceDisplay },
    }
  } catch {
    return { notFound: true }
  }
}
