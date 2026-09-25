import html2canvas from 'html2canvas'
import JSZip from 'jszip'
import type { BrandKit, CanvasSize, ImageElement, Slide, SlideElement, TextElement } from '../types'
import { logoPositionStyle } from './brandKit'

// ---------- DOM builders (used only for offscreen, true-resolution export) ----------

function applyStyles(el: HTMLElement, styles: Partial<CSSStyleDeclaration>): void {
  Object.assign(el.style, styles)
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '')
  const bigint = parseInt(
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean,
    16,
  )
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function buildBackgroundLayer(slide: Slide, size: CanvasSize): HTMLDivElement {
  const bg = slide.background
  const layer = document.createElement('div')
  applyStyles(layer, {
    position: 'absolute',
    inset: '0',
    width: `${size.width}px`,
    height: `${size.height}px`,
    overflow: 'hidden',
  })

  const base = document.createElement('div')
  applyStyles(base, { position: 'absolute', inset: '0' })

  if (bg.type === 'solid') {
    base.style.backgroundColor = bg.color
  } else if (bg.type === 'gradient') {
    base.style.background = `linear-gradient(${bg.gradientAngle}deg, ${bg.gradientFrom}, ${bg.gradientTo})`
  } else if (bg.type === 'image' && bg.imageSrc) {
    base.style.backgroundImage = `url(${bg.imageSrc})`
    base.style.backgroundSize = bg.imageFit === 'cover' ? 'cover' : 'contain'
    base.style.backgroundPosition = 'center'
    base.style.backgroundRepeat = 'no-repeat'
    base.style.opacity = String(bg.imageOpacity)
  }
  layer.appendChild(base)

  if (bg.overlayOpacity > 0) {
    const overlay = document.createElement('div')
    applyStyles(overlay, {
      position: 'absolute',
      inset: '0',
      backgroundColor: hexToRgba(bg.overlayColor, bg.overlayOpacity),
    })
    layer.appendChild(overlay)
  }

  return layer
}

function buildTextNode(element: TextElement): HTMLDivElement {
  const el = document.createElement('div')
  const { rect, style, content } = element
  applyStyles(el, {
    position: 'absolute',
    left: `${rect.x}px`,
    top: `${rect.y}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    transform: rect.rotation ? `rotate(${rect.rotation}deg)` : 'none',
    fontFamily: `'${style.fontFamily}', sans-serif`,
    fontSize: `${style.fontSize}px`,
    fontWeight: String(style.fontWeight),
    color: style.color,
    textAlign: style.align,
    lineHeight: String(style.lineHeight),
    letterSpacing: `${style.letterSpacing}px`,
    padding: `${style.padding}px`,
    borderRadius: `${style.borderRadius}px`,
    backgroundColor:
      style.backgroundOpacity > 0 ? hexToRgba(style.backgroundColor, style.backgroundOpacity) : 'transparent',
    whiteSpace: 'pre-wrap',
    overflowWrap: 'break-word',
    display: 'flex',
    alignItems: style.align === 'center' ? 'center' : 'flex-start',
    justifyContent: style.align === 'center' ? 'center' : style.align === 'right' ? 'flex-end' : 'flex-start',
  })
  const span = document.createElement('div')
  span.style.width = '100%'
  span.textContent = content
  el.appendChild(span)
  return el
}

function buildImageNode(element: ImageElement): HTMLDivElement {
  const el = document.createElement('div')
  const { rect } = element
  applyStyles(el, {
    position: 'absolute',
    left: `${rect.x}px`,
    top: `${rect.y}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    transform: rect.rotation ? `rotate(${rect.rotation}deg)` : 'none',
    borderRadius: `${element.borderRadius}px`,
    overflow: 'hidden',
    backgroundColor: element.src ? 'transparent' : '#94a3b8',
  })
  if (element.src) {
    const img = document.createElement('img')
    img.src = element.src
    img.crossOrigin = 'anonymous'
    applyStyles(img, {
      width: '100%',
      height: '100%',
      objectFit: element.fit,
      opacity: String(element.opacity),
    })
    el.appendChild(img)
  }
  return el
}

