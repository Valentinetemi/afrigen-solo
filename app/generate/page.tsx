'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Navbar } from '@/components/Navbar'
import { GenerateInput } from '@/components/GenerateInput'
import { StreamingTerminal } from '@/components/StreamingTerminal'
import { DataTable } from '@/components/DataTable'
import { ExportToggle } from '@/components/ExportToggle'
import { Button } from '@/components/ui/button'
import { csvToJSON } from '@/lib/utils/csv-export'
import { ChevronRight, Upload, Sparkles, Database, Globe, Zap, CheckCircle } from 'lucide-react'

// ── Idle right-panel: animated stats + floating preview rows ──────────────────

const PREVIEW_ROWS = [
  { id: 'PT-00421', state: 'Lagos', diagnosis: 'Malaria', outcome: 'Recovered' },
  { id: 'TXN-09831', lga: 'Ikeja', amount: '₦12,500', channel: 'USSD' },
  { id: 'FM-00112', crop: 'Maize', yield: '3.2 t/ha', season: 'Wet' },
  { id: 'ST-00553', school: 'FGC Abuja', score: '87/100', grade: 'A' },
  { id: 'PT-00784', state: 'Kano', diagnosis: 'Typhoid', outcome: 'Discharged' },
  { id: 'TXN-04421', lga: 'Surulere', amount: '₦4,200', channel: 'App' },
]

const STATS = [
  { label: 'Datasets Generated', value: '12,847', icon: Database, color: 'text-green-600', bg: 'bg-green-50' },
  { label: 'African Countries', value: '18', icon: Globe, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Avg Generation Time', value: '8s', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
  { label: 'Model Ready Datasets', value: '9,203', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
]

const DOMAIN_TAGS = ['🏥 Health', '💳 Finance', '🌾 Agriculture', '📚 Education', '🚌 Transport', '⚡ Energy', '🏗️ Infrastructure', '📡 Telecom']

function FloatingRow({ row, delay }: { row: typeof PREVIEW_ROWS[0]; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.5, ease: 'easeOut' }}
      className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white border border-gray-100 shadow-sm text-xs font-mono"
    >
      <span className="text-green-600 font-semibold shrink-0">{Object.values(row)[0]}</span>
      <div className="flex gap-2 flex-wrap">
        {Object.entries(row).slice(1).map(([k, v]) => (
          <span key={k} className="text-gray-400">
            <span className="text-gray-300">{k}: </span>{v}
          </span>
        ))}
      </div>
    </motion.div>
  )
}

