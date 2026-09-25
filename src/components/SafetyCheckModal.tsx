import type { SafetyFinding } from '../lib/reserveSafetyCheck'

interface SafetyCheckModalProps {
  findings: SafetyFinding[]
  onCancel: () => void
  onContinue: () => void
}

export default function SafetyCheckModal({ findings, onCancel, onContinue }: SafetyCheckModalProps) {
  const allClear = findings.length === 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-panel dark:bg-neutral-900">
        <h2 className="text-sm font-semibold">Re-serve safety check</h2>
        <p className="mt-1 text-xs text-neutral-500">
          Instagram can resurface this carousel starting from slide 2 onward. All slides standalone?
        </p>

        {allClear ? (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
            ✓ Yes — every slide after slide 1 has a headline and stands on its own.
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
              ✕ No — {findings.length} slide{findings.length === 1 ? '' : 's'} may confuse someone who lands here first:
            </p>
            <ul className="max-h-40 space-y-1.5 overflow-y-auto">
              {findings.map((f) => (
                <li
                  key={f.slideId}
                  className="rounded-md bg-amber-50 px-2.5 py-1.5 text-xs text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                >
                  Slide {f.slideIndex + 1} ({f.label}) —{' '}
                  {f.reason === 'no-headline' ? 'no headline set' : 'near-empty content'}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md px-3 py-1.5 text-xs font-semibold text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            Go back and fix
          </button>
          <button
            type="button"
            onClick={onContinue}
            className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-dark"
          >
            Export anyway
          </button>
        </div>
      </div>
    </div>
  )
}