function buildElementNode(element: SlideElement): HTMLDivElement {
  return element.kind === 'text' ? buildTextNode(element) : buildImageNode(element)
}

function buildLogoNode(brandKit: BrandKit): HTMLImageElement | null {
  if (!brandKit.logoSrc || brandKit.logoPosition === 'none') return null
  const img = document.createElement('img')
  img.src = brandKit.logoSrc
  img.crossOrigin = 'anonymous'
  applyStyles(img, logoPositionStyle(brandKit.logoPosition, brandKit.logoSize) as Partial<CSSStyleDeclaration>)
  return img
}

/**
 * Builds a fully unscaled, true-resolution DOM stage for a slide and mounts
 * it off-screen (not visible, not affected by any preview CSS transform).
 * This guarantees export dimensions always match the canvas size exactly,
 * regardless of what zoom level the on-screen preview is using.
 */
function buildOffscreenStage(slide: Slide, size: CanvasSize, brandKit: BrandKit): HTMLDivElement {
  const host = document.createElement('div')
  applyStyles(host, {
    position: 'fixed',
    top: '0',
    left: '-100000px',
    width: `${size.width}px`,
    height: `${size.height}px`,
    overflow: 'hidden',
    background: '#ffffff',
  })

  const stage = document.createElement('div')
  applyStyles(stage, {
    position: 'relative',
    width: `${size.width}px`,
    height: `${size.height}px`,
    overflow: 'hidden',
  })

  stage.appendChild(buildBackgroundLayer(slide, size))
  for (const element of slide.elements) {
    stage.appendChild(buildElementNode(element))
  }
  const logo = buildLogoNode(brandKit)
  if (logo) stage.appendChild(logo)

  host.appendChild(stage)
  document.body.appendChild(host)
  return host
}

async function waitForImages(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll('img'))
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve()
            return
          }
          img.onload = () => resolve()
          img.onerror = () => resolve()
        }),
    ),
  )
}

export interface ExportOptions {
  scale?: number
}

export async function slideToCanvas(
  slide: Slide,
  size: CanvasSize,
  brandKit: BrandKit,
  options: ExportOptions = {},
): Promise<HTMLCanvasElement> {
  const scale = options.scale ?? 2
  const host = buildOffscreenStage(slide, size, brandKit)
  try {
    await waitForImages(host)
    const canvas = await html2canvas(host.firstElementChild as HTMLElement, {
      width: size.width,
      height: size.height,
      scale,
      backgroundColor: null,
      useCORS: true,
      logging: false,
    })
    return canvas
  } finally {
    document.body.removeChild(host)
  }
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Failed to create PNG blob'))
    }, 'image/png')
  })
}

export function slideFileName(index: number): string {
  const num = String(index + 1).padStart(2, '0')
  return `carousel-slide-${num}.png`
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function exportSingleSlide(
  slide: Slide,
  index: number,
  size: CanvasSize,
  brandKit: BrandKit,
  scale = 2,
): Promise<void> {
  const canvas = await slideToCanvas(slide, size, brandKit, { scale })
  const blob = await canvasToBlob(canvas)
  downloadBlob(blob, slideFileName(index))
}

export async function exportAllSlidesZip(
  slides: Slide[],
  size: CanvasSize,
  brandKit: BrandKit,
  scale = 2,
  onProgress?: (done: number, total: number) => void,
): Promise<void> {
  const zip = new JSZip()
  for (let i = 0; i < slides.length; i++) {
    const canvas = await slideToCanvas(slides[i], size, brandKit, { scale })
    const blob = await canvasToBlob(canvas)
    zip.file(slideFileName(i), blob)
    onProgress?.(i + 1, slides.length)
  }
  const zipBlob = await zip.generateAsync({ type: 'blob' })
  downloadBlob(zipBlob, 'carousel-slides.zip')
}
