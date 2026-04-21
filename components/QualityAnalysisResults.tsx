'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { QualityAnalysisResult } from '@/lib/services/data-quality'
import { AlertCircle, CheckCircle, AlertTriangle, Download, AlertOctagon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface QualityAnalysisResultsProps {
  analysis: QualityAnalysisResult
  onDownloadReport?: () => void
}

export function QualityAnalysisResults({
  analysis,
  onDownloadReport,
}: QualityAnalysisResultsProps) {
  const [recommendation, setRecommendation] = useState<string | null>(null)
  const [loadingRec, setLoadingRec] = useState(true)

  useEffect(() => {
    async function fetchRecommendation() {
      try {
        const report = `
Dataset Analysis Summary:
- Total Rows: ${analysis.totalRows}
- Total Columns: ${analysis.totalColumns}
- Overall Completeness: ${analysis.overallCompleteness}%
- Duplicate Rows: ${analysis.duplicatePercentage}%
- PII Columns Detected: ${analysis.piiColumnsCount}
- Model Readiness Score: ${analysis.modelReadinessScore}/100

Score Breakdown:
- Missing Values Penalty: ${analysis.scoreBreakdown.missingValuesPenalty}
- Duplicate Rows Penalty: ${analysis.scoreBreakdown.duplicateRowsPenalty}
- Low Row Count Penalty: ${analysis.scoreBreakdown.lowRowCountPenalty}
- PII Exposure Penalty: ${analysis.scoreBreakdown.piiExposurePenalty}
- Inconsistent Data Penalty: ${analysis.scoreBreakdown.inconsistentDataPenalty}

Column Analysis:
${analysis.columns.map((c) => `- ${c.name}: ${c.dataType}, ${c.missingPercentage}% missing${c.isPII ? ' (PII)' : ''}`).join('\n')}
        `.trim()

        const res = await fetch('/api/ai-recommendation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ analysisReport: report }),
        })

        if (res.ok) {
          const data = await res.json()
          setRecommendation(data.recommendation)
        }
      } catch (error) {
        console.error('[v0] Recommendation fetch failed:', error)
      } finally {
        setLoadingRec(false)
      }
    }

    fetchRecommendation()
  }, [analysis])

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400'
    if (score >= 50) return 'text-amber-600 dark:text-amber-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'from-green-500/10 to-green-500/5'
    if (score >= 50) return 'from-amber-500/10 to-amber-500/5'
    return 'from-red-500/10 to-red-500/5'
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
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
    <motion.div
      className="space-y-4 sm:space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Overview Section */}
      <motion.div variants={itemVariants} className="rounded-lg border border-border bg-card p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold mb-4">Overview</h3>
        <p className="text-xs sm:text-sm text-muted-foreground mb-4 leading-relaxed">
          {analysis.summary}
        </p>

        <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
          <div className="space-y-1 p-3 rounded bg-muted/50">
            <p className="text-xs text-muted-foreground">Total Rows</p>
            <p className="text-lg sm:text-2xl font-bold">{analysis.totalRows.toLocaleString()}</p>
          </div>
          <div className="space-y-1 p-3 rounded bg-muted/50">
            <p className="text-xs text-muted-foreground">Total Columns</p>
            <p className="text-lg sm:text-2xl font-bold">{analysis.totalColumns}</p>
          </div>
          <div className="space-y-1 p-3 rounded bg-muted/50">
            <p className="text-xs text-muted-foreground">Completeness</p>
            <p className="text-lg sm:text-2xl font-bold">{analysis.overallCompleteness}%</p>
          </div>
          <div className="space-y-1 p-3 rounded bg-muted/50">
            <p className="text-xs text-muted-foreground">File Size</p>
            <p className="text-lg sm:text-2xl font-bold">{analysis.fileSize}</p>
          </div>
        </div>
      </motion.div>

      {/* Model Readiness Score - Hero Circular Indicator */}
      <motion.div
        variants={itemVariants}
        className={`rounded-lg border border-border bg-gradient-to-br ${getScoreBgColor(analysis.modelReadinessScore)} p-6 sm:p-8`}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Circular Progress */}
          <div className="relative flex-shrink-0">
            <div className="relative w-40 h-40 sm:w-48 sm:h-48">
              {/* Background circle */}
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-muted"
                />
                {/* Progress circle */}
                <motion.circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className={getScoreColor(analysis.modelReadinessScore)}
                  strokeDasharray={`${(analysis.modelReadinessScore / 100) * 282.7} 282.7`}
                  initial={{ strokeDasharray: '0 282.7' }}
                  animate={{ strokeDasharray: `${(analysis.modelReadinessScore / 100) * 282.7} 282.7` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                />
              </svg>
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                >
                  <p className={`text-4xl sm:text-5xl font-bold ${getScoreColor(analysis.modelReadinessScore)}`}>
                    {Math.round(analysis.modelReadinessScore)}
                  </p>
                  <p className="text-xs text-muted-foreground text-center">out of 100</p>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Score Info */}
          <div className="flex-1 space-y-4">
            <div>
              <h3 className="text-lg sm:text-2xl font-bold mb-2">Model Readiness Score</h3>
              <p className="text-sm text-muted-foreground">
                {analysis.modelReadinessScore >= 80
                  ? 'Excellent! Your data is ready for model training.'
                  : analysis.modelReadinessScore >= 50
                    ? 'Good progress. Address the issues below to improve readiness.'
                    : 'Needs work. Focus on the highlighted issues before training.'}
              </p>
            </div>

            {/* Status icon */}
            <div>
              {analysis.modelReadinessScore >= 80 ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    Ready for Training
                  </span>
                </div>
              ) : analysis.modelReadinessScore >= 50 ? (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                    Caution: Review Issues
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <AlertOctagon className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">
                    Action Required
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-sm font-semibold mb-3">Score Breakdown (Penalties)</p>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-3 text-xs">
            {[
              { label: 'Missing Values', value: analysis.scoreBreakdown.missingValuesPenalty },
              { label: 'Duplicates', value: analysis.scoreBreakdown.duplicateRowsPenalty },
              { label: 'Row Count', value: analysis.scoreBreakdown.lowRowCountPenalty },
              { label: 'PII Exposure', value: analysis.scoreBreakdown.piiExposurePenalty },
              { label: 'Data Consistency', value: analysis.scoreBreakdown.inconsistentDataPenalty },
            ].map((item) => (
              <div key={item.label} className="space-y-1">
                <p className="text-muted-foreground">{item.label}</p>
                <div className="h-2 rounded bg-muted/50 overflow-hidden">
                  <motion.div
                    className={`h-full ${item.value > 15 ? 'bg-red-500' : item.value > 8 ? 'bg-amber-500' : 'bg-green-500'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(item.value * 5, 100)}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
                <p className="text-muted-foreground text-xs">-{item.value} pts</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* PII Detection */}
      {analysis.piiColumnsCount > 0 && (
        <motion.div
          variants={itemVariants}
          className="rounded-lg border-2 border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/30 p-4 sm:p-6"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                {analysis.piiColumnsCount} PII-Sensitive Column{analysis.piiColumnsCount !== 1 ? 's' : ''} Detected
              </h4>
              <div className="flex flex-wrap gap-2 mb-2">
                {analysis.columns
                  .filter((c) => c.isPII)
                  .map((c) => (
                    <Badge
                      key={c.name}
                      className="bg-red-600 hover:bg-red-700 text-white text-xs py-1"
                    >
                      <AlertOctagon className="w-3 h-3 mr-1" />
                      {c.name}
                    </Badge>
                  ))}
              </div>
              <p className="text-sm text-red-800 dark:text-red-200">
                These columns contain personally identifiable information and should be anonymized
                or removed before training models.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Column Breakdown */}
      <motion.div variants={itemVariants} className="space-y-3">
        <h3 className="text-base sm:text-lg font-semibold">Column Breakdown</h3>
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {analysis.columns.map((column, idx) => (
            <motion.div
              key={column.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + idx * 0.05 }}
              className="rounded-lg border border-border bg-card p-3 sm:p-4 hover:border-primary/50 transition"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm sm:text-base truncate">{column.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {column.dataType.charAt(0).toUpperCase() + column.dataType.slice(1)} • {column.uniqueCount} unique
                  </p>
                </div>
                <div className="flex gap-1 flex-wrap justify-end">
                  {column.isPII && (
                    <Badge className="bg-red-600 hover:bg-red-700 text-white text-xs">
                      <AlertOctagon className="w-3 h-3 mr-1" />
                      PII
                    </Badge>
                  )}
                  {column.missingPercentage > 20 && (
                    <Badge variant="secondary" className="text-xs">
                      {column.missingPercentage}% Missing
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid gap-2 grid-cols-2 sm:grid-cols-4 text-xs">
                <div className="p-2 rounded bg-muted/50">
                  <p className="text-muted-foreground">Missing</p>
                  <p className="font-bold text-sm">{column.missingPercentage}%</p>
                </div>
                <div className="p-2 rounded bg-muted/50">
                  <p className="text-muted-foreground">Duplicates</p>
                  <p className="font-bold text-sm">{column.duplicateCount}</p>
                </div>
                {column.mean !== undefined && (
                  <>
                    <div className="p-2 rounded bg-muted/50">
                      <p className="text-muted-foreground">Mean</p>
                      <p className="font-bold text-sm truncate">{column.mean}</p>
                    </div>
                    <div className="p-2 rounded bg-muted/50">
                      <p className="text-muted-foreground">StdDev</p>
                      <p className="font-bold text-sm truncate">{column.stdDev}</p>
                    </div>
                  </>
                )}
              </div>

              {column.sampleValues.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-1">Sample Values</p>
                  <p className="text-xs font-mono bg-muted/70 p-2 rounded overflow-x-auto max-w-full break-words">
                    {column.sampleValues.join(', ')}
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* AI Recommendation */}
      <motion.div
        variants={itemVariants}
        className="rounded-lg border border-border bg-card p-4 sm:p-6 border-l-4 border-l-green-500"
      >
        <h3 className="text-base sm:text-lg font-semibold mb-3">AI Recommendation</h3>
        {loadingRec ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        ) : recommendation ? (
          <>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">{recommendation}</p>
            <p className="text-xs text-muted-foreground italic">
              Generated by Gemini 2.0 Flash
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Unable to generate recommendation</p>
        )}
      </motion.div>

      {/* Download Report */}
      {onDownloadReport && (
        <motion.div variants={itemVariants}>
          <Button onClick={onDownloadReport} variant="outline" className="w-full">
            <Download className="mr-2 h-4 w-4" />
            Download Analysis Report
          </Button>
        </motion.div>
      )}
    </motion.div>
  )
}
