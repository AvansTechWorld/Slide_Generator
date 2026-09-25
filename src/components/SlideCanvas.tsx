import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import type { ImageElement, SlideBackground, SlideElement, TextElement } from '../types'
import { ASPECT_RATIOS } from '../types'
import { useActiveSlide, useEditorStore } from '../store/useEditorStore'
import { logoPositionStyle } from '../lib/brandKit'

type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se'

export function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '')
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean
  const bigint = parseInt(full || '000000', 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function backgroundStyle(bg: SlideBackground): CSSProperties {
  if (bg.type === 'solid') {
    return { backgroundColor: bg.color }
  }
  if (bg.type === 'gradient') {
    return { background: `linear-gradient(${bg.gradientAngle}deg, ${bg.gradientFrom}, ${bg.gradientTo})` }
  }
  return {
    backgroundColor: '#0a0a0a',
    backgroundImage: bg.imageSrc ? `url(${bg.imageSrc})` : undefined,
    backgroundSize: bg.imageFit === 'cover' ? 'cover' : 'contain',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    opacity: bg.imageOpacity,
  }
}

export function textNodeStyle(el: TextElement): CSSProperties {
  const { style } = el
  return {
    fontFamily: `'${style.fontFamily}', sans-serif`,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    color: style.color,
    textAlign: style.align,
    lineHeight: style.lineHeight,
    letterSpacing: style.letterSpacing,
    padding: style.padding,
    borderRadius: style.borderRadius,
    backgroundColor: style.backgroundOpacity > 0 ? hexToRgba(style.backgroundColor, style.backgroundOpacity) : 'transparent',
    whiteSpace: 'pre-wrap',
    overflowWrap: 'break-word',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: style.align === 'center' ? 'center' : 'flex-start',
    justifyContent: style.align === 'center' ? 'center' : style.align === 'right' ? 'flex-end' : 'flex-start',
    outline: 'none',
  }
}

export default function SlideCanvas() {
  const slide = useActiveSlide()
  const aspectRatio = useEditorStore((s) => s.aspectRatio)
  const showSafeZone = useEditorStore((s) => s.showSafeZone)
  const selectedElementId = useEditorStore((s) => s.selectedElementId)
  const selectElement = useEditorStore((s) => s.selectElement)
  const updateElementRect = useEditorStore((s) => s.updateElementRect)
  const updateTextContent = useEditorStore((s) => s.updateTextContent)
  const brandKit = useEditorStore((s) => s.brandKit)

  const canvasSize = ASPECT_RATIOS[aspectRatio]
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.3)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const recompute = () => {
      const padding = 48
      const availW = container.clientWidth - padding
      const availH = container.clientHeight - padding
      const next = Math.min(availW / canvasSize.width, availH / canvasSize.height, 1)
      setScale(next > 0 ? next : 0.1)
    }

    recompute()
    const observer = new ResizeObserver(recompute)
    observer.observe(container)
    return () => observer.disconnect()
  }, [canvasSize.width, canvasSize.height])

  const dragState = useRef<{
    kind: 'move' | 'resize'
    handle?: ResizeHandle
    startX: number
    startY: number
    origRect: SlideElement['rect']
    elementId: string
  } | null>(null)

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      const drag = dragState.current
      if (!drag || !slide) return
      const dx = (e.clientX - drag.startX) / scale
      const dy = (e.clientY - drag.startY) / scale

      if (drag.kind === 'move') {
        updateElementRect(slide.id, drag.elementId, {
          x: drag.origRect.x + dx,
          y: drag.origRect.y + dy,
        })
        return
      }

      let { x, y, width, height } = drag.origRect
      const minSize = 24
      if (drag.handle === 'se') {
        width = Math.max(minSize, drag.origRect.width + dx)
        height = Math.max(minSize, drag.origRect.height + dy)
      } else if (drag.handle === 'sw') {
        width = Math.max(minSize, drag.origRect.width - dx)
        x = drag.origRect.x + drag.origRect.width - width
        height = Math.max(minSize, drag.origRect.height + dy)
      } else if (drag.handle === 'ne') {
        width = Math.max(minSize, drag.origRect.width + dx)
        height = Math.max(minSize, drag.origRect.height - dy)
        y = drag.origRect.y + drag.origRect.height - height
      } else if (drag.handle === 'nw') {
        width = Math.max(minSize, drag.origRect.width - dx)
        x = drag.origRect.x + drag.origRect.width - width
        height = Math.max(minSize, drag.origRect.height - dy)
        y = drag.origRect.y + drag.origRect.height - height
      }
      updateElementRect(slide.id, drag.elementId, { x, y, width, height })
    },
    [scale, slide, updateElementRect],
  )

  const handlePointerUp = useCallback(() => {
    dragState.current = null
    window.removeEventListener('pointermove', handlePointerMove)
    window.removeEventListener('pointerup', handlePointerUp)
  }, [handlePointerMove])

  const startMove = (e: ReactPointerEvent, el: SlideElement) => {
    e.stopPropagation()
    selectElement(el.id)
    dragState.current = {
      kind: 'move',
      startX: e.clientX,
      startY: e.clientY,
      origRect: el.rect,
      elementId: el.id,
    }
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
  }

  const startResize = (e: ReactPointerEvent, el: SlideElement, handle: ResizeHandle) => {
    e.stopPropagation()
    selectElement(el.id)
    dragState.current = {
      kind: 'resize',
      handle,
      startX: e.clientX,
      startY: e.clientY,
      origRect: el.rect,
      elementId: el.id,
    }
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
  }

  const [editingId, setEditingId] = useState<string | null>(null)

  const logoStyle = useMemo(() => logoPositionStyle(brandKit.logoPosition, brandKit.logoSize), [brandKit])

  if (!slide) {
    return (
      <div className="flex flex-1 items-center justify-center text-neutral-400">
        No slide selected
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative flex flex-1 items-center justify-center overflow-hidden bg-neutral-200 dark:bg-neutral-900"
      onPointerDown={() => selectElement(null)}
    >
      <div
        className="relative shadow-panel"
        style={{
          width: canvasSize.width * scale,
          height: canvasSize.height * scale,
        }}
      >
        <div
          className="absolute left-0 top-0 origin-top-left overflow-hidden bg-white"
          style={{
            width: canvasSize.width,
            height: canvasSize.height,
            transform: `scale(${scale})`,
          }}
        >
          {/* Background */}
          <div className="absolute inset-0" style={backgroundStyle(slide.background)} />
          {slide.background.overlayOpacity > 0 && (
            <div
              className="absolute inset-0"
              style={{ backgroundColor: hexToRgba(slide.background.overlayColor, slide.background.overlayOpacity) }}
            />
          )}

          {/* Elements */}
          {slide.elements.map((el) => (
            <div
              key={el.id}
              onPointerDown={(e) => startMove(e, el)}
              onDoubleClick={() => el.kind === 'text' && setEditingId(el.id)}
              className={selectedElementId === el.id ? 'element-outline' : ''}
              style={{
                position: 'absolute',
                left: el.rect.x,
                top: el.rect.y,
                width: el.rect.width,
                height: el.rect.height,
                transform: el.rect.rotation ? `rotate(${el.rect.rotation}deg)` : undefined,
                cursor: 'move',
              }}
            >
              {el.kind === 'text' ? (
                editingId === el.id ? (
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    autoFocus
                    style={textNodeStyle(el)}
                    onPointerDown={(e) => e.stopPropagation()}
                    onBlur={(e) => {
                      updateTextContent(slide.id, el.id, e.currentTarget.textContent ?? '')
                      setEditingId(null)
                    }}
                  >
                    {el.content}
                  </div>
                ) : (
                  <div style={textNodeStyle(el)}>{el.content}</div>
                )
              ) : (
                <ImageBlock el={el} />
              )}

              {selectedElementId === el.id && !el.locked && (
                <>
                  {(['nw', 'ne', 'sw', 'se'] as ResizeHandle[]).map((handle) => (
                    <div
                      key={handle}
                      onPointerDown={(e) => startResize(e, el, handle)}
                      className="absolute h-3 w-3 rounded-full border-2 border-blue-500 bg-white"
                      style={{
                        cursor: `${handle}-resize`,
                        top: handle.includes('n') ? -6 : undefined,
                        bottom: handle.includes('s') ? -6 : undefined,
                        left: handle.includes('w') ? -6 : undefined,
                        right: handle.includes('e') ? -6 : undefined,
                      }}
                    />
                  ))}
                </>
              )}
            </div>
          ))}

          {brandKit.logoSrc && brandKit.logoPosition !== 'none' && (
            // eslint-disable-next-line jsx-a11y/alt-text
            <img src={brandKit.logoSrc} style={logoStyle} alt="Brand logo" />
          )}

          {showSafeZone && (
            <div
              className="pointer-events-none absolute border-2 border-dashed border-red-500/70"
              style={{
                left: canvasSize.width * 0.05,
                top: canvasSize.height * 0.05,
                width: canvasSize.width * 0.9,
                height: canvasSize.height * 0.9,
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function ImageBlock({ el }: { el: ImageElement }) {
  return (
    <div
      className="h-full w-full overflow-hidden checkerboard"
      style={{ borderRadius: el.borderRadius }}
    >
      {el.src ? (
        <img
          src={el.src}
          alt=""
          draggable={false}
          style={{ width: '100%', height: '100%', objectFit: el.fit, opacity: el.opacity }}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs font-medium text-neutral-500">
          No image
        </div>
      )}
    </div>
  )
}
