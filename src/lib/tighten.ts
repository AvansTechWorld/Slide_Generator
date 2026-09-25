import { countText } from './parseContent'

interface TextLimit {
  words: number
  chars: number
}

function fitsLimit(text: string, limit: TextLimit): boolean {
  const { words, chars } = countText(text)
  return words <= limit.words && chars <= limit.chars
}

// Word-boundary replace, case-insensitive, collapses the extra space left
// behind when a whole word/phrase is removed outright.
function replaceAll(text: string, pattern: string, replacement: string): string {
  const re = new RegExp(`\\b${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
  return text.replace(re, replacement)
}

const ADVERBS = ['very', 'really', 'just', 'actually', 'literally', 'basically', 'simply', 'quite']

const FILLER_OPENERS: [string, string][] = [
  ['in order to', 'to'],
  ['due to the fact that', 'because'],
  ['at this point in time', 'now'],
]

const PHRASE_SWAPS: [string, string][] = [
  ['is able to', 'can'],
  ['in the event that', 'if'],
  ['utilize', 'use'],
]

const CUT_QUALIFIERS = ['in my opinion', 'i think that', 'it should be noted that']

function collapseSpaces(text: string): string {
  return text.replace(/[ \t]{2,}/g, ' ').replace(/\s+([,.!?])/g, '$1').trim()
}

function removeAdverbs(text: string): string {
  let result = text
  for (const adverb of ADVERBS) {
    result = replaceAll(result, adverb, '')
  }
  return collapseSpaces(result)
}

function replaceFillerOpeners(text: string): string {
  let result = text
  for (const [phrase, replacement] of FILLER_OPENERS) {
    result = replaceAll(result, phrase, replacement)
  }
  return collapseSpaces(result)
}

function applyPhraseSwaps(text: string): string {
  let result = text
  for (const [phrase, replacement] of PHRASE_SWAPS) {
    result = replaceAll(result, phrase, replacement)
  }
  return collapseSpaces(result)
}

function cutQualifiers(text: string): string {
  let result = text
  for (const qualifier of CUT_QUALIFIERS) {
    result = replaceAll(result, qualifier, '')
  }
  return collapseSpaces(result)
}

// Splits sentences over 20 words at their first comma, keeping only the
// first clause. Applied per-sentence so short sentences are untouched.
function splitLongSentences(text: string): string {
  const sentences = text.split(/(?<=[.!?])\s+/)
  const shortened = sentences.map((sentence) => {
    const wordCount = sentence.trim().split(/\s+/).filter(Boolean).length
    if (wordCount <= 20) return sentence
    const commaIndex = sentence.indexOf(',')
    if (commaIndex === -1) return sentence
    const clause = sentence.slice(0, commaIndex).trim()
    return /[.!?]$/.test(clause) ? clause : `${clause}.`
  })
  return collapseSpaces(shortened.join(' '))
}

// Truncates to the last complete word that fits within both the word and
// char ceilings, then appends an ellipsis.
function truncateToLimit(text: string, limit: TextLimit): string {
  const words = text.trim().split(/\s+/)
  let result = ''
  for (const word of words) {
    const candidate = result ? `${result} ${word}` : word
    const withEllipsis = `${candidate}…`
    const { words: w, chars: c } = countText(withEllipsis)
    if (w > limit.words || c > limit.chars) break
    result = candidate
  }
  if (!result) {
    // Even one word doesn't fit under the char limit; hard-cut by chars.
    result = text.trim().slice(0, Math.max(0, limit.chars - 1)).trim()
  }
  return `${result}…`
}

/**
 * Rules-based, client-side text tightener. Applies each rule in order,
 * stopping as soon as the text fits the given word/char limit. Never
 * called automatically — callers show the result as a suggestion the
 * user can accept or dismiss.
 */
export function tighten(text: string, limit: TextLimit): string {
  if (fitsLimit(text, limit)) return text

  let result = text

  result = removeAdverbs(result)
  if (fitsLimit(result, limit)) return result

  result = replaceFillerOpeners(result)
  if (fitsLimit(result, limit)) return result

  result = applyPhraseSwaps(result)
  if (fitsLimit(result, limit)) return result

  result = cutQualifiers(result)
  if (fitsLimit(result, limit)) return result

  result = splitLongSentences(result)
  if (fitsLimit(result, limit)) return result

  result = truncateToLimit(result, limit)
  return result
}