function IdlePanel() {
  const [tick, setTick] = useState(0)
  const [visibleRows, setVisibleRows] = useState<number[]>([])

  // Cycle rows in/out
  useEffect(() => {
    setVisibleRows([0, 1, 2])
    const interval = setInterval(() => {
      setTick(t => t + 1)
    }, 2800)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const base = tick % PREVIEW_ROWS.length
    setVisibleRows([base, (base + 1) % PREVIEW_ROWS.length, (base + 2) % PREVIEW_ROWS.length])
  }, [tick])

  return (
    <div className="flex flex-col h-full gap-6 justify-center px-2">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 border border-green-100 mb-4">
          <motion.div
            className="w-2 h-2 rounded-full bg-green-500"
            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="text-xs font-semibold text-green-700">Ready to generate</span>
        </div>
        <h3 className="text-lg font-bold text-gray-800">Your data will appear here</h3>
        <p className="text-sm text-gray-400 mt-1">Real-time streaming, row by row</p>
      </motion.div>

      {/* Live preview rows */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Sample African Data</span>
          <motion.span
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-[10px] text-green-500 font-mono"
          >
            ● live preview
          </motion.span>
        </div>
        <AnimatePresence mode="popLayout">
          {visibleRows.map((rowIdx) => (
            <motion.div
              key={`${tick}-${rowIdx}`}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <FloatingRow row={PREVIEW_ROWS[rowIdx]} delay={0} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {STATS.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + i * 0.08 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 shadow-sm"
          >
            <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div>
              <p className="text-base font-bold text-gray-800 leading-none">{s.value}</p>
              <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Scrolling domain tags */}
      <div className="overflow-hidden relative">
        <div className="flex gap-2 flex-wrap">
          {DOMAIN_TAGS.map((tag, i) => (
            <motion.span
              key={tag}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.06 }}
              className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 text-[11px] font-medium border border-gray-200"
            >
              {tag}
            </motion.span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Streaming progress bar ────────────────────────────────────────────────────

function StreamingHeader({ rowCount, isStreaming }: { rowCount: number; isStreaming: boolean }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <motion.div
            className="w-2.5 h-2.5 rounded-full bg-green-500"
            animate={isStreaming ? { scale: [1, 1.4, 1], opacity: [1, 0.5, 1] } : { scale: 1, opacity: 1 }}
            transition={{ duration: 1, repeat: isStreaming ? Infinity : 0 }}
          />
          <span className="text-sm font-semibold text-gray-800">
            {isStreaming ? 'Generating…' : 'Complete'}
          </span>
        </div>
        {rowCount > 0 && (
          <motion.span
            key={rowCount}
            initial={{ scale: 1.2, color: '#16a34a' }}
            animate={{ scale: 1, color: '#6b7280' }}
            className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded-full"
          >
            {rowCount} rows
          </motion.span>
        )}
      </div>
      {isStreaming && (
        <div className="w-32 h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <motion.div
            className="h-full bg-green-500 rounded-full"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: '50%' }}
          />
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function GeneratePage() {
  const [streamContent, setStreamContent] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [generatedData, setGeneratedData] = useState<any[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [hasCompleted, setHasCompleted] = useState(false)
  const [rowCount, setRowCount] = useState(0)

  const handleGenerate = async (prompt: string) => {
    setStreamContent('')
    setGeneratedData([])
    setHeaders([])
    setHasCompleted(false)
    setIsStreaming(true)
    setRowCount(0)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })

      if (!response.ok) throw new Error('Generation failed')

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let buffer = ''
      let lineCount = 0

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        buffer += chunk
        setStreamContent(prev => prev + chunk)

        // Count rows live
        const newLines = chunk.split('\n').filter(l => l.trim()).length
        lineCount += newLines
        setRowCount(Math.max(0, lineCount - 1)) // subtract header
      }

      const finalChunk = decoder.decode()
      if (finalChunk) {
        buffer += finalChunk
        setStreamContent(prev => prev + finalChunk)
      }

      const jsonData = csvToJSON(buffer)
      const parsedHeaders = jsonData.length > 0 ? Object.keys(jsonData[0]) : []
      setHeaders(parsedHeaders)
      setGeneratedData(jsonData)
      setRowCount(jsonData.length)

      if (jsonData.length > 0) {
        try {
          const domain = extractDomain(prompt)
          const country = extractCountry(prompt)
          await fetch('/api/catalog', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              csvData: buffer,
              name: `Generated: ${domain} - ${country}`,
              domain,
              country,
            }),
          })
        } catch (err) {
          console.error('Failed to add to catalog:', err)
        }
      }
    } catch (error) {
      console.error('Generation error:', error)
      setStreamContent('Error: Failed to generate data. Please try again.')
    } finally {
      setIsStreaming(false)
      setHasCompleted(true)
    }
  }

  const handleStreamComplete = () => setHasCompleted(true)

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <Navbar />

      <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-8 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[calc(100vh-120px)]">

          {/* ── LEFT: Input panel ── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="flex flex-col"
          >
            <div className="sticky top-6 rounded-2xl border border-gray-200 bg-white shadow-sm p-6 sm:p-8">
              <GenerateInput onSubmit={handleGenerate} isLoading={isStreaming} />

              {/* Pro tip */}
              <div className="mt-6 pt-5 border-t border-gray-100">
                <div className="flex items-start gap-2.5">
                  <Sparkles className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    <span className="font-semibold text-gray-500">Pro tip:</span> Specify African countries, real place names, authentic demographics, and domain-specific indicators for best results.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── RIGHT: Output panel ── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
            className="flex flex-col"
          >
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm flex-1 overflow-hidden">

              <AnimatePresence mode="wait">

                {/* Idle state */}
                {!streamContent && !isStreaming && (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.3 }}
                    className="h-full min-h-[600px] p-6 sm:p-8"
                  >
                    <IdlePanel />
                  </motion.div>
                )}

                {/* Streaming + completed state */}
                {(streamContent || isStreaming) && (
                  <motion.div
                    key="streaming"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="p-6 sm:p-8 flex flex-col gap-6"
                  >
                    {/* Streaming header with live row count */}
                    <StreamingHeader rowCount={rowCount} isStreaming={isStreaming} />

                    {/* Terminal */}
                    <StreamingTerminal
                      content={streamContent}
                      isStreaming={isStreaming}
                      onComplete={handleStreamComplete}
                    />

                    {/* Post-completion */}
                    <AnimatePresence>
                      {hasCompleted && generatedData.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, ease: 'easeOut' }}
                          className="flex flex-col gap-5"
                        >
                          <ExportToggle data={generatedData} headers={headers} />
                          <DataTable data={generatedData} headers={headers} />

                          {/* Next steps card */}
                          <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                                <CheckCircle className="w-3 h-3 text-green-600" />
                              </div>
                              <h3 className="text-sm font-semibold text-gray-800">Dataset ready</h3>
                            </div>

                            <ul className="space-y-2.5 mb-5">
                              {[
                                { text: 'Your dataset is ready for download', href: null },
                                { text: 'View all datasets in the', link: 'Catalog', href: '/catalog' },
                                { text: 'Validate model readiness on', link: 'Data Quality', href: '/data-quality' },
                              ].map((item, i) => (
                                <motion.li
                                  key={i}
                                  initial={{ opacity: 0, x: -8 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.08 }}
                                  className="flex items-center gap-2 text-xs text-gray-600"
                                >
                                  <ChevronRight className="w-3 h-3 text-green-500 shrink-0" />
                                  <span>
                                    {item.text}{' '}
                                    {item.href && (
                                      <Link href={item.href} className="text-green-600 font-semibold hover:underline">
                                        {item.link}
                                      </Link>
                                    )}
                                  </span>
                                </motion.li>
                              ))}
                            </ul>

                            <div className="pt-4 border-t border-gray-200">
                              <p className="text-xs font-medium text-gray-600 mb-3">
                                Ready to check training quality?
                              </p>
                              <Link href="/data-quality">
                                <Button className="w-full sm:w-auto gap-2 bg-green-600 hover:bg-green-700 text-white text-xs h-9">
                                  <Upload className="h-3.5 w-3.5" />
                                  Check Data Quality
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}

function extractDomain(prompt: string): string {
  const domains = ['Healthcare', 'FinTech', 'Agriculture', 'Education', 'Energy', 'Labor']
  const lower = prompt.toLowerCase()
  for (const domain of domains) {
    if (lower.includes(domain.toLowerCase())) return domain
  }
  return 'General'
}

function extractCountry(prompt: string): string {
  const countries: Record<string, string> = {
    nigeria: 'Nigeria', nigerian: 'Nigeria',
    kenya: 'Kenya', kenyan: 'Kenya',
    ghana: 'Ghana', ghanaian: 'Ghana',
    'south africa': 'South Africa',
    uganda: 'Uganda', senegal: 'Senegal',
  }
  const lower = prompt.toLowerCase()
  for (const [key, value] of Object.entries(countries)) {
    if (lower.includes(key)) return value
  }
  return 'Africa'
}