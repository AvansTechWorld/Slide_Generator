import { useCallback, useMemo, useState } from 'react'
import type { ChangeEvent, CSSProperties, DragEvent } from 'react'
import { useEditorStore } from '../store/useEditorStore'
import {
  countText,
  IMPORT_FORMAT_OPTIONS,
  parseContentWithFormat,
  parseFile,
  SLIDE_TAG_LABELS,
  templateIdForTag,
  type ImportFormat,
  type ParsedSlide,
  type TextCount,
} from '../lib/parseContent'
import { TEMPLATES, getTemplateLimits } from '../lib/templates'
import { tighten } from '../lib/tighten'
import { MAX_SLIDES } from '../types'
import type { TemplateFieldLimit, TemplateLimits } from '../types'
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

type LimitState = 'ok' | 'warn' | 'over'

function limitStatus(count: TextCount, limit: TemplateFieldLimit): LimitState {
  const ratio = Math.max(count.words / limit.words, count.chars / limit.chars)
  if (ratio > 1) return 'over'
  if (ratio >= 0.9) return 'warn'
  return 'ok'
}

const STATUS_TEXT_CLASS: Record<LimitState, string> = {
  ok: 'text-neutral-400 dark:text-neutral-500',
  warn: 'text-amber-600 dark:text-amber-400',
  over: 'text-red-600 dark:text-red-400',
}

function CounterBadge({ label, count, limit }: { label: string; count: TextCount; limit: TemplateFieldLimit }) {
  const status = limitStatus(count, limit)
  return (
    <span
      title={`${count.chars} / ${limit.chars} chars`}
      className={`text-[11px] font-semibold ${STATUS_TEXT_CLASS[status]}`}
    >
      {label}: {count.words} / {limit.words} words
    </span>
  )
}

const clampStyle = (lines: number): CSSProperties => ({
  display: '-webkit-box',
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: lines,
  overflow: 'hidden',
})

interface FieldTightenState {
  expanded: boolean
  suggestion: string
}

