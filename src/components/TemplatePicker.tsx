import { TEMPLATES } from '../lib/templates'
import { useActiveSlide, useEditorStore } from '../store/useEditorStore'

export default function TemplatePicker({ onClose }: { onClose: () => void }) {
  const activeSlide = useActiveSlide()
  const applyTemplate = useEditorStore((s) => s.applyTemplate)

  const handlePick = (templateId: string) => {
    if (!activeSlide) return
    applyTemplate(activeSlide.id, templateId)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
      onClick={onClose}
    >
      <div
        className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-panel dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Choose a template</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-2 py-1 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            ✕
          </button>
        </div>
        <p className="mb-4 text-sm text-neutral-500">
          Applying a template replaces the current slide&apos;s background and elements.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => handlePick(template.id)}
              className="flex flex-col items-start gap-1 rounded-xl border border-neutral-200 p-3 text-left transition hover:border-accent hover:shadow-soft dark:border-neutral-700"
            >
              <div className="mb-1 flex h-16 w-full items-center justify-center rounded-lg bg-gradient-to-br from-neutral-800 to-neutral-500 text-[10px] font-semibold uppercase tracking-wide text-white">
                {template.name}
              </div>
              <span className="text-xs font-semibold">{template.name}</span>
              <span className="text-[11px] leading-tight text-neutral-500">{template.description}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
