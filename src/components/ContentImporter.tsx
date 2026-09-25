import { useCallback, useMemo, useState } from 'react'
import type { ChangeEvent, DragEvent } from 'react'
import { useEditorStore } from '../store/useEditorStore'
import {
  countText,
  parseContent,
  parseFile,
  SLIDE_TAG_LABELS,
  templateIdForTag,
  type ParsedSlide,
} from '../lib/parseContent'
import { TEMPLATES, getTemplateLimits, templateSupportsBody } from '../lib/templates'
import { tighten } from '../lib/tighten'
import { MAX_SLIDES } from '../types'
import type { TextLimit } from '../types'
import type { ImportBlock } from '../store/useEditorStore'

interface ContentImporterProps {
  onClose: () => void
}

const TAG_BADGE_STYLE: Record<string, string> = {
  'question-hook': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
  list: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
  stat: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400',
  'cover-hook': 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
}

type CounterTier = 'ok' | 'warn' | 'over'

function counterTier(current: { words: number; chars: number }, limit: TextLimit): CounterTier {
  const pct = Math.max(current.words / limit.words, current.chars / limit.chars)
  if (pct > 1) return 'over'
  if (pct >= 0.9) return 'warn'
  return 'ok'
}

const COUNTER_TIER_STYLE: Record<CounterTier, string> = {
  ok: 'text-neutral-400 dark:text-neutral-500',
  warn: 'text-amber-600 dark:text-amber-400',
  over: 'text-red-600 dark:text-red-400',
}

interface FieldCheck {
  counts: { words: number; chars: number }
  tier: CounterTier
  isOver: boolean
}

function checkField(text: string, limit: TextLimit): FieldCheck {
  const counts = countText(text)
  const tier = counterTier(counts, limit)
  return { counts, tier, isOver: tier === 'over' }
}

