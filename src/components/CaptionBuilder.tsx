import { useMemo } from 'react'
import { useActiveSlide, useEditorStore } from '../store/useEditorStore'
import { CAPTION_CHAR_LIMIT } from '../types'
import { suggestHashtags } from '../lib/hashtags'
import { buildCaptionText } from '../lib/export'

export default function CaptionBuilder({ onClose }: { onClose: () => void }) {
  const caption = useEditorStore((s) => s.caption)
  const updateCaption = useEditorStore((s) => s.updateCaption)
  const slides = useEditorStore((s) => s.slides)
  const activeSlide = useActiveSlide()

  const fullText = buildCaptionText(caption)
  const charCount = fullText.length
  const overLimit = charCount > CAPTION_CHAR_LIMIT

  const contentForSuggestions = useMemo(() => {
    const source = activeSlide ?? slides[0]
    if (!source) return ''
    return source.elements
      .filter((el) => el.kind === 'text')
      .map((el) => (el as { content: string }).content)
      .join(' ')
  }, [activeSlide, slides])

  const suggestions = useMemo(() => suggestHashtags(contentForSuggestions), [contentForSuggestions])

  const toggleHashtag = (tag: string) => {
    const has = caption.hashtags.includes(tag)
    updateCaption({ hashtags: has ? caption.hashtags.filter((t) => t !== tag) : [...caption.hashtags, tag] })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-soft dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3 dark:border-neutral-800">
          <h2 className="text-sm font-semibold">Caption + hashtags</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-500">
            Hook line
            <input
              value={caption.hook}
              onChange={(e) => updateCaption({ hook: e.target.value })}
              placeholder="Stop scrolling — this one's important."
              className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-500">
            Body paragraph
            <textarea
              value={caption.body}
              onChange={(e) => updateCaption({ body: e.target.value })}
              rows={4}
              placeholder="A short paragraph expanding on the carousel..."
              className="resize-none rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-500">
            CTA question
            <input
              value={caption.cta}
              onChange={(e) => updateCaption({ cta: e.target.value })}
              placeholder="Which of these have you already turned on?"
              className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
            />
          </label>

          <div>
            <p className="mb-1 text-xs font-semibold text-neutral-500">Hashtag helper — suggested for this content</p>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleHashtag(tag)}
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                    caption.hashtags.includes(tag)
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-neutral-300 text-neutral-500 hover:border-accent hover:text-accent dark:border-neutral-700'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs dark:border-neutral-700 dark:bg-neutral-950">
            <p className="mb-1 font-semibold text-neutral-500">Preview</p>
            <p className="whitespace-pre-wrap text-neutral-700 dark:text-neutral-300">{fullText || '—'}</p>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-neutral-200 px-5 py-3 dark:border-neutral-800">
          <span className={`text-xs font-semibold ${overLimit ? 'text-red-500' : 'text-neutral-400'}`}>
            {charCount}/{CAPTION_CHAR_LIMIT} characters
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-dark"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
