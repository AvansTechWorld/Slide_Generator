import { ICONS } from '../lib/icons'
import { useEditorStore } from '../store/useEditorStore'

export default function IconLibraryPanel({ onClose }: { onClose: () => void }) {
  const addIconElementToSlide = useEditorStore((s) => s.addIconElementToSlide)

  const handlePick = (iconId: string) => {
    addIconElementToSlide(iconId)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6" onClick={onClose}>
      <div
        className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-panel dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Icon library</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-2 py-1 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            ✕
          </button>
        </div>
        <p className="mb-3 text-xs text-neutral-500">Click an icon to add it to the current slide, then drag/resize and recolor it in the properties panel.</p>
        <div className="grid grid-cols-6 gap-2">
          {ICONS.map((icon) => (
            <button
              key={icon.id}
              type="button"
              title={icon.label}
              onClick={() => handlePick(icon.id)}
              className="flex h-12 w-12 flex-col items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 transition hover:border-accent hover:text-accent dark:border-neutral-700 dark:text-neutral-300"
              dangerouslySetInnerHTML={{
                __html: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${icon.svg}</svg>`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