export default function ContentImporter({ onClose }: ContentImporterProps) {
  const importSlides = useEditorStore((s) => s.importSlides)
  const setToast = useEditorStore((s) => s.setToast)

  const [rawText, setRawText] = useState('')
  const [parsed, setParsed] = useState<ParsedSlide[]>([])
  const [templateOverrides, setTemplateOverrides] = useState<Record<number, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [truncate, setTruncate] = useState(true)
  const [expandedTighten, setExpandedTighten] = useState<Record<string, boolean>>({})

  const overLimit = parsed.length > MAX_SLIDES

  const preview = useMemo(() => (truncate ? parsed.slice(0, MAX_SLIDES) : parsed), [parsed, truncate])

  const templateFor = (index: number, tag: ParsedSlide['tag']) => templateOverrides[index] ?? templateIdForTag(tag)

  // Per-slide length checks against the currently selected template's limits.
  // Recomputed at render time from `preview` + `templateOverrides` — nothing
  // is stored on the slide objects, so switching a slide's template updates
  // this without a re-parse.
  const slideChecks = useMemo(
    () =>
      preview.map((slide, i) => {
        const limits = getTemplateLimits(templateFor(i, slide.tag))
        const headline = checkField(slide.headline, limits.headline)
        const body = checkField(slide.body, limits.body)
        return { limits, headline, body, isOver: headline.isOver || body.isOver }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [preview, templateOverrides],
  )

  const overCount = slideChecks.filter((c) => c.isOver).length
  const summary = useMemo(() => {
    if (preview.length === 0) return null
    if (overCount === 0) {
      return { tone: 'green' as const, text: `${preview.length} slides parsed. All within recommended length.` }
    }
    const overRatio = overCount / preview.length
    if (overRatio > 0.5) {
      return {
        tone: 'red' as const,
        text: `${preview.length} slides parsed. ${overCount} are over the recommended length. Consider splitting long slides or picking a template with more room before importing.`,
      }
    }
    return {
      tone: 'amber' as const,
      text: `${preview.length} slides parsed. ${overCount} are over the recommended length for the selected template. They'll still import, but they may not read well on a phone.`,
    }
  }, [preview.length, overCount])

  const runParse = useCallback((text: string) => {
    setError(null)
    setTemplateOverrides({})
    if (!text.trim()) {
      setParsed([])
      return
    }
    try {
      setParsed(parseContent(text))
    } catch (err) {
      setParsed([])
      setError(err instanceof Error ? err.message : 'Could not parse content')
    }
  }, [])

  const handleTextareaChange = (value: string) => {
    setRawText(value)
    setFileName(null)
    runParse(value)
  }

  const handleFile = async (file: File) => {
    setFileName(file.name)
    setError(null)
    setTemplateOverrides({})
    try {
      const text = await file.text()
      setRawText(text)
      setParsed(parseFile ? await parseFile(file) : parseContent(text))
    } catch (err) {
      setParsed([])
      setError(err instanceof Error ? err.message : 'Could not read file')
    }
  }

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) void handleFile(file)
  }

  const onChooseFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) void handleFile(file)
    e.target.value = ''
  }

  const toggleTighten = (key: string) => {
    setExpandedTighten((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const applyTightened = (index: number, field: 'headline' | 'body', rewritten: string) => {
    setParsed((prev) => prev.map((slide, i) => (i === index ? { ...slide, [field]: rewritten } : slide)))
    setExpandedTighten((prev) => ({ ...prev, [`${index}:${field}`]: false }))
  }

  const commit = (mode: 'replace' | 'append') => {
    if (preview.length === 0) return
    const blocks: ImportBlock[] = preview.map((slide, i) => ({
      headline: slide.headline,
      body: slide.body,
      tag: slide.tag,
      templateId: templateFor(i, slide.tag),
    }))
    importSlides(blocks, mode)
    // The person may import straight from a hurried glance at the preview —
    // this closes the loop if any committed slide is over its template's limit.
    if (overCount > 0) {
      setToast(
        `${preview.length} slides imported. ${overCount} are over the recommended length — you can tighten them in the editor.`,
      )
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-soft dark:bg-neutral-900">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3 dark:border-neutral-800">
          <h2 className="text-sm font-semibold">Import content</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-center text-sm transition ${
              isDragging
                ? 'border-accent bg-accent/5 text-accent'
                : 'border-neutral-300 text-neutral-500 dark:border-neutral-700'
            }`}
          >
            <p>Drag & drop a .txt or .md file here</p>
            <label className="cursor-pointer rounded-md bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700">
              Choose file
              <input type="file" accept=".txt,.md,text/plain,text/markdown" className="hidden" onChange={onChooseFile} />
            </label>
            {fileName && <p className="text-xs text-neutral-400">Loaded: {fileName}</p>}
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-xs font-semibold text-neutral-500">Or paste content</label>
            <textarea
              value={rawText}
              onChange={(e) => handleTextareaChange(e.target.value)}
              placeholder={'Headline one\nBody text...\n---\nHeadline two\nBody text...'}
              rows={6}
              className="w-full resize-y rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-accent dark:border-neutral-700 dark:bg-neutral-950"
            />
          </div>

          <p className="mt-3 text-[11px] text-neutral-400">
            Smart Content Importer v2 auto-tags each slide (Question/Hook, List, Stat, Cover/Hook) and picks a
            matching cybersecurity template — override any slide's template below.
          </p>

          {error && (
            <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-950/40 dark:text-red-400">
              {error}
            </p>
          )}

          {overLimit && (
            <div className="mt-3 flex items-center justify-between rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
              <span>
                Found {parsed.length} slides — the carousel limit is {MAX_SLIDES}.
              </span>
              <label className="flex items-center gap-1.5 font-semibold">
                <input type="checkbox" checked={truncate} onChange={(e) => setTruncate(e.target.checked)} />
                Truncate to {MAX_SLIDES}
              </label>
            </div>
          )}

          {preview.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold text-neutral-500">
                Preview — {preview.length} slide{preview.length === 1 ? '' : 's'}
              </p>

              {summary && (
                <div
                  className={`mb-2 rounded-md px-3 py-2 text-xs ${
                    summary.tone === 'green'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                      : summary.tone === 'amber'
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                        : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                  }`}
                >
                  {summary.text}
                </div>
              )}

              <ul className="max-h-80 space-y-2 overflow-y-auto pr-1">
                {preview.map((slide, i) => {
                  const check = slideChecks[i]
                  const headlineKey = `${i}:headline`
                  const bodyKey = `${i}:body`
                  return (
                    <li
                      key={i}
                      className="rounded-lg border border-neutral-200 px-3 py-2 text-xs dark:border-neutral-800"
                    >
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[10px] font-bold text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="line-clamp-2 font-semibold text-neutral-800 dark:text-neutral-100">
                              {slide.headline}
                            </p>
                            {slide.tag !== 'none' && (
                              <span
                                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${TAG_BADGE_STYLE[slide.tag]}`}
                              >
                                {SLIDE_TAG_LABELS[slide.tag]}
                              </span>
                            )}
                          </div>
                          {slide.body && (
                            <p className="line-clamp-3 mt-1 whitespace-pre-wrap text-neutral-500">{slide.body}</p>
                          )}

                          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px]">
                            <span className={COUNTER_TIER_STYLE[check.headline.tier]}>
                              Headline: {check.headline.counts.words} / {check.limits.headline.words} words
                            </span>
                            <span className={COUNTER_TIER_STYLE[check.body.tier]}>
                              Body: {check.body.counts.words} / {check.limits.body.words} words
                            </span>
                          </div>

                          {(check.headline.isOver || check.body.isOver) && (
                            <div className="mt-1 space-y-1.5">
                              {check.headline.isOver && (
                                <TightenField
                                  label="Headline"
                                  text={slide.headline}
                                  limit={check.limits.headline}
                                  isExpanded={Boolean(expandedTighten[headlineKey])}
                                  onToggle={() => toggleTighten(headlineKey)}
                                  onUse={(rewritten) => applyTightened(i, 'headline', rewritten)}
                                />
                              )}
                              {check.body.isOver && (
                                <TightenField
                                  label="Body"
                                  text={slide.body}
                                  limit={check.limits.body}
                                  isExpanded={Boolean(expandedTighten[bodyKey])}
                                  onToggle={() => toggleTighten(bodyKey)}
                                  onUse={(rewritten) => applyTightened(i, 'body', rewritten)}
                                />
                              )}
                            </div>
                          )}

                          {slide.body && !templateSupportsBody(templateFor(i, slide.tag)) && (
                            <p className="mt-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                              This template has no body text area — the body above won't appear on import.
                            </p>
                          )}

                          <select
                            value={templateFor(i, slide.tag)}
                            onChange={(e) => setTemplateOverrides((prev) => ({ ...prev, [i]: e.target.value }))}
                            className="mt-2 w-full rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1 text-[11px] dark:border-neutral-700 dark:bg-neutral-950"
                          >
                            {TEMPLATES.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-neutral-200 px-5 py-3 dark:border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-xs font-semibold text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={preview.length === 0}
            onClick={() => commit('append')}
            className="rounded-md bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-200 disabled:opacity-40 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
          >
            Append to carousel
          </button>
          <button
            type="button"
            disabled={preview.length === 0}
            onClick={() => commit('replace')}
            className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-dark disabled:opacity-40"
          >
            Replace all slides
          </button>
        </div>
      </div>
    </div>
  )
}

