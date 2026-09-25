import html2canvas from 'html2canvas'
import JSZip from 'jszip'
import type { BrandKit, CanvasSize, IconElement, ImageElement, Slide, SlideElement, TextElement, CaptionState } from '../types'
import { logoPositionStyle } from './brandKit'
import { getIcon } from './icons'
import { parseRichText } from './richText'
import { fitTextElement } from './autoFit'

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

function buildRichContentNode(content: string, baseColor: string): HTMLDivElement {
  const wrapper = document.createElement('div')
  wrapper.style.width = '100%'
  const blocks = parseRichText(content)

  for (const block of blocks) {
    if (block.kind === 'paragraph') {
      for (const runs of block.items) {
        const p = document.createElement('div')
        p.style.whiteSpace = 'pre-wrap'
        p.style.overflowWrap = 'break-word'
        for (const run of runs) {
          const span = document.createElement('span')
          if (run.mark === 'bold') span.style.fontWeight = '800'
          if (run.mark === 'italic') span.style.fontStyle = 'italic'
          if (run.mark === 'code') {
            span.style.fontFamily = "'JetBrains Mono', monospace"
            span.style.backgroundColor = 'rgba(255,255,255,0.12)'
            span.style.borderRadius = '4px'
            span.style.padding = '0 4px'
          }
          span.textContent = run.text
          p.appendChild(span)
        }
        wrapper.appendChild(p)
      }
    } else {
      const list = document.createElement('div')
      block.items.forEach((runs, i) => {
        const item = document.createElement('div')
        item.style.display = 'flex'
        item.style.gap = '0.5em'
        item.style.paddingLeft = '0'

        const marker = document.createElement('span')
        marker.style.flexShrink = '0'
        marker.style.color = baseColor
        marker.textContent = block.kind === 'numbered-list' ? `${i + 1}.` : '•'

        const textEl = document.createElement('span')
        textEl.style.whiteSpace = 'pre-wrap'
        textEl.style.overflowWrap = 'break-word'
        for (const run of runs) {
          const span = document.createElement('span')
          if (run.mark === 'bold') span.style.fontWeight = '800'
          if (run.mark === 'italic') span.style.fontStyle = 'italic'
          if (run.mark === 'code') {
            span.style.fontFamily = "'JetBrains Mono', monospace"
            span.style.backgroundColor = 'rgba(255,255,255,0.12)'
            span.style.borderRadius = '4px'
            span.style.padding = '0 4px'
          }
          span.textContent = run.text
          textEl.appendChild(span)
        }
        item.appendChild(marker)
        item.appendChild(textEl)
        list.appendChild(item)
      })
      wrapper.appendChild(list)
    }
  }

  return wrapper
}

function buildTextNode(element: TextElement): HTMLDivElement {
  const el = document.createElement('div')
  const { rect, style } = element
  const fit = fitTextElement(element)
  applyStyles(el, {
    position: 'absolute',
    left: `${rect.x}px`,
    top: `${rect.y}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    transform: rect.rotation ? `rotate(${rect.rotation}deg)` : 'none',
    fontFamily: `'${style.fontFamily}', sans-serif`,
    fontSize: `${fit.fontSize}px`,
    fontWeight: String(style.fontWeight),
    color: style.color,
    textAlign: style.align,
    lineHeight: String(fit.lineHeight),
    letterSpacing: `${style.letterSpacing}px`,
    padding: `${style.padding}px`,
    borderRadius: `${style.borderRadius}px`,
    backgroundColor:
      style.backgroundOpacity > 0 ? hexToRgba(style.backgroundColor, style.backgroundOpacity) : 'transparent',
    overflow: 'hidden',
    display: 'flex',
    alignItems: style.align === 'center' ? 'center' : 'flex-start',
    justifyContent: style.align === 'center' ? 'center' : style.align === 'right' ? 'flex-end' : 'flex-start',
  })
  el.appendChild(buildRichContentNode(element.content, style.color))
  return el
}

function buildIconNode(element: IconElement): HTMLDivElement {
  const el = document.createElement('div')
  const { rect } = element
  const def = getIcon(element.iconId)
  applyStyles(el, {
    position: 'absolute',
    left: `${rect.x}px`,
    top: `${rect.y}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    transform: rect.rotation ? `rotate(${rect.rotation}deg)` : 'none',
    color: element.color,
  })
  el.innerHTML = `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${def.svg}</svg>`
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
  if (element.kind === 'text') return buildTextNode(element)
  if (element.kind === 'icon') return buildIconNode(element)
  return buildImageNode(element)
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

export function buildCaptionText(caption: CaptionState): string {
  const parts = [caption.hook, caption.body, caption.cta].filter((p) => p.trim().length > 0)
  const hashtagLine = caption.hashtags.length > 0 ? `\n\n${caption.hashtags.join(' ')}` : ''
  return `${parts.join('\n\n')}${hashtagLine}`
}

export function buildReadmeText(suggestedAudio: string, slideCount: number): string {
  return [
    'Instagram Carousel — export notes',
    '==================================',
    '',
    `Slides: ${slideCount}`,
    `Suggested audio track: ${suggestedAudio || 'Not set'}`,
    '',
    'Add this audio track (or something in the same category) when you post',
    'the carousel as a Reel/cover, or set it as background audio if your',
    'posting flow supports it.',
    '',
    'caption.txt in this ZIP contains the ready-to-paste caption + hashtags.',
  ].join('\n')
}

export interface ZipExportExtras {
  caption?: CaptionState
  suggestedAudio?: string
}

export async function exportAllSlidesZip(
  slides: Slide[],
  size: CanvasSize,
  brandKit: BrandKit,
  scale = 2,
  onProgress?: (done: number, total: number) => void,
  extras?: ZipExportExtras,
): Promise<void> {
  const zip = new JSZip()
  for (let i = 0; i < slides.length; i++) {
    const canvas = await slideToCanvas(slides[i], size, brandKit, { scale })
    const blob = await canvasToBlob(canvas)
    zip.file(slideFileName(i), blob)
    onProgress?.(i + 1, slides.length)
  }
  if (extras?.caption) {
    zip.file('caption.txt', buildCaptionText(extras.caption))
  }
  if (extras?.suggestedAudio !== undefined) {
    zip.file('readme.txt', buildReadmeText(extras.suggestedAudio, slides.length))
  }
  const zipBlob = await zip.generateAsync({ type: 'blob' })
  downloadBlob(zipBlob, 'carousel-slides.zip')
}
