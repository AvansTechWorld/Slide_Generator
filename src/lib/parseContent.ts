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

const HEADING_PREFIX = /^#{1,3}\s+/

function stripHeadingMarker(line: string): string {
  return line.replace(HEADING_PREFIX, '').trim()
}

function normalizeLineEndings(raw: string): string {
  return raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
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

  return { headline, body, tag: detectSlideTag(headline, body) }
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

export function parseFile(file: File): Promise<ParsedSlide[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const text = typeof reader.result === 'string' ? reader.result : ''
        resolve(parseContent(text))
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Failed to parse file'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}
