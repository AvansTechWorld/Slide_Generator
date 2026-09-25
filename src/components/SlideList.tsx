import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useEditorStore } from '../store/useEditorStore'
import { ASPECT_RATIOS, MAX_SLIDES } from '../types'
import type { Slide } from '../types'
import { backgroundStyle, hexToRgba, textNodeStyle } from './SlideCanvas'

const THUMB_WIDTH = 120

function SlideThumbnail({ slide }: { slide: Slide }) {
  const aspectRatio = useEditorStore((s) => s.aspectRatio)
  const size = ASPECT_RATIOS[aspectRatio]
  const scale = THUMB_WIDTH / size.width
  const thumbHeight = size.height * scale

  return (
    <div
      className="relative overflow-hidden rounded-md bg-white"
      style={{ width: THUMB_WIDTH, height: thumbHeight }}
    >
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
              <div style={textNodeStyle(el)}>{el.content}</div>
            ) : (
              <div
                className="h-full w-full bg-neutral-400"
                style={{ borderRadius: el.borderRadius, opacity: el.src ? el.opacity : 0.4 }}
              >
                {el.src && (
                  <img
                    src={el.src}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: el.fit }}
                  />
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
      <div className="flex items-center justify-between px-0.5 text-xs">
        <span className="font-medium text-neutral-500 dark:text-neutral-400">{index + 1}</span>
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
    <aside className="flex w-44 shrink-0 flex-col border-r border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center justify-between border-b border-neutral-200 px-3 py-2.5 dark:border-neutral-800">
        <span className="text-sm font-semibold">Slides</span>
        <span className="text-xs text-neutral-400">
          {slides.length}/{MAX_SLIDES}
        </span>
      </div>
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