export default function ContentImporter({ onClose }: ContentImporterProps) {
  const importSlides = useEditorStore((s) => s.importSlides)
  const showToast = useEditorStore((s) => s.showToast)

  const [rawText, setRawText] = useState('')
  const [format, setFormat] = useState<ImportFormat>('standard')
  const [parsed, setParsed] = useState<ParsedSlide[]>([])
  const [templateOverrides, setTemplateOverrides] = useState<Record<number, string>>({})
  const [textOverrides, setTextOverrides] = useState<Record<number, { headline?: string; body?: string }>>({})
  const [tightenState, setTightenState] = useState<Record<string, FieldTightenState>>({})
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [truncate, setTruncate] = useState(true)

  const overSlideLimit = parsed.length > MAX_SLIDES

  const preview = useMemo(() => (truncate ? parsed.slice(0, MAX_SLIDES) : parsed), [parsed, truncate])

  const resetDerivedState = () => {
    setTemplateOverrides({})
    setTextOverrides({})
    setTightenState({})
  }

  const runParse = useCallback((text: string, fmt: ImportFormat) => {
    setError(null)
    resetDerivedState()
    if (!text.trim()) {
      setParsed([])
      return
    }
    try {
      setParsed(parseContentWithFormat(text, fmt))
    } catch (err) {
      setParsed([])
      setError(err instanceof Error ? err.message : 'Could not parse content')
    }
  }, [])

  const handleTextareaChange = (value: string) => {
    setRawText(value)
    setFileName(null)
    runParse(value, format)
  }

  const handleFormatChange = (nextFormat: ImportFormat) => {
    setFormat(nextFormat)
    if (rawText.trim()) runParse(rawText, nextFormat)
  }

  const handleFile = async (file: File) => {
    setFileName(file.name)
    setError(null)
    resetDerivedState()
    try {
      const text = await file.text()
      setRawText(text)
      setParsed(await parseFile(file, format))
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

  const templateFor = (index: number, tag: ParsedSlide['tag']) => templateOverrides[index] ?? templateIdForTag(tag)
  const limitsFor = (index: number, tag: ParsedSlide['tag']): TemplateLimits => getTemplateLimits(templateFor(index, tag))
  const headlineFor = (index: number, slide: ParsedSlide) => textOverrides[index]?.headline ?? slide.headline
  const bodyFor = (index: number, slide: ParsedSlide) => textOverrides[index]?.body ?? slide.body

  // Per-slide "is this slide over its assigned template's limits" flag,
  // computed from the *current* headline/body (tightened or original) and
  // the *current* template selection — recomputes live, no re-parse.
  const slideOverFlags = useMemo(
    () =>
      preview.map((slide, i) => {
        const limits = limitsFor(i, slide.tag)
        const headlineCount = countText(headlineFor(i, slide))
        const bodyCount = countText(bodyFor(i, slide))
        return limitStatus(headlineCount, limits.headline) === 'over' || limitStatus(bodyCount, limits.body) === 'over'
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [preview, templateOverrides, textOverrides],
  )

  const overCount = slideOverFlags.filter(Boolean).length
  const overFraction = preview.length > 0 ? overCount / preview.length : 0

  const bannerTone: 'green' | 'amber' | 'red' | null =
    preview.length === 0 ? null : overCount === 0 ? 'green' : overFraction > 0.5 ? 'red' : 'amber'

  const bannerClass: Record<'green' | 'amber' | 'red', string> = {
    green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
    red: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400',
  }

  const bannerMessage = () => {
    if (!bannerTone) return null
    if (bannerTone === 'green') return `${preview.length} slides parsed. All within recommended length.`
    if (bannerTone === 'amber') {
      return `${preview.length} slides parsed. ${overCount} are over the recommended length for their assigned template. They'll still import, but they may not read well on a phone.`
    }
    return `${preview.length} slides parsed. ${overCount} are over the recommended length. Consider splitting long slides or picking a template with more room before importing.`
  }

  const toggleTighten = (index: number, field: 'headline' | 'body', slide: ParsedSlide, limit: TemplateFieldLimit) => {
    const key = `${index}-${field}`
    setTightenState((prev) => {
      const current = prev[key]
      if (current?.expanded) {
        return { ...prev, [key]: { ...current, expanded: false } }
      }
      const original = field === 'headline' ? headlineFor(index, slide) : bodyFor(index, slide)
      return { ...prev, [key]: { expanded: true, suggestion: tighten(original, limit) } }
    })
  }

  const acceptTighten = (index: number, field: 'headline' | 'body', suggestion: string) => {
    setTextOverrides((prev) => ({ ...prev, [index]: { ...prev[index], [field]: suggestion } }))
    setTightenState((prev) => ({ ...prev, [`${index}-${field}`]: { expanded: false, suggestion: '' } }))
  }

  const dismissTighten = (index: number, field: 'headline' | 'body') => {
    setTightenState((prev) => ({ ...prev, [`${index}-${field}`]: { expanded: false, suggestion: '' } }))
  }

  const commit = (mode: 'replace' | 'append') => {
    if (preview.length === 0) return
    const blocks: ImportBlock[] = preview.map((slide, i) => ({
      headline: headlineFor(i, slide),
      body: bodyFor(i, slide),
      tag: slide.tag,
      templateId: templateFor(i, slide.tag),
    }))
    const committedOverCount = overCount
    importSlides(blocks, mode)
    onClose()
    if (committedOverCount > 0) {
      showToast(
        `${blocks.length} slide${blocks.length === 1 ? '' : 's'} imported. ${committedOverCount} ${committedOverCount === 1 ? 'is' : 'are'} over the recommended length — you can tighten them in the editor.`,
      )
    }
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
          <div className="mb-3">
            <label className="mb-1 block text-xs font-semibold text-neutral-500">Import format</label>
            <select
              value={format}
              onChange={(e) => handleFormatChange(e.target.value as ImportFormat)}
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-accent dark:border-neutral-700 dark:bg-neutral-950"
            >
              {IMPORT_FORMAT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-neutral-400">
              {IMPORT_FORMAT_OPTIONS.find((o) => o.value === format)?.hint}
            </p>
          </div>

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
            <p>Drag & drop a .txt, .md, .csv, or .json file here</p>
            <label className="cursor-pointer rounded-md bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700">
              Choose file
              <input
                type="file"
                accept=".txt,.md,.csv,.json,text/plain,text/markdown,text/csv,application/json"
                className="hidden"
                onChange={onChooseFile}
              />
            </label>
            {fileName && <p className="text-xs text-neutral-400">Loaded: {fileName}</p>}
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-xs font-semibold text-neutral-500">Or paste content</label>
            <textarea
              value={rawText}
              onChange={(e) => handleTextareaChange(e.target.value)}
              placeholder={IMPORT_FORMAT_OPTIONS.find((o) => o.value === format)?.placeholder}
              rows={6}
              className="w-full resize-y rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-accent dark:border-neutral-700 dark:bg-neutral-950"
            />
          </div>

          <p className="mt-3 text-[11px] text-neutral-400">
            Smart Content Importer v2 auto-tags each slide (Question/Hook, List, Stat, Cover/Hook), picks a matching
            cybersecurity template, and checks headline/body length against that template's recommended limits.
            Override any slide's template below — the counters update instantly.
          </p>

          {error && (
            <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-950/40 dark:text-red-400">
              {error}
            </p>
          )}

          {overSlideLimit && (
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

          {bannerTone && (
            <div className={`mt-3 rounded-md px-3 py-2 text-xs font-medium ${bannerClass[bannerTone]}`}>
              {bannerMessage()}
            </div>
          )}

          {preview.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold text-neutral-500">
                Preview — {preview.length} slide{preview.length === 1 ? '' : 's'}
              </p>
              <ul className="max-h-72 space-y-2 overflow-y-auto pr-1">
                {preview.map((slide, i) => {
                  const limits = limitsFor(i, slide.tag)
                  const headline = headlineFor(i, slide)
                  const body = bodyFor(i, slide)
                  const headlineCount = countText(headline)
                  const bodyCount = countText(body)
                  const headlineOver = limitStatus(headlineCount, limits.headline) === 'over'
                  const bodyOver = limitStatus(bodyCount, limits.body) === 'over'
                  const headlineTighten = tightenState[`${i}-headline`]
                  const bodyTighten = tightenState[`${i}-body`]

                  return (
                    <li key={i} className="rounded-lg border border-neutral-200 px-3 py-2 text-xs dark:border-neutral-800">
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 shrink-0 rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-bold text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              style={clampStyle(2)}
                              className="font-semibold text-neutral-800 dark:text-neutral-100"
                            >
                              {headline}
                            </p>
                            {slide.tag !== 'none' && (
                              <span
                                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${TAG_BADGE_STYLE[slide.tag]}`}
                              >
                                {SLIDE_TAG_LABELS[slide.tag]}
                              </span>
                            )}
                          </div>
                          {body && (
                            <p style={clampStyle(3)} className="mt-1 whitespace-pre-wrap text-neutral-500">
                              {body}
                            </p>
                          )}

                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                            <CounterBadge label="Headline" count={headlineCount} limit={limits.headline} />
                            <CounterBadge label="Body" count={bodyCount} limit={limits.body} />
                          </div>

                          {headlineOver && (
                            <div className="mt-1">
                              <button
                                type="button"
                                onClick={() => toggleTighten(i, 'headline', slide, limits.headline)}
                                className="text-[11px] font-semibold text-accent hover:underline"
                              >
                                {headlineTighten?.expanded ? 'Hide suggestion' : 'Suggest shorter headline'}
                              </button>
                              {headlineTighten?.expanded && (
                                <div className="mt-1.5 rounded-md bg-neutral-50 p-2 dark:bg-neutral-950">
                                  <p className="text-[11px] text-neutral-500 line-through">{headline}</p>
                                  <p className="mt-0.5 text-[11px] font-medium text-neutral-800 dark:text-neutral-100">
                                    {headlineTighten.suggestion}
                                  </p>
                                  <div className="mt-1.5 flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => acceptTighten(i, 'headline', headlineTighten.suggestion)}
                                      className="rounded-md bg-accent px-2 py-1 text-[10px] font-semibold text-white hover:bg-accent-dark"
                                    >
                                      Use this
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => dismissTighten(i, 'headline')}
                                      className="rounded-md border border-neutral-300 px-2 py-1 text-[10px] font-semibold text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                                    >
                                      Keep mine
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {bodyOver && (
                            <div className="mt-1">
                              <button
                                type="button"
                                onClick={() => toggleTighten(i, 'body', slide, limits.body)}
                                className="text-[11px] font-semibold text-accent hover:underline"
                              >
                                {bodyTighten?.expanded ? 'Hide suggestion' : 'Suggest shorter version'}
                              </button>
                              {bodyTighten?.expanded && (
                                <div className="mt-1.5 rounded-md bg-neutral-50 p-2 dark:bg-neutral-950">
                                  <p className="whitespace-pre-wrap text-[11px] text-neutral-500 line-through">{body}</p>
                                  <p className="mt-0.5 whitespace-pre-wrap text-[11px] font-medium text-neutral-800 dark:text-neutral-100">
                                    {bodyTighten.suggestion}
                                  </p>
                                  <div className="mt-1.5 flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => acceptTighten(i, 'body', bodyTighten.suggestion)}
                                      className="rounded-md bg-accent px-2 py-1 text-[10px] font-semibold text-white hover:bg-accent-dark"
                                    >
                                      Use this
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => dismissTighten(i, 'body')}
                                      className="rounded-md border border-neutral-300 px-2 py-1 text-[10px] font-semibold text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                                    >
                                      Keep mine
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
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
