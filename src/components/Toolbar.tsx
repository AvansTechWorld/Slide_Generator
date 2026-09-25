import { useState } from 'react'
import { useEditorStore } from '../store/useEditorStore'
import type { AspectRatioKey } from '../types'
import ExportButton from './ExportButton'
import TemplatePicker from './TemplatePicker'
import ContentImporter from './ContentImporter'

const ASPECT_OPTIONS: { key: AspectRatioKey; label: string }[] = [
  { key: '4:5', label: '4:5' },
  { key: '1:1', label: '1:1' },
  { key: '9:16', label: '9:16' },
]

export default function Toolbar() {
  const aspectRatio = useEditorStore((s) => s.aspectRatio)
  const setAspectRatio = useEditorStore((s) => s.setAspectRatio)
  const showSafeZone = useEditorStore((s) => s.showSafeZone)
  const toggleSafeZone = useEditorStore((s) => s.toggleSafeZone)
  const theme = useEditorStore((s) => s.theme)
  const toggleTheme = useEditorStore((s) => s.toggleTheme)
  const undo = useEditorStore((s) => s.undo)
  const redo = useEditorStore((s) => s.redo)
  const canUndo = useEditorStore((s) => s.past.length > 0)
  const canRedo = useEditorStore((s) => s.future.length > 0)
  const isSaved = useEditorStore((s) => s.isSaved)
  const addTextElement = useEditorStore((s) => s.addTextElement)
  const addImageElement = useEditorStore((s) => s.addImageElement)

  const [showTemplates, setShowTemplates] = useState(false)
  const [showImporter, setShowImporter] = useState(false)

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="flex items-center gap-4">
        <span className="font-display text-base font-bold tracking-tight">
          Carousel<span className="text-accent">.</span>
        </span>

        <div className="flex items-center gap-1 rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800">
          {ASPECT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setAspectRatio(opt.key)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                aspectRatio === opt.key
                  ? 'bg-white text-accent shadow-soft dark:bg-neutral-700 dark:text-accent-light'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={toggleSafeZone}
          className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
            showSafeZone
              ? 'bg-accent/10 text-accent'
              : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          Safe zone
        </button>

        <button
          type="button"
          onClick={() => setShowTemplates(true)}
          className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          Templates
        </button>

        <button
          type="button"
          onClick={() => setShowImporter(true)}
          className="rounded-md bg-accent/10 px-2.5 py-1.5 text-xs font-semibold text-accent hover:bg-accent/20"
        >
          Import content
        </button>

        <div className="mx-1 h-5 w-px bg-neutral-200 dark:bg-neutral-800" />

        <button
          type="button"
          onClick={() => addTextElement('body')}
          className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          + Text
        </button>
        <button
          type="button"
          onClick={addImageElement}
          className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          + Image
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span className="mr-1 text-xs text-neutral-400 transition-opacity">
          {isSaved ? 'Saved' : 'Saving…'}
        </span>

        <button
          type="button"
          onClick={undo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className="rounded-md px-2 py-1.5 text-sm text-neutral-500 hover:bg-neutral-100 disabled:opacity-30 dark:hover:bg-neutral-800"
        >
          ↺
        </button>
        <button
          type="button"
          onClick={redo}
          disabled={!canRedo}
          title="Redo (Ctrl+Shift+Z)"
          className="rounded-md px-2 py-1.5 text-sm text-neutral-500 hover:bg-neutral-100 disabled:opacity-30 dark:hover:bg-neutral-800"
        >
          ↻
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          title="Toggle theme"
          className="rounded-md px-2 py-1.5 text-sm text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>

        <ExportButton />
      </div>

      {showTemplates && <TemplatePicker onClose={() => setShowTemplates(false)} />}
      {showImporter && <ContentImporter onClose={() => setShowImporter(false)} />}
    </header>
  )
}
