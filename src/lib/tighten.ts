import { countText } from './parseContent'
import type { TemplateFieldLimit } from '../types'

function fits(text: string, limit: TemplateFieldLimit): boolean {
  const count = countText(text)
  return count.words <= limit.words && count.chars <= limit.chars
}

const ADVERBS = ['very', 'really', 'just', 'actually', 'literally', 'basically', 'simply', 'quite']

function removeAdverbs(text: string): string {
  let result = text
  for (const adverb of ADVERBS) {
    result = result.replace(new RegExp(`\\b${adverb}\\b\\s*`, 'gi'), '')
  }
  return result.replace(/\s{2,}/g, ' ').trim()
}

const FILLER_OPENERS: [RegExp, string][] = [
  [/^in order to\s+/i, 'To '],
  [/^due to the fact that\s+/i, 'Because '],
  [/^at this point in time\s*,?\s*/i, 'Now '],
]

function removeFillerOpeners(text: string): string {
  let result = text
  for (const [pattern, replacement] of FILLER_OPENERS) {
    result = result.replace(pattern, replacement)
  }
  return result.trim()
}

const PHRASE_REPLACEMENTS: [RegExp, string][] = [
  [/\bis able to\b/gi, 'can'],
  [/\bin the event that\b/gi, 'if'],
  [/\butilize\b/gi, 'use'],
]

function replacePhrases(text: string): string {
  let result = text
  for (const [pattern, replacement] of PHRASE_REPLACEMENTS) {
    result = result.replace(pattern, replacement)
  }
  return result
}

const QUALIFIERS = [/\bin my opinion,?\s*/gi, /\bi think that\s*/gi, /\bit should be noted that\s*/gi]

function cutQualifiers(text: string): string {
  let result = text
  for (const pattern of QUALIFIERS) {
    result = result.replace(pattern, '')
  }
  return result.replace(/\s{2,}/g, ' ').trim()
}

/** Splits a sentence longer than 20 words at its first comma, keeping the first half. */
function splitLongSentences(text: string): string {
  const sentences = text.split(/(?<=[.!?])\s+/)
  const shortened = sentences.map((sentence) => {
    const { words } = countText(sentence)
    if (words <= 20) return sentence
    const commaIndex = sentence.indexOf(',')
    if (commaIndex === -1) return sentence
    const head = sentence.slice(0, commaIndex).trim()
    const endsWithPunctuation = /[.!?]$/.test(sentence.trim())
    return endsWithPunctuation ? `${head}.` : head
  })
  return shortened.join(' ').trim()
}

/** Truncates to the last complete word that fits under the char limit, appending an ellipsis. */
function truncateToLimit(text: string, limit: TemplateFieldLimit): string {
  if (text.length <= limit.chars) return text
  const budget = Math.max(0, limit.chars - 1) // leave room for the ellipsis
  const sliced = text.slice(0, budget)
  const lastSpace = sliced.lastIndexOf(' ')
  const cut = lastSpace > 0 ? sliced.slice(0, lastSpace) : sliced
  return `${cut.trim()}…`
}

/**
 * Rules-based, client-side rewrite that shortens `text` toward `limit`.
 * Applies each step in order, stopping as soon as the text fits. Never
 * calls an API and never auto-applies — callers show the result as a
 * suggestion the user can accept or dismiss.
 */
export function tighten(text: string, limit: TemplateFieldLimit): string {
  let result = text.trim()
  if (fits(result, limit)) return result

  const steps: ((t: string) => string)[] = [
    removeAdverbs,
    removeFillerOpeners,
    replacePhrases,
    cutQualifiers,
    splitLongSentences,
  ]

  for (const step of steps) {
    result = step(result)
    if (fits(result, limit)) return result
  }

  return truncateToLimit(result, limit)
}
