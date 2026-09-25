import { useRef, useState } from 'react'
import { useActiveSlide, useEditorStore } from '../store/useEditorStore'
import { ASPECT_RATIOS, AUDIO_CATEGORY_PRESETS } from '../types'
import { exportAllSlidesZip, exportSingleSlide } from '../lib/export'
import { exportSlidesAsPdf } from '../lib/pdfExport'
import { runReserveSafetyCheck } from '../lib/reserveSafetyCheck'
import SafetyCheckModal from './SafetyCheckModal'

type PendingAction = 'zip' | 'pdf' | null

export default function ExportButton() {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const activeSlide = useActiveSlide()
  const slides = useEditorStore((s) => s.slides)
  const aspectRatio = useEditorStore((s) => s.aspectRatio)
  const brandKit = useEditorStore((s) => s.brandKit)
  const caption = useEditorStore((s) => s.caption)
  const suggestedAudio = useEditorStore((s) => s.suggestedAudio)
  const setSuggestedAudio = useEditorStore((s) => s.setSuggestedAudio)
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

  const runZipExport = async () => {
    setBusy(true)
    try {
      await exportAllSlidesZip(
        slides,
        size,
        brandKit,
        2,
        (done, total) => setProgress(`Rendering ${done}/${total}…`),
        { caption, suggestedAudio },
      )
    } finally {
      setBusy(false)
      setProgress(null)
      setOpen(false)
    }
  }

  const runPdfExport = async () => {
    setBusy(true)
    try {
      await exportSlidesAsPdf(slides, size, brandKit, 2, (done, total) => setProgress(`Rendering ${done}/${total}…`))
    } finally {
      setBusy(false)
      setProgress(null)
      setOpen(false)
    }
  }

  const requestExportAll = (action: 'zip' | 'pdf') => {
    const findings = runReserveSafetyCheck(slides)
    if (findings.length === 0) {
      void (action === 'zip' ? runZipExport() : runPdfExport())
      return
    }
    setPendingAction(action)
    setOpen(false)
  }

  const safetyFindings = pendingAction ? runReserveSafetyCheck(slides) : []

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
        <div className="absolute right-0 top-full z-40 mt-1 w-64 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-panel dark:border-neutral-700 dark:bg-neutral-800">
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
            onClick={() => requestExportAll('zip')}
            className="block w-full px-3.5 py-2.5 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700"
          >
            Export all slides (ZIP, 2x + caption + readme)
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => requestExportAll('pdf')}
            className="block w-full px-3.5 py-2.5 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700"
          >
            Export as PDF (for review/QA)
          </button>
          <div className="border-t border-neutral-200 px-3.5 py-2.5 dark:border-neutral-700">
            <label className="mb-1 block text-[11px] font-semibold text-neutral-500">Suggested audio track</label>
            <input
              list="audio-presets"
              value={suggestedAudio}
              onChange={(e) => setSuggestedAudio(e.target.value)}
              onMouseDown={(e) => e.stopPropagation()}
              placeholder="e.g. Dark synth"
              className="w-full rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-950"
            />
            <datalist id="audio-presets">
              {AUDIO_CATEGORY_PRESETS.map((preset) => (
                <option key={preset} value={preset} />
              ))}
            </datalist>
          </div>
        </div>
      )}

      {pendingAction && (
        <SafetyCheckModal
          findings={safetyFindings}
          onCancel={() => setPendingAction(null)}
          onContinue={() => {
            const action = pendingAction
            setPendingAction(null)
            void (action === 'zip' ? runZipExport() : runPdfExport())
          }}
        />
      )}
    </div>
  )
}
