import type { InlineMarkKind, InlineRun, RichBlock, RichBlockKind } from '../types'

// ---------- Inline parsing: **bold** and `code` ----------

const INLINE_TOKEN = /(\*\*.+?\*\*|\*.+?\*|`.+?`)/g

/**
 * Parses a single line of text into inline runs, detecting **bold**,
 * *italic*, and `inline code` spans. Everything else is 'plain'.
 */
export function parseInline(line: string): InlineRun[] {
  if (!line) return [{ text: '', mark: 'plain' }]
  const parts = line.split(INLINE_TOKEN).filter((p) => p.length > 0)
  const runs: InlineRun[] = []
  for (const part of parts) {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      runs.push({ text: part.slice(2, -2), mark: 'bold' })
    } else if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      runs.push({ text: part.slice(1, -1), mark: 'code' })
    } else if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      runs.push({ text: part.slice(1, -1), mark: 'italic' })
    } else {
      runs.push({ text: part, mark: 'plain' })
    }
  }
  return runs.length > 0 ? runs : [{ text: '', mark: 'plain' }]
}

/** Reassembles inline runs back into raw markdown-lite text. */
export function serializeInline(runs: InlineRun[]): string {
  return runs
    .map((r) => {
      if (r.mark === 'bold') return `**${r.text}**`
      if (r.mark === 'italic') return `*${r.text}*`
      if (r.mark === 'code') return `\`${r.text}\``
      return r.text
    })
    .join('')
}

const BULLET_PREFIX = /^(?:-|•)\s+/
const NUMBERED_PREFIX = /^\d+\.\s+/

function lineBlockKind(line: string): RichBlockKind {
  if (BULLET_PREFIX.test(line)) return 'bullet-list'
  if (NUMBERED_PREFIX.test(line)) return 'numbered-list'
  return 'paragraph'
}

function stripListPrefix(line: string, kind: RichBlockKind): string {
  if (kind === 'bullet-list') return line.replace(BULLET_PREFIX, '')
  if (kind === 'numbered-list') return line.replace(NUMBERED_PREFIX, '')
  return line
}

/**
 * Parses raw body text (with line breaks) into structured rich blocks:
 * paragraphs, bullet lists, and numbered lists. Consecutive lines of the
 * same list type are grouped into one block (one entry in `items` per
 * list item); consecutive plain lines are grouped into one paragraph
 * block with one item per line.
 */
export function parseRichText(raw: string): RichBlock[] {
  const lines = raw.split('\n')
  const blocks: RichBlock[] = []

  for (const rawLine of lines) {
    const kind = lineBlockKind(rawLine)
    const content = stripListPrefix(rawLine, kind)
    const runs = parseInline(content)

    const last = blocks[blocks.length - 1]
    if (last && last.kind === kind) {
      last.items.push(runs)
    } else {
      blocks.push({ kind, items: [runs] })
    }
  }

  return blocks.length > 0 ? blocks : [{ kind: 'paragraph', items: [[{ text: '', mark: 'plain' }]] }]
}

/** Reassembles rich blocks back into raw text (for persistence / editing). */
export function serializeRichText(blocks: RichBlock[]): string {
  const lines: string[] = []
  for (const block of blocks) {
    block.items.forEach((runs, i) => {
      const text = serializeInline(runs)
      if (block.kind === 'bullet-list') lines.push(`- ${text}`)
      else if (block.kind === 'numbered-list') lines.push(`${i + 1}. ${text}`)
      else lines.push(text)
    })
  }
  return lines.join('\n')
}

/** Toggles a mark on a plain-text selection substring within `content`. */
export function toggleInlineMark(content: string, selStart: number, selEnd: number, mark: InlineMarkKind): string {
  if (selStart >= selEnd) return content
  const before = content.slice(0, selStart)
  const selected = content.slice(selStart, selEnd)
  const after = content.slice(selEnd)
  const wrapper = mark === 'bold' ? '**' : mark === 'italic' ? '*' : mark === 'code' ? '`' : ''
  if (!wrapper) return content

  const alreadyWrapped = selected.startsWith(wrapper) && selected.endsWith(wrapper) && selected.length >= wrapper.length * 2
  const nextSelected = alreadyWrapped ? selected.slice(wrapper.length, -wrapper.length) : `${wrapper}${selected}${wrapper}`
  return `${before}${nextSelected}${after}`
}

/** Toggles bullet/numbered list prefix on every line of a selection. */
export function toggleListPrefix(content: string, selStart: number, selEnd: number, kind: 'bullet-list' | 'numbered-list'): string {
  const lineStart = content.lastIndexOf('\n', Math.max(0, selStart - 1)) + 1
  const nextBreak = content.indexOf('\n', selEnd)
  const lineEnd = nextBreak === -1 ? content.length : nextBreak

  const before = content.slice(0, lineStart)
  const target = content.slice(lineStart, lineEnd)
  const after = content.slice(lineEnd)

  const targetLines = target.split('\n')
  const prefix = kind === 'bullet-list' ? '- ' : '1. '
  const testPrefix = kind === 'bullet-list' ? BULLET_PREFIX : NUMBERED_PREFIX
  const allPrefixed = targetLines.every((l) => testPrefix.test(l) || l.trim() === '')

  const nextLines = targetLines.map((l, i) => {
    if (l.trim() === '') return l
    if (allPrefixed) return stripListPrefix(l, kind)
    const clean = stripListPrefix(l, lineBlockKind(l))
    return kind === 'numbered-list' ? `${i + 1}. ${clean}` : `${prefix}${clean}`
  })

  return `${before}${nextLines.join('\n')}${after}`
}
