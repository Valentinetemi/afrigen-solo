'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface GenerateInputProps {
  onSubmit: (prompt: string) => Promise<void>
  isLoading?: boolean
}

const placeholders = [
  'Generate 30,000 malaria prediction rows for Kano State, Nigeria with age, symptoms, test results, and treatment outcomes...',
  'Generate 10,000 mobile money transactions for Lagos, Nigeria with sender, receiver, amount, and timestamp data...',
  'Generate 50,000 crop yield records for Ogun State, Nigeria with crop type, rainfall, temperature, and harvest metrics...',
]

export function GenerateInput({ onSubmit, isLoading = false }: GenerateInputProps) {
  const [prompt, setPrompt] = useState('')
  const [displayPlaceholder, setDisplayPlaceholder] = useState('')
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)

  // Typewriter effect for placeholder
  useEffect(() => {
    const currentPlaceholder = placeholders[placeholderIndex]
    const timer = setTimeout(() => {
      if (charIndex < currentPlaceholder.length) {
        setDisplayPlaceholder(currentPlaceholder.slice(0, charIndex + 1))
        setCharIndex(charIndex + 1)
      } else {
        // Wait before cycling to next placeholder
        setTimeout(() => {
          setPlaceholderIndex((prev) => (prev + 1) % placeholders.length)
          setCharIndex(0)
          setDisplayPlaceholder('')
        }, 2000)
      }
    }, 30)

    return () => clearTimeout(timer)
  }, [charIndex, placeholderIndex])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return

    await onSubmit(prompt)
    setPrompt('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSubmit(e as any)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3 sm:space-y-4">
      <div className="space-y-2">
        <label htmlFor="prompt" className="text-xs sm:text-sm font-medium">
          Describe your dataset
        </label>
        <Textarea
          id="prompt"
          placeholder={displayPlaceholder || 'Enter your dataset description...'}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          className="min-h-[100px] sm:min-h-[120px] resize-none transition-shadow duration-200 focus:outline-none focus:ring-0 focus:shadow-[0_0_0_3px_rgba(22,163,74,0.15)] text-sm"
        />
        <p className="text-xs text-muted-foreground leading-tight">
          Cmd+Enter or Ctrl+Enter to submit
        </p>
      </div>

      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          type="submit"
          disabled={!prompt.trim() || isLoading}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold relative overflow-hidden group text-sm sm:text-base"
          size="lg"
        >
          <motion.span
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          {isLoading ? 'Generating...' : 'Generate Dataset'}
        </Button>
      </motion.div>
    </form>
  )
}