interface TightenFieldProps {
  label: string
  text: string
  limit: TextLimit
  isExpanded: boolean
  onToggle: () => void
  onUse: (rewritten: string) => void
}

function TightenField({ label, text, limit, isExpanded, onToggle, onUse }: TightenFieldProps) {
  // Computed lazily (only while expanded) since it's not needed for the
  // collapsed link — cheap either way, but keeps the card render light.
  const rewritten = useMemo(() => (isExpanded ? tighten(text, limit) : null), [isExpanded, text, limit])

  if (!isExpanded) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className="text-[11px] font-semibold text-accent hover:underline"
      >
        Suggest shorter {label.toLowerCase()}
      </button>
    )
  }

  return (
    <div className="rounded-md border border-neutral-200 bg-neutral-50 p-2 dark:border-neutral-700 dark:bg-neutral-950">
      <p className="text-[10px] font-semibold uppercase text-neutral-400">Current</p>
      <p className="mb-1.5 whitespace-pre-wrap text-neutral-500">{text}</p>
      <p className="text-[10px] font-semibold uppercase text-neutral-400">Suggested</p>
      <p className="mb-2 whitespace-pre-wrap text-neutral-700 dark:text-neutral-200">{rewritten}</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => rewritten !== null && onUse(rewritten)}
          className="rounded-md bg-accent px-2 py-1 text-[11px] font-semibold text-white hover:bg-accent-dark"
        >
          Use this
        </button>
        <button
          type="button"
          onClick={onToggle}
          className="rounded-md px-2 py-1 text-[11px] font-semibold text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800"
        >
          Keep mine
        </button>
      </div>
    </div>
  )
}
