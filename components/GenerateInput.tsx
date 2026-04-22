'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface GenerateInputProps {
  onSubmit: (prompt: string) => Promise<void>
  isLoading?: boolean
  initialPrompt?: string
}

const DOMAINS = [
  { id: 'health', label: 'Health', emoji: '🏥', hint: 'malaria, patient records, clinic visits' },
  { id: 'finance', label: 'Finance', emoji: '💳', hint: 'mobile money, transactions, loans' },
  { id: 'agriculture', label: 'Agriculture', emoji: '🌾', hint: 'crop yields, farm data, weather' },
  { id: 'education', label: 'Education', emoji: '📚', hint: 'student scores, school records' },
  { id: 'transport', label: 'Transport', emoji: '🚌', hint: 'routes, fares, ridership' },
]

const COUNTRIES = ['Nigeria', 'Kenya', 'Ghana', 'South Africa', 'Ethiopia', 'Tanzania', 'Rwanda', 'Uganda']

const ROW_PRESETS = [
  { label: '500', value: 500 },
  { label: '1K', value: 1000 },
  { label: '2K', value: 2000 },
]

const PLACEHOLDERS = [
  'Generate 1000 malaria patient records for Kano State with age, symptoms, test results, and treatment outcomes...',
  'Generate 500 mobile money transactions for Lagos with sender, receiver, amount in NGN, and channel...',
  'Generate 2000 crop yield records for Ogun State with crop type, rainfall, temperature, and harvest metrics...',
  'Generate 800 student exam records for Nairobi with subject, grade, school type, and county...',
]

const TIPS: Record<string, { text: string; type: 'warn' | 'info' }> = {
  name: { text: 'Avoid "patient names" — use Patient_ID instead to prevent PII flags.', type: 'warn' },
  phone: { text: 'Phone numbers are PII and will lower your quality score. Remove them.', type: 'warn' },
  address: { text: 'Full addresses are PII. Use LGA or State for cleaner data.', type: 'warn' },
  id: { text: 'Use structured IDs like PT-00142 rather than real ID numbers.', type: 'info' },
  default: { text: 'Be specific: mention country, region, row count, and key columns for best results.', type: 'info' },
}

function getActiveTip(prompt: string) {
  const lower = prompt.toLowerCase()
  if (lower.includes('name') && (lower.includes('patient') || lower.includes('person'))) return TIPS.name
  if (lower.includes('phone') || lower.includes('telephone')) return TIPS.phone
  if (lower.includes('address')) return TIPS.address
  if (lower.includes(' id') || lower.includes('_id')) return TIPS.id
  if (prompt.length > 30) return TIPS.default
  return null
}

function buildEnrichedPrompt(prompt: string, domain: string, country: string, rows: number): string {
  let enriched = prompt.trim()
  if (!/\d[\d,]*\s*(rows?|records?|samples?|entries)/i.test(enriched)) {
    enriched = `Generate ${rows} rows of ` + enriched.replace(/^generate\s+/i, '')
  }
  if (country && !enriched.toLowerCase().includes(country.toLowerCase())) enriched += ` in ${country}`
  if (domain && !enriched.toLowerCase().includes(domain)) enriched += `. This is a ${domain} dataset.`
  return enriched
}

function useTypewriter(strings: string[], speed = 28, pause = 2200) {
  const [display, setDisplay] = useState('')
  const [idx, setIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)

  useEffect(() => {
    const current = strings[idx]
    if (charIdx < current.length) {
      const t = setTimeout(() => { setDisplay(current.slice(0, charIdx + 1)); setCharIdx(c => c + 1) }, speed)
      return () => clearTimeout(t)
    } else {
      const t = setTimeout(() => { setIdx(i => (i + 1) % strings.length); setCharIdx(0); setDisplay('') }, pause)
      return () => clearTimeout(t)
    }
  }, [charIdx, idx])

  return display
}

function getChecks(prompt: string, rowCount: number) {
  return [
    { ok: !/patient.{0,10}name/i.test(prompt), label: 'No raw patient names (PII)' },
    { ok: !/phone|telephone|mobile number/i.test(prompt), label: 'No phone numbers (PII)' },
    { ok: prompt.length > 20, label: 'Prompt is descriptive enough' },
    { ok: rowCount <= 2000, label: 'Row count within quality range' },
  ]
}

