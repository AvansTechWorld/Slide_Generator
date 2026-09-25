import { useCallback, useMemo, useState } from 'react'
import { useEditorStore } from '../store/useEditorStore'
import { parseContent, parseFile, type ParsedSlide } from '../lib/parseContent'
import { TEMPLATES } from '../lib/templates'
import { MAX_SLIDES } from '../types'

interface ContentImporterProps {
  onClose: () => void
}

export default function ContentImporter({ onClose }: ContentImporterProps) {
  const importSlides = useEditorStore((s) => s.importSlides)

  const [rawText, setRawText] = useState('')
  const [templateId, setTemplateId] = useState(TEMPLATES[0].id)
  const [parsed, setParsed] = useState<ParsedSlide[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [truncate, setTruncate] = useState(true)

  const overLimit = parsed.length > MAX_SLIDES

  const preview = useMemo(() => (truncate ? parsed.slice(0, MAX_SLIDES) : parsed), [parsed, truncate])

  const runParse = useCallback((text: string) => {
    setError(null)
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
    try {
      const text = await file.text()
      setRawText(text)
      setParsed(parseFile ? await parseFile(file) : parseContent(text))
    } catch (err) {
      setParsed([])
      setError(err instanceof Error ? err.message : 'Could not read file')
    }
  }

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) void handleFile(file)
  }

  const onChooseFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) void handleFile(file)
    e.target.value = ''
  }

  const commit = (mode: 'replace' | 'append') => {
    if (preview.length === 0) return
    importSlides(preview, templateId, mode)
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

          <div className="mt-4">
            <label className="mb-1 block text-xs font-semibold text-neutral-500">Template to apply</label>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-accent dark:border-neutral-700 dark:bg-neutral-950"
            >
              {TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

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
              <ul className="max-h-48 space-y-2 overflow-y-auto pr-1">
                {preview.map((slide, i) => (
                  <li
                    key={i}
                    className="rounded-lg border border-neutral-200 px-3 py-2 text-xs dark:border-neutral-800"
                  >
                    <p className="font-semibold text-neutral-800 dark:text-neutral-100">
                      {i + 1}. {slide.headline}
                    </p>
                    {slide.body && (
                      <p className="mt-1 whitespace-pre-wrap text-neutral-500">{slide.body}</p>
                    )}
                  </li>
                ))}
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
