import type { SlideTag } from '../types'

export interface ParsedSlide {
  headline: string
  body: string
  tag: SlideTag
}

const STAT_PATTERN = /\d+(\.\d+)?%/
const ALL_CAPS_SHORT = /^[A-Z0-9][A-Z0-9 !?.'"-]{1,39}$/

/**
 * Smart Content Importer v2: tags a parsed slide based on simple,
 * deterministic signals in its headline/body.
 *   - headline ends with "?"            -> Question/Hook
 *   - body starts with "- " or "• "     -> List
 *   - headline has a number + "%"       -> Stat
 *   - headline is short + ALL CAPS      -> Cover/Hook
 */
export function detectSlideTag(headline: string, body: string): SlideTag {
  const trimmedHeadline = headline.trim()
  if (trimmedHeadline.endsWith('?')) return 'question-hook'
  if (STAT_PATTERN.test(trimmedHeadline)) return 'stat'
  if (trimmedHeadline.length <= 40 && trimmedHeadline === trimmedHeadline.toUpperCase() && ALL_CAPS_SHORT.test(trimmedHeadline)) {
    return 'cover-hook'
  }
  const firstBodyLine = body.split('\n')[0]?.trimStart() ?? ''
  if (firstBodyLine.startsWith('- ') || firstBodyLine.startsWith('• ')) return 'list'
  return 'none'
}

/** Best-matching cyber template id for a detected tag. */
export function templateIdForTag(tag: SlideTag): string {
  switch (tag) {
    case 'question-hook':
      return 'threat-brief'
    case 'list':
      return 'listicle'
    case 'stat':
      return 'stat-drop'
    case 'cover-hook':
      return 'threat-brief'
    default:
      return 'defender-takeaway'
  }
}

export const SLIDE_TAG_LABELS: Record<SlideTag, string> = {
  'question-hook': 'Question/Hook',
  list: 'List',
  stat: 'Stat',
  'cover-hook': 'Cover/Hook',
  none: '',
}

export interface TextCount {
  words: number
  chars: number
}

const WORD_TOKEN = /[\p{L}\p{N}]/u

/**
 * Counts words and characters in a piece of text.
 *   - words: split on whitespace, drop empty tokens and any token that
 *     contains no letters/numbers (so stray punctuation isn't a "word").
 *     Hyphenated words ("well-known") are a single token, so they count
 *     as one word.
 *   - chars: raw length including internal spaces, after trimming leading
 *     and trailing whitespace.
 */
export function countText(text: string): TextCount {
  const trimmed = text.trim()
  if (!trimmed) return { words: 0, chars: 0 }

  const words = trimmed
    .split(/\s+/)
    .filter((token) => token.length > 0 && WORD_TOKEN.test(token)).length

  return { words, chars: trimmed.length }
}

const HEADING_PREFIX = /^#{1,3}\s+/

function stripHeadingMarker(line: string): string {
  return line.replace(HEADING_PREFIX, '').trim()
}

function normalizeLineEndings(raw: string): string {
  return raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
}

function finishSlide(headline: string, body: string): ParsedSlide {
  return { headline, body, tag: detectSlideTag(headline, body) }
}

function parseBlock(block: string): ParsedSlide | null {
  const lines = block.split('\n')

  // Trim leading/trailing blank lines while preserving internal ones.
  let start = 0
  let end = lines.length - 1
  while (start <= end && lines[start].trim() === '') start++
  while (end >= start && lines[end].trim() === '') end--

  if (start > end) return null // blank block

  const trimmed = lines.slice(start, end + 1)
  const headline = stripHeadingMarker(trimmed[0])
  const body = trimmed.slice(1).join('\n').trim()

  if (!headline) return null

  return finishSlide(headline, body)
}

/**
 * Splits raw text into slides. Slides are separated by a line containing
 * only three dashes ("---"). The first non-empty line of each block becomes
 * the headline, the rest becomes the body.
 */
export function parseContent(raw: string): ParsedSlide[] {
  const normalized = normalizeLineEndings(raw)
  const blocks = normalized.split(/^\s*---\s*$/m)

  const slides: ParsedSlide[] = []
  for (const block of blocks) {
    const parsed = parseBlock(block)
    if (parsed) slides.push(parsed)
  }

  if (slides.length === 0) {
    throw new Error('No valid slides found. Separate slides with a line containing only "---".')
  }

  return slides
}

// ---------- Import format option ----------
// The importer supports a few common paste/export shapes. All of them
// funnel into the same ParsedSlide[] shape and the same preview/density
// validation — only how the raw text is split into headline/body differs.

export type ImportFormat = 'standard' | 'markdown-headings' | 'csv' | 'json'

export const IMPORT_FORMAT_OPTIONS: { value: ImportFormat; label: string; placeholder: string; hint: string }[] = [
  {
    value: 'standard',
    label: 'Standard (--- between slides)',
    placeholder: 'Headline one\nBody text...\n---\nHeadline two\nBody text...',
    hint: 'First line of each block is the headline, the rest is the body. Separate slides with a line containing only "---".',
  },
  {
    value: 'markdown-headings',
    label: 'Markdown headings (# Slide title)',
    placeholder: '# Headline one\nBody text...\n\n## Headline two\nBody text...',
    hint: 'Each line starting with #, ##, or ### begins a new slide. No "---" needed.',
  },
  {
    value: 'csv',
    label: 'CSV / spreadsheet paste (headline, body per line)',
    placeholder: 'Headline one, Body text...\nHeadline two, Body text...',
    hint: 'One slide per line: headline, then body, separated by the first comma or tab. A header row ("headline,body") is skipped automatically.',
  },
  {
    value: 'json',
    label: 'JSON array',
    placeholder: '[\n  { "headline": "Headline one", "body": "Body text..." },\n  { "headline": "Headline two", "body": "Body text..." }\n]',
    hint: 'An array of objects. Accepts headline/title and body/text/content as key names.',
  },
]

const MARKDOWN_HEADING_LINE = /^#{1,3}\s+/m

/** Each #, ##, or ### line starts a new slide; everything until the next heading is the body. */
function parseMarkdownHeadings(raw: string): ParsedSlide[] {
  const normalized = normalizeLineEndings(raw)
  if (!MARKDOWN_HEADING_LINE.test(normalized)) {
    throw new Error('No markdown headings found. Start each slide with a line like "# Headline".')
  }

  const lines = normalized.split('\n')
  const slides: ParsedSlide[] = []
  let currentHeadline: string | null = null
  let currentBody: string[] = []

  const flush = () => {
    if (currentHeadline === null) return
    const headline = currentHeadline.trim()
    const body = currentBody.join('\n').trim()
    if (headline) slides.push(finishSlide(headline, body))
  }

  for (const line of lines) {
    if (/^#{1,3}\s+/.test(line)) {
      flush()
      currentHeadline = stripHeadingMarker(line)
      currentBody = []
    } else if (currentHeadline !== null) {
      currentBody.push(line)
    }
    // Lines before the first heading are ignored.
  }
  flush()

  if (slides.length === 0) {
    throw new Error('No valid slides found under any heading.')
  }

  return slides
}

const CSV_HEADER_PATTERN = /^\s*"?headline"?\s*[,\t]\s*"?body"?\s*"?\s*$/i

function stripCsvQuotes(field: string): string {
  const trimmed = field.trim()
  if (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) {
    return trimmed.slice(1, -1).replace(/""/g, '"')
  }
  return trimmed
}

/** One slide per non-empty line: "headline, body" (or tab-separated). */
function parseCsv(raw: string): ParsedSlide[] {
  const normalized = normalizeLineEndings(raw)
  const lines = normalized.split('\n').filter((line) => line.trim() !== '')

  const slides: ParsedSlide[] = []
  for (const line of lines) {
    if (CSV_HEADER_PATTERN.test(line)) continue // skip an optional header row

    const delimiter = line.includes('\t') ? '\t' : ','
    const splitAt = line.indexOf(delimiter)
    const headlineRaw = splitAt === -1 ? line : line.slice(0, splitAt)
    const bodyRaw = splitAt === -1 ? '' : line.slice(splitAt + 1)

    const headline = stripCsvQuotes(headlineRaw)
    const body = stripCsvQuotes(bodyRaw)
    if (!headline) continue

    slides.push(finishSlide(headline, body))
  }

  if (slides.length === 0) {
    throw new Error('No valid rows found. Each line should be "headline, body".')
  }

  return slides
}

/** An array of objects; accepts headline/title and body/text/content as key names. */
function parseJson(raw: string): ParsedSlide[] {
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    throw new Error('Could not parse JSON — check for a trailing comma or unmatched bracket.')
  }

  if (!Array.isArray(data)) {
    throw new Error('Expected a JSON array of slide objects, e.g. [{ "headline": "...", "body": "..." }].')
  }

  const slides: ParsedSlide[] = []
  for (const item of data) {
    if (typeof item !== 'object' || item === null) continue
    const record = item as Record<string, unknown>
    const headlineValue = record.headline ?? record.title
    const bodyValue = record.body ?? record.text ?? record.content
    const headline = typeof headlineValue === 'string' ? headlineValue.trim() : ''
    const body = typeof bodyValue === 'string' ? bodyValue.trim() : ''
    if (!headline) continue
    slides.push(finishSlide(headline, body))
  }

  if (slides.length === 0) {
    throw new Error('No slide objects with a "headline" (or "title") field were found.')
  }

  return slides
}

/** Parses raw text using the selected import format. */
export function parseContentWithFormat(raw: string, format: ImportFormat): ParsedSlide[] {
  switch (format) {
    case 'markdown-headings':
      return parseMarkdownHeadings(raw)
    case 'csv':
      return parseCsv(raw)
    case 'json':
      return parseJson(raw)
    default:
      return parseContent(raw)
  }
}

export function parseFile(file: File, format: ImportFormat = 'standard'): Promise<ParsedSlide[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const text = typeof reader.result === 'string' ? reader.result : ''
        resolve(parseContentWithFormat(text, format))
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Failed to parse file'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}
