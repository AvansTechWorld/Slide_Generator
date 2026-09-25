import { useState } from 'react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useEditorStore } from '../store/useEditorStore'
import { ASPECT_RATIOS, MAX_SLIDES, RECOMMENDED_MAX_SLIDES, SLIDE_LABEL_PRESETS } from '../types'
import type { Slide } from '../types'
import { SLIDE_TAG_LABELS } from '../lib/parseContent'
import { backgroundStyle, hexToRgba, RichContent } from './SlideCanvas'
import { getIcon } from '../lib/icons'
import { parseRichText } from '../lib/richText'

const THUMB_WIDTH = 120

const TAG_COLORS: Record<string, { bg: string; fg: string }> = {
  'question-hook': { bg: 'rgba(0,229,153,0.18)', fg: '#00E599' },
  list: { bg: 'rgba(37,99,235,0.18)', fg: '#60A5FA' },
  stat: { bg: 'rgba(255,77,77,0.18)', fg: '#FF4D4D' },
  'cover-hook': { bg: 'rgba(245,158,11,0.18)', fg: '#F59E0B' },
}

function SlideThumbnail({ slide }: { slide: Slide }) {
  const aspectRatio = useEditorStore((s) => s.aspectRatio)
  const size = ASPECT_RATIOS[aspectRatio]
  const scale = THUMB_WIDTH / size.width
  const thumbHeight = size.height * scale

  return (
    <div className="relative overflow-hidden rounded-md bg-white" style={{ width: THUMB_WIDTH, height: thumbHeight }}>
      <div
        className="absolute left-0 top-0 origin-top-left overflow-hidden"
        style={{ width: size.width, height: size.height, transform: `scale(${scale})` }}
      >
        <div className="absolute inset-0" style={backgroundStyle(slide.background)} />
        {slide.background.overlayOpacity > 0 && (
          <div
            className="absolute inset-0"
            style={{ backgroundColor: hexToRgba(slide.background.overlayColor, slide.background.overlayOpacity) }}
          />
        )}
        {slide.elements.map((el) => (
          <div
            key={el.id}
            style={{
              position: 'absolute',
              left: el.rect.x,
              top: el.rect.y,
              width: el.rect.width,
              height: el.rect.height,
            }}
          >
            {el.kind === 'text' ? (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  overflow: 'hidden',
                  fontFamily: `'${el.style.fontFamily}', sans-serif`,
                  fontSize: el.style.fontSize,
                  fontWeight: el.style.fontWeight,
                  color: el.style.color,
                  textAlign: el.style.align,
                  lineHeight: el.style.lineHeight,
                }}
              >
                <RichContent blocks={parseRichText(el.content)} accentColor={el.style.color} />
              </div>
            ) : el.kind === 'icon' ? (
              <div
                style={{ width: '100%', height: '100%', color: el.color }}
                dangerouslySetInnerHTML={{
                  __html: `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="1.6">${getIcon(el.iconId).svg}</svg>`,
                }}
              />
            ) : (
              <div
                className="h-full w-full bg-neutral-400"
                style={{ borderRadius: el.borderRadius, opacity: el.src ? el.opacity : 0.4 }}
              >
                {el.src && (
                  <img src={el.src} alt="" style={{ width: '100%', height: '100%', objectFit: el.fit }} />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function SortableSlideCard({
  slide,
  index,
  isActive,
  onSelect,
  onDuplicate,
  onDelete,
}: {
  slide: Slide
  index: number
  isActive: boolean
  onSelect: () => void
  onDuplicate: () => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: slide.id })
  const renameSlide = useEditorStore((s) => s.renameSlide)
  const [editingLabel, setEditingLabel] = useState(false)
  const [draftLabel, setDraftLabel] = useState(slide.label)
  const tagColor = TAG_COLORS[slide.tag]

  const commitLabel = () => {
    setEditingLabel(false)
    const trimmed = draftLabel.trim()
    if (trimmed && trimmed !== slide.label) renameSlide(slide.id, trimmed)
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className={`group relative flex flex-col gap-1 rounded-lg border-2 p-2 transition-colors ${
        isActive
          ? 'border-accent bg-accent/5'
          : 'border-transparent bg-white hover:border-neutral-300 dark:bg-neutral-800 dark:hover:border-neutral-600'
      }`}
    >
      <button
        type="button"
        className="absolute left-1 top-1 z-10 cursor-grab touch-none rounded bg-black/40 px-1 text-xs text-white opacity-0 group-hover:opacity-100"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        ⠿
      </button>
      <button type="button" onClick={onSelect} className="block">
        <SlideThumbnail slide={slide} />
      </button>

      {tagColor && slide.tag !== 'none' && (
        <span className="tag-badge w-fit" style={{ backgroundColor: tagColor.bg, color: tagColor.fg }}>
          {SLIDE_TAG_LABELS[slide.tag]}
        </span>
      )}

      <div className="flex items-center justify-between px-0.5 text-xs">
        <span className="font-medium text-neutral-500 dark:text-neutral-400">{index + 1}</span>
        {editingLabel ? (
          <input
            autoFocus
            value={draftLabel}
            onChange={(e) => setDraftLabel(e.target.value)}
            onBlur={commitLabel}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitLabel()
              if (e.key === 'Escape') {
                setDraftLabel(slide.label)
                setEditingLabel(false)
              }
            }}
            className="w-16 rounded border border-accent bg-white px-1 text-[11px] dark:bg-neutral-900"
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setDraftLabel(slide.label)
              setEditingLabel(true)
            }}
            title="Click to rename"
            className="max-w-[64px] truncate text-[11px] font-semibold text-neutral-500 hover:text-accent dark:text-neutral-400"
          >
            {slide.label}
          </button>
        )}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100">
          <button
            type="button"
            title="Duplicate slide"
            onClick={onDuplicate}
            className="rounded px-1 text-neutral-500 hover:text-accent"
          >
            ⧉
          </button>
          <button
            type="button"
            title="Delete slide"
            onClick={onDelete}
            className="rounded px-1 text-neutral-500 hover:text-red-500"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 px-0.5">
        {SLIDE_LABEL_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => renameSlide(slide.id, preset)}
            className="rounded-full border border-neutral-200 px-1.5 py-0.5 text-[9px] font-semibold text-neutral-400 opacity-0 transition hover:border-accent hover:text-accent group-hover:opacity-100 dark:border-neutral-700"
          >
            {preset}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function SlideList() {
  const slides = useEditorStore((s) => s.slides)
  const activeSlideId = useEditorStore((s) => s.activeSlideId)
  const setActiveSlide = useEditorStore((s) => s.setActiveSlide)
  const addSlide = useEditorStore((s) => s.addSlide)
  const duplicateSlide = useEditorStore((s) => s.duplicateSlide)
  const deleteSlide = useEditorStore((s) => s.deleteSlide)
  const reorderSlides = useEditorStore((s) => s.reorderSlides)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const ids = slides.map((s) => s.id)
    const oldIndex = ids.indexOf(String(active.id))
    const newIndex = ids.indexOf(String(over.id))
    if (oldIndex === -1 || newIndex === -1) return
    const reordered = [...ids]
    reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, String(active.id))
    reorderSlides(reordered)
  }

  return (
    <aside className="flex w-48 shrink-0 flex-col border-r border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center justify-between border-b border-neutral-200 px-3 py-2.5 dark:border-neutral-800">
        <span className="text-sm font-semibold">Slides</span>
        <span className="text-xs text-neutral-400">
          {slides.length}/{MAX_SLIDES}
        </span>
      </div>
      {slides.length > RECOMMENDED_MAX_SLIDES && (
        <div className="mx-2 mt-2 rounded-md bg-amber-50 px-2 py-1.5 text-[11px] text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
          {slides.length} slides — engagement data suggests {RECOMMENDED_MAX_SLIDES} is the sweet spot.
        </div>
      )}
      <div className="scrollbar-thin flex-1 overflow-y-auto p-2">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={slides.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2">
              {slides.map((slide, index) => (
                <SortableSlideCard
                  key={slide.id}
                  slide={slide}
                  index={index}
                  isActive={slide.id === activeSlideId}
                  onSelect={() => setActiveSlide(slide.id)}
                  onDuplicate={() => duplicateSlide(slide.id)}
                  onDelete={() => deleteSlide(slide.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
      <div className="border-t border-neutral-200 p-2 dark:border-neutral-800">
        <button
          type="button"
          onClick={() => addSlide()}
          disabled={slides.length >= MAX_SLIDES}
          className="w-full rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          + Add Slide
        </button>
      </div>
    </aside>
  )
}
