import type { Slide, TextElement } from '../types'

export interface SafetyFinding {
  slideId: string
  slideIndex: number
  label: string
  reason: 'no-headline' | 'near-empty'
}

const NEAR_EMPTY_CHAR_THRESHOLD = 6

function hasHeadline(slide: Slide): boolean {
  return slide.elements.some(
    (el): el is TextElement => el.kind === 'text' && el.role === 'headline' && el.content.trim().length > 0,
  )
}

function visibleCharCount(slide: Slide): number {
  return slide.elements.reduce((sum, el) => (el.kind === 'text' ? sum + el.content.trim().length : sum), 0)
}

/**
 * Since Instagram can resurface a carousel starting from slide 2 onward,
 * this checks every slide after the first for a headline and enough
 * visible content to stand alone without the rest of the carousel.
 */
export function runReserveSafetyCheck(slides: Slide[]): SafetyFinding[] {
  const findings: SafetyFinding[] = []
  slides.forEach((slide, index) => {
    if (index === 0) return // slide 1 is always the entry point
    if (!hasHeadline(slide)) {
      findings.push({ slideId: slide.id, slideIndex: index, label: slide.label, reason: 'no-headline' })
      return
    }
    if (visibleCharCount(slide) < NEAR_EMPTY_CHAR_THRESHOLD) {
      findings.push({ slideId: slide.id, slideIndex: index, label: slide.label, reason: 'near-empty' })
    }
  })
  return findings
}
