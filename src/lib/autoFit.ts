import type { TextElement } from '../types'

export const AUTO_FIT_MIN_SCALE = 0.6
export const AUTO_FIT_STEP = 0.05

export interface FitResult {
  fontSize: number
  lineHeight: number
  overflowing: boolean
}

/**
 * Measures whether `content` rendered with the given box/style fits inside
 * (boxWidth x boxHeight) using an offscreen probe element, then
 * progressively shrinks font-size and line-height together (in lockstep)
 * until it fits or the 60% floor is reached.
 */
export function computeAutoFit(
  content: string,
  fontFamily: string,
  baseFontSize: number,
  baseLineHeight: number,
  fontWeight: number,
  padding: number,
  boxWidth: number,
  boxHeight: number,
): FitResult {
  if (typeof document === 'undefined') {
    return { fontSize: baseFontSize, lineHeight: baseLineHeight, overflowing: false }
  }

  const probe = document.createElement('div')
  probe.style.position = 'fixed'
  probe.style.visibility = 'hidden'
  probe.style.pointerEvents = 'none'
  probe.style.left = '-99999px'
  probe.style.top = '0'
  probe.style.width = `${Math.max(1, boxWidth - padding * 2)}px`
  probe.style.fontFamily = `'${fontFamily}', sans-serif`
  probe.style.fontWeight = String(fontWeight)
  probe.style.whiteSpace = 'pre-wrap'
  probe.style.overflowWrap = 'break-word'
  probe.textContent = content || ' '
  document.body.appendChild(probe)

  const availableHeight = Math.max(1, boxHeight - padding * 2)

  let scale = 1
  let overflowing = false

  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const fontSize = baseFontSize * scale
      const lineHeight = baseLineHeight
      probe.style.fontSize = `${fontSize}px`
      probe.style.lineHeight = String(lineHeight)
      const fits = probe.scrollHeight <= availableHeight
      if (fits) {
        overflowing = false
        break
      }
      if (scale <= AUTO_FIT_MIN_SCALE) {
        overflowing = true
        break
      }
      scale = Math.max(AUTO_FIT_MIN_SCALE, scale - AUTO_FIT_STEP)
    }
  } finally {
    document.body.removeChild(probe)
  }

  return {
    fontSize: Math.round(baseFontSize * scale * 100) / 100,
    lineHeight: baseLineHeight,
    overflowing,
  }
}

/**
 * Convenience wrapper for a TextElement: returns the fitted font size/
 * line-height plus an overflow flag, or the element's own values unchanged
 * when auto-fit is disabled.
 */
export function fitTextElement(el: TextElement): FitResult {
  if (!el.autoFit) {
    return { fontSize: el.style.fontSize, lineHeight: el.style.lineHeight, overflowing: false }
  }
  return computeAutoFit(
    el.content,
    el.style.fontFamily,
    el.style.fontSize,
    el.style.lineHeight,
    el.style.fontWeight,
    el.style.padding,
    el.rect.width,
    el.rect.height,
  )
}
