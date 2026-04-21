'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Navbar } from '@/components/Navbar'
import { FileUpload } from '@/components/FileUpload'
import { QualityAnalysisResults } from '@/components/QualityAnalysisResults'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { QualityAnalysisResult } from '@/lib/services/data-quality'
import { arrayToJSON, downloadFile } from '@/lib/utils/csv-export'

export default function DataQualityPage() {
  const [analysis, setAnalysis] = useState<QualityAnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = async (file: File) => {
    setError(null)
    setAnalysis(null)
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || 'Analysis failed')
      }

      const data = await response.json()
      setAnalysis(data.analysis)
    } catch (err) {
      console.error('Analysis error:', err)
      setError((err as Error).message || 'Failed to analyze file')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadReport = () => {
    if (!analysis) return

    const report = {
      timestamp: new Date().toISOString(),
      fileMetrics: {
        totalRows: analysis.totalRows,
        totalColumns: analysis.totalColumns,
        fileSize: analysis.fileSize,
        detectedDomain: analysis.detectedDomain,
      },
      qualityMetrics: {
        overallCompleteness: analysis.overallCompleteness,
        duplicateRows: analysis.duplicateRows,
        duplicatePercentage: analysis.duplicatePercentage,
        piiColumnsCount: analysis.piiColumnsCount,
      },
      modelReadiness: {
        score: analysis.modelReadinessScore,
        breakdown: analysis.scoreBreakdown,
      },
      columns: analysis.columns.map((c) => ({
        name: c.name,
        dataType: c.dataType,
        missingPercentage: c.missingPercentage,
        uniqueCount: c.uniqueCount,
        isPII: c.isPII,
        ...(c.mean !== undefined && {
          statistics: {
            mean: c.mean,
            median: c.median,
            stdDev: c.stdDev,
            min: c.min,
            max: c.max,
            outliers: c.outlierCount,
          },
        }),
      })),
    }

    const json = arrayToJSON(report as any)
    downloadFile(json, `data-quality-report-${Date.now()}.json`, 'application/json')
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
          className="space-y-4 sm:space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Info Section */}
          <motion.div variants={itemVariants} className="rounded-lg border border-border bg-card p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">Data Quality Analyzer</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
              Upload your dataset to analyze data quality, identify gaps, and get a model readiness
              score. Perfect for data scientists and ML engineers validating datasets before
              training.
            </p>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary">✓</span>
                <span>Detect missing values, duplicates, and inconsistencies</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">✓</span>
                <span>Identify PII-sensitive columns requiring anonymization</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">✓</span>
                <span>Get a model readiness score (0-100)</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">✓</span>
                <span>Receive AI-powered recommendations for data improvement</span>
              </li>
            </ul>
          </motion.div>

          {!analysis ? (
            <motion.div variants={itemVariants} className="grid gap-4 sm:gap-8 lg:grid-cols-2">
              {/* Upload Section */}
              <motion.div variants={itemVariants} className="rounded-lg border border-border bg-card p-4 sm:p-6">
                <FileUpload onFileSelect={handleFileSelect} isLoading={loading} />

                {error && (
                  <div className="mt-4 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/50 p-4">
                    <p className="text-sm text-red-900 dark:text-red-100">{error}</p>
                  </div>
                )}

                {loading && (
                  <div className="mt-6 space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-4/6" />
                  </div>
                )}
              </motion.div>

              {/* Help Section */}
              <motion.div variants={itemVariants} className="rounded-lg border border-border bg-card p-4 sm:p-6 space-y-4">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-2">Supported Formats</h3>
                  <ul className="text-xs sm:text-sm text-muted-foreground space-y-1">
                    <li>• CSV files</li>
                    <li>• JSON arrays</li>
                    <li>• Excel (XLSX)</li>
                    <li>• Max file size: 50MB</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-2">What We Check</h3>
                  <ul className="text-xs sm:text-sm text-muted-foreground space-y-1">
                    <li>• Missing value percentages per column</li>
                    <li>• Data type consistency</li>
                    <li>• Duplicate rows detection</li>
                    <li>• Statistical completeness</li>
                    <li>• PII sensitivity flags</li>
                    <li>• Numeric statistics (mean, median, std dev)</li>
                  </ul>
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div variants={itemVariants}>
              <QualityAnalysisResults
                analysis={analysis}
                onDownloadReport={handleDownloadReport}
              />
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  )
}
