const SHORTCUTS: { keys: string; description: string }[] = [
  { keys: 'Ctrl/Cmd + Z', description: 'Undo' },
  { keys: 'Ctrl/Cmd + Shift + Z', description: 'Redo' },
  { keys: 'Ctrl/Cmd + D', description: 'Duplicate active slide' },
  { keys: 'Delete / Backspace', description: 'Remove selected element (or slide if none selected)' },
  { keys: 'Ctrl/Cmd + E', description: 'Export current slide' },
  { keys: 'Ctrl/Cmd + Shift + E', description: 'Export all slides' },
  { keys: 'Arrow keys', description: 'Nudge selected element by 1px (Shift = 10px)' },
  { keys: '?', description: 'Open this shortcuts panel' },
]

export default function KeyboardShortcutsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-xl bg-white p-5 shadow-panel dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Keyboard shortcuts</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            ✕
          </button>
        </div>
        <ul className="space-y-2">
          {SHORTCUTS.map((s) => (
            <li key={s.keys} className="flex items-center justify-between gap-3 text-xs">
              <span className="text-neutral-500">{s.description}</span>
              <kbd className="shrink-0 rounded-md border border-neutral-300 bg-neutral-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-neutral-700 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200">
                {s.keys}
              </kbd>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
