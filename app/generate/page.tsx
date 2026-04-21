'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Navbar } from '@/components/Navbar'
import { GenerateInput } from '@/components/GenerateInput'
import { StreamingTerminal } from '@/components/StreamingTerminal'
import { DataTable } from '@/components/DataTable'
import { ExportToggle } from '@/components/ExportToggle'
import { Button } from '@/components/ui/button'
import { csvToJSON } from '@/lib/utils/csv-export'
import { ChevronRight } from 'lucide-react'

export default function GeneratePage() {
  const [streamContent, setStreamContent] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [generatedData, setGeneratedData] = useState<any[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [hasCompleted, setHasCompleted] = useState(false)

  const handleGenerate = async (prompt: string) => {
    setStreamContent('')
    setGeneratedData([])
    setHeaders([])
    setHasCompleted(false)
    setIsStreaming(true)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })

      if (!response.ok) {
        throw new Error('Generation failed')
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        buffer += chunk
        setStreamContent((prev) => prev + chunk)
      }

      // Final flush
      const finalChunk = decoder.decode()
      if (finalChunk) {
        buffer += finalChunk
        setStreamContent((prev) => prev + finalChunk)
      }

      // Parse the CSV data
      const jsonData = csvToJSON(buffer)
      const parsedHeaders = jsonData.length > 0 ? Object.keys(jsonData[0]) : []

      setHeaders(parsedHeaders)
      setGeneratedData(jsonData)

      // Add to catalog
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
          console.error('[v0] Failed to add to catalog:', err)
        }
      }
    } catch (error) {
      console.error('[v0] Generation error:', error)
      setStreamContent('Error: Failed to generate data. Please try again.')
    } finally {
      setIsStreaming(false)
    }
  }

  const handleStreamComplete = () => {
    setHasCompleted(true)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: 'easeOut' },
    },
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-6 sm:py-8">
        <motion.div
          className="grid gap-4 sm:gap-8 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Input Section */}
          <motion.div className="lg:col-span-1" variants={itemVariants}>
            <div className="sticky top-20 space-y-4 sm:space-y-6 rounded-lg border border-border bg-card p-4 sm:p-6">
              <div>
                <h2 className="text-base sm:text-lg font-semibold mb-2">Create Dataset</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Describe your data needs in natural language. Be specific about domain,
                  geography, and metrics.
                </p>
              </div>
              <GenerateInput onSubmit={handleGenerate} isLoading={isStreaming} />
              <div className="border-t border-border pt-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  💡 <strong>Pro tip:</strong> Specify African countries, real place names,
                  authentic demographics, and domain-specific indicators for best results.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Output Section */}
          <motion.div className="lg:col-span-2 space-y-6" variants={itemVariants}>
            {streamContent && (
              <>
                <StreamingTerminal
                  content={streamContent}
                  isStreaming={isStreaming}
                  onComplete={handleStreamComplete}
                />

                {hasCompleted && generatedData.length > 0 && (
                  <>
                    <ExportToggle data={generatedData} headers={headers} />
                    <DataTable data={generatedData} headers={headers} />

                    <div className="rounded-lg border border-border bg-card p-6">
                      <h3 className="font-semibold mb-2">Next Steps</h3>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <ChevronRight className="h-4 w-4 text-primary" />
                          Your dataset is ready for download
                        </li>
                        <li className="flex items-center gap-2">
                          <ChevronRight className="h-4 w-4 text-primary" />
                          Check the{' '}
                          <Link href="/catalog" className="text-primary hover:underline">
                            Catalog
                          </Link>{' '}
                          to find all your generated datasets
                        </li>
                        <li className="flex items-center gap-2">
                          <ChevronRight className="h-4 w-4 text-primary" />
                          Validate your data quality on the{' '}
                          <Link href="/data-quality" className="text-primary hover:underline">
                            Data Quality
                          </Link>{' '}
                          page
                        </li>
                      </ul>
                    </div>
                  </>
                )}
              </>
            )}

            {!streamContent && (
              <div className="rounded-lg border border-dashed border-border bg-card/50 p-12 text-center">
                <div className="space-y-2">
                  <p className="text-muted-foreground">
                    Enter a prompt to generate synthetic data
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Data will appear here as it's generated in real-time
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      </main>
    </div>
  )
}

function extractDomain(prompt: string): string {
  const domains = [
    'Healthcare',
    'FinTech',
    'Agriculture',
    'Education',
    'Energy',
    'Labor',
  ]
  const lower = prompt.toLowerCase()

  for (const domain of domains) {
    if (lower.includes(domain.toLowerCase())) {
      return domain
    }
  }

  return 'General'
}

function extractCountry(prompt: string): string {
  const countries: Record<string, string> = {
    nigeria: 'Nigeria',
    nigerian: 'Nigeria',
    kenya: 'Kenya',
    kenyan: 'Kenya',
    ghana: 'Ghana',
    ghanaian: 'Ghana',
    'south africa': 'South Africa',
    'south african': 'South Africa',
    uganda: 'Uganda',
    ugandan: 'Uganda',
    senegal: 'Senegal',
    senegalese: 'Senegal',
  }

  const lower = prompt.toLowerCase()
  for (const [key, value] of Object.entries(countries)) {
    if (lower.includes(key)) {
      return value
    }
  }

  return 'Africa'
}
