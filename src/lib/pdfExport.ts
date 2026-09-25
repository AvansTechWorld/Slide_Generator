import { jsPDF } from 'jspdf'
import type { BrandKit, CanvasSize, Slide } from '../types'
import { slideToCanvas } from './export'
import { downloadBlob } from './export'

/**
 * Renders all slides at export resolution and combines them into a single
 * PDF (one page per slide, page size matching the slide's aspect ratio)
 * for client review or pre-post QA.
 */
export async function exportSlidesAsPdf(
  slides: Slide[],
  size: CanvasSize,
  brandKit: BrandKit,
  scale = 2,
  onProgress?: (done: number, total: number) => void,
): Promise<void> {
  if (slides.length === 0) return

  const orientation = size.width >= size.height ? 'l' : 'p'
  const pdf = new jsPDF({ orientation, unit: 'px', format: [size.width, size.height], compress: true })

  for (let i = 0; i < slides.length; i++) {
    const canvas = await slideToCanvas(slides[i], size, brandKit, { scale })
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
    if (i > 0) pdf.addPage([size.width, size.height], orientation)
    pdf.addImage(dataUrl, 'JPEG', 0, 0, size.width, size.height)
    onProgress?.(i + 1, slides.length)
  }

  const blob = pdf.output('blob')
  downloadBlob(blob, 'carousel-review.pdf')
}