export function GenerateInput({ onSubmit, isLoading = false, initialPrompt = '' }: GenerateInputProps) {
  const [prompt, setPrompt] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('generate_current_prompt') || initialPrompt
    }
    return initialPrompt
  })

  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt)
    }
  }, [initialPrompt])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('generate_current_prompt', prompt)
    }
  }, [prompt])
  const [domain, setDomain] = useState('')
  const [country, setCountry] = useState('Nigeria')
  const [rowCount, setRowCount] = useState(1000)
  const [focused, setFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const placeholder = useTypewriter(PLACEHOLDERS)
  const tip = getActiveTip(prompt)
  const checks = getChecks(prompt, rowCount)
  const allGood = checks.every(c => c.ok)
  const issueCount = checks.filter(c => !c.ok).length

  const handleSubmit = async () => {
    if (!prompt.trim() || isLoading) return
    await onSubmit(buildEnrichedPrompt(prompt, domain, country, rowCount))
    setPrompt('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleSubmit()
  }

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 180) + 'px'
  }, [prompt])

  return (
    <div className="w-full flex flex-col gap-5">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Create Dataset</h2>
        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
          Describe your data needs in natural language. Be specific about domain, geography, and metrics.
        </p>
      </motion.div>

      {/* ── Domain pills ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col gap-2"
      >
        <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
          Dataset Domain <span className="normal-case font-normal">(optional)</span>
        </span>
        <div className="flex flex-wrap gap-2">
          {DOMAINS.map((d, i) => (
            <motion.button
              key={d.id}
              type="button"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 + i * 0.05, type: 'spring', stiffness: 300 }}
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setDomain(prev => prev === d.id ? '' : d.id)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 cursor-pointer
                ${domain === d.id
                  ? 'bg-green-600 border-green-600 text-white shadow-md shadow-green-100'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-700 hover:bg-green-50/60 hover:shadow-sm'
                }
              `}
            >
              <span className="text-sm leading-none">{d.emoji}</span>
              <span>{d.label}</span>
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {domain && (
            <motion.p
              key={domain}
              initial={{ opacity: 0, height: 0, y: -4 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="text-xs text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-1.5 overflow-hidden"
            >
              💡 e.g. {DOMAINS.find(d => d.id === domain)?.hint}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Textarea ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col gap-2"
      >
        <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
          Describe your dataset
        </span>

        <div className={`
          relative rounded-xl border-2 bg-white transition-all duration-300
          ${focused
            ? 'border-green-500 shadow-lg shadow-green-50 ring-4 ring-green-500/8'
            : 'border-gray-200 shadow-sm'
          }
        `}>
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            disabled={isLoading}
            placeholder={placeholder || 'Describe what you want to generate...'}
            rows={3}
            className="w-full resize-none bg-transparent px-4 pt-3.5 pb-11 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none leading-relaxed"
            style={{ minHeight: 110 }}
          />

          {/* Bottom bar inside textarea */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-2 border-t border-gray-100">
            <span className="text-[10px] text-gray-300 font-mono">
              {prompt.length > 0 ? `${prompt.length} chars` : '⌘↵ to generate'}
            </span>
            <motion.button
              type="button"
              onClick={handleSubmit}
              disabled={!prompt.trim() || isLoading}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-30 disabled:cursor-not-allowed text-white text-[11px] font-semibold transition-colors"
            >
              {isLoading ? (
                <>
                  <motion.div
                    className="w-2.5 h-2.5 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                  />
                  Generating
                </>
              ) : (
                <>
                  Generate
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </motion.button>
          </div>
        </div>

        {/* Live tip */}
        <AnimatePresence mode="wait">
          {tip && (
            <motion.div
              key={tip.text}
              initial={{ opacity: 0, y: -4, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -4, height: 0 }}
              className={`flex items-start gap-2 rounded-lg px-3 py-2 text-xs border overflow-hidden ${
                tip.type === 'warn'
                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                  : 'bg-sky-50 border-sky-100 text-sky-700'
              }`}
            >
              <span className="shrink-0 mt-px">{tip.type === 'warn' ? '⚠️' : '💡'}</span>
              <span className="leading-relaxed">{tip.text}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Rows + Country ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28 }}
        className="grid grid-cols-2 gap-4"
      >
        {/* Rows */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Rows</span>
          <div className="flex gap-1">
            {ROW_PRESETS.map(p => (
              <button
                key={p.value}
                type="button"
                onClick={() => setRowCount(p.value)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 cursor-pointer ${
                  rowCount === p.value
                    ? 'bg-green-600 border-green-600 text-white shadow-sm'
                    : 'bg-white border-gray-200 text-gray-500 hover:border-green-400 hover:text-green-700 hover:bg-green-50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <input
            type="number"
            min={10}
            max={2000}
            value={rowCount}
            onChange={e => setRowCount(Math.min(2000, Math.max(10, Number(e.target.value))))}
            className="w-full px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-xs text-gray-700 text-center focus:outline-none focus:border-green-500 transition-colors"
          />
          <p className="text-[10px] text-gray-400">Max 2,000 for best quality</p>
        </div>

        {/* Country */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Country</span>
          <select
            value={country}
            onChange={e => setCountry(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-xs text-gray-700 focus:outline-none focus:border-green-500 transition-colors cursor-pointer"
          >
            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <p className="text-[10px] text-gray-400">Grounds names, LGAs & currency</p>
        </div>
      </motion.div>

      {/* ── Quality pre-flight ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.34 }}
        className={`rounded-xl border p-4 transition-all duration-500 ${
          allGood
            ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50/40'
            : 'border-gray-200 bg-gray-50/80'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
            Quality Pre-flight
          </span>
          <AnimatePresence mode="wait">
            {allGood ? (
              <motion.span
                key="ready"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-[10px] font-bold text-green-700 bg-green-100 px-2.5 py-0.5 rounded-full"
              >
                ✓ Ready
              </motion.span>
            ) : (
              <motion.span
                key="issues"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-[10px] text-red-400 font-semibold"
              >
                {issueCount} issue{issueCount !== 1 ? 's' : ''}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div className="flex flex-col gap-2.5">
          {checks.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.38 + i * 0.06 }}
              className="flex items-center gap-2.5"
            >
              <motion.div
                animate={{
                  backgroundColor: item.ok ? '#22c55e' : '#e5e7eb',
                  scale: item.ok ? [1, 1.15, 1] : 1,
                }}
                transition={{ duration: 0.3 }}
                className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
              >
                {item.ok && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <motion.path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.25 }}
                    />
                  </svg>
                )}
              </motion.div>
              <span className={`text-xs transition-colors duration-200 ${
                item.ok ? 'text-gray-500' : 'text-red-500 font-medium'
              }`}>
                {item.label}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── Primary generate button ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.42 }}
      >
        <motion.button
          type="button"
          onClick={handleSubmit}
          disabled={!prompt.trim() || isLoading}
          whileHover={!isLoading && prompt.trim() ? {
            scale: 1.01,
            boxShadow: '0 10px 40px rgba(22,163,74,0.3)',
          } : {}}
          whileTap={!isLoading && prompt.trim() ? { scale: 0.98 } : {}}
          className="w-full py-3.5 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm relative overflow-hidden transition-colors duration-200 cursor-pointer"
        >
          {/* Shimmer */}
          {!isLoading && prompt.trim() && (
            <motion.span
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }}
            />
          )}

          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.span
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-2"
              >
                <motion.div
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.75, repeat: Infinity, ease: 'linear' }}
                />
                <span>Generating dataset</span>
                <motion.span
                  animate={{ opacity: [1, 0.2, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  className="text-white/70"
                >
                  ···
                </motion.span>
              </motion.span>
            ) : (
              <motion.span
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-2"
              >
                Generate Dataset
                <motion.svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  animate={{ x: [0, 3, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
                </motion.svg>
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </motion.div>
    </div>
  )
}