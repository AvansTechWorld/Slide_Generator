import { useRef, useState } from 'react'
import { useActiveSlide, useEditorStore } from '../store/useEditorStore'
import { ASPECT_RATIOS } from '../types'
import { exportAllSlidesZip, exportSingleSlide } from '../lib/export'

export default function ExportButton() {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const activeSlide = useActiveSlide()
  const slides = useEditorStore((s) => s.slides)
  const aspectRatio = useEditorStore((s) => s.aspectRatio)
  const brandKit = useEditorStore((s) => s.brandKit)
  const size = ASPECT_RATIOS[aspectRatio]

  const closeOnBlur = () => {
    window.setTimeout(() => setOpen(false), 120)
  }

  const handleExportCurrent = async () => {
    if (!activeSlide) return
    const index = slides.findIndex((s) => s.id === activeSlide.id)
    setBusy(true)
    setProgress('Rendering slide…')
    try {
      await exportSingleSlide(activeSlide, index, size, brandKit, 2)
    } finally {
      setBusy(false)
      setProgress(null)
      setOpen(false)
    }
  }

  const handleExportAll = async () => {
    setBusy(true)
    try {
      await exportAllSlidesZip(slides, size, brandKit, 2, (done, total) => {
        setProgress(`Rendering ${done}/${total}…`)
      })
    } finally {
      setBusy(false)
      setProgress(null)
      setOpen(false)
    }
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={closeOnBlur}
        disabled={busy}
        className="flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accent-dark disabled:opacity-60"
      >
        {busy ? (progress ?? 'Exporting…') : 'Export'}
        {!busy && <span className="text-xs">▾</span>}
      </button>
      {open && !busy && (
        <div className="absolute right-0 top-full z-40 mt-1 w-56 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-panel dark:border-neutral-700 dark:bg-neutral-800">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleExportCurrent}
            className="block w-full px-3.5 py-2.5 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700"
          >
            Export current slide (PNG, 2x)
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleExportAll}
            className="block w-full px-3.5 py-2.5 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700"
          >
            Export all slides (ZIP, 2x)
          </button>
        </div>
      )}
    </div>
  )
}
