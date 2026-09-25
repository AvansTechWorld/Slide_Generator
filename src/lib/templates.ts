import { v4 as uuid } from 'uuid'
import type {
  CanvasSize,
  ElementRect,
  ImageElement,
  SlideBackground,
  SlideElement,
  SlideTemplate,
  TextElement,
  TextRole,
  TextStyle,
} from '../types'

// ---------- Factories ----------

export function defaultBackground(overrides: Partial<SlideBackground> = {}): SlideBackground {
  return {
    type: 'solid',
    color: '#111111',
    gradientFrom: '#FF5A1F',
    gradientTo: '#111111',
    gradientAngle: 135,
    imageSrc: null,
    imageFit: 'cover',
    imageOpacity: 1,
    overlayColor: '#000000',
    overlayOpacity: 0,
    ...overrides,
  }
}

function rect(x: number, y: number, width: number, height: number, rotation = 0): ElementRect {
  return { x, y, width, height, rotation }
}

function textStyle(overrides: Partial<TextStyle> = {}): TextStyle {
  return {
    fontFamily: 'Inter',
    fontSize: 48,
    fontWeight: 700,
    color: '#FFFFFF',
    align: 'left',
    lineHeight: 1.2,
    letterSpacing: 0,
    backgroundColor: '#000000',
    backgroundOpacity: 0,
    padding: 0,
    borderRadius: 0,
    ...overrides,
  }
}

export function createTextElement(
  role: TextRole,
  content: string,
  elRect: ElementRect,
  styleOverrides: Partial<TextStyle> = {},
): TextElement {
  return {
    id: uuid(),
    kind: 'text',
    role,
    rect: elRect,
    content,
    style: textStyle(styleOverrides),
    locked: false,
  }
}

export function createImageElement(
  elRect: ElementRect,
  overrides: Partial<Omit<ImageElement, 'id' | 'kind' | 'rect'>> = {},
): ImageElement {
  return {
    id: uuid(),
    kind: 'image',
    rect: elRect,
    src: null,
    fit: 'cover',
    opacity: 1,
    borderRadius: 0,
    locked: false,
    ...overrides,
  }
}

// ---------- Templates ----------
// Each build() receives the current canvas size (e.g. 1080x1350) so
// element positions scale proportionally to the active aspect ratio.

function boldHeadline(size: CanvasSize) {
  const { width: w, height: h } = size
  return {
    background: defaultBackground({ type: 'gradient', gradientFrom: '#FF5A1F', gradientTo: '#111111', gradientAngle: 135 }),
    elements: [
      createTextElement(
        'headline',
        'Your Bold Headline Goes Here',
        rect(w * 0.08, h * 0.35, w * 0.84, h * 0.3),
        { fontFamily: 'Poppins', fontSize: 88, fontWeight: 900, align: 'left', lineHeight: 1.05 },
      ),
      createTextElement(
        'subheadline',
        'A supporting line that adds context',
        rect(w * 0.08, h * 0.68, w * 0.84, h * 0.1),
        { fontFamily: 'Inter', fontSize: 34, fontWeight: 500, align: 'left' },
      ),
      createTextElement('slideNumber', '01', rect(w * 0.08, h * 0.06, w * 0.2, h * 0.06), {
        fontFamily: 'Inter',
        fontSize: 28,
        fontWeight: 700,
        align: 'left',
      }),
    ] as SlideElement[],
  }
}

function listicle(size: CanvasSize) {
  const { width: w, height: h } = size
  return {
    background: defaultBackground({ type: 'solid', color: '#0F172A' }),
    elements: [
      createTextElement('slideNumber', '3 Tips', rect(w * 0.08, h * 0.06, w * 0.5, h * 0.06), {
        fontSize: 28,
        fontWeight: 700,
        color: '#FF5A1F',
        align: 'left',
      }),
      createTextElement(
        'headline',
        'Listicle Title',
        rect(w * 0.08, h * 0.14, w * 0.84, h * 0.14),
        { fontFamily: 'Poppins', fontSize: 56, fontWeight: 800, align: 'left' },
      ),
      createTextElement(
        'body',
        '1. First point goes here\n2. Second point goes here\n3. Third point goes here',
        rect(w * 0.08, h * 0.34, w * 0.84, h * 0.5),
        { fontFamily: 'Inter', fontSize: 36, fontWeight: 500, align: 'left', lineHeight: 1.6 },
      ),
    ] as SlideElement[],
  }
}

function quote(size: CanvasSize) {
  const { width: w, height: h } = size
  return {
    background: defaultBackground({ type: 'solid', color: '#FAF7F2' }),
    elements: [
      createTextElement(
        'headline',
        '\u201CInsert a powerful quote that inspires your audience.\u201D',
        rect(w * 0.1, h * 0.32, w * 0.8, h * 0.36),
        {
          fontFamily: 'Playfair Display',
          fontSize: 52,
          fontWeight: 700,
          color: '#111111',
          align: 'center',
          lineHeight: 1.3,
        },
      ),
      createTextElement('subheadline', '\u2014 Author Name', rect(w * 0.1, h * 0.72, w * 0.8, h * 0.06), {
        fontFamily: 'Inter',
        fontSize: 28,
        fontWeight: 600,
        color: '#666666',
        align: 'center',
      }),
    ] as SlideElement[],
  }
}

function beforeAfter(size: CanvasSize) {
  const { width: w, height: h } = size
  return {
    background: defaultBackground({ type: 'solid', color: '#111111' }),
    elements: [
      createImageElement(rect(w * 0.05, h * 0.18, w * 0.42, h * 0.5), { borderRadius: 24 }),
      createImageElement(rect(w * 0.53, h * 0.18, w * 0.42, h * 0.5), { borderRadius: 24 }),
      createTextElement('subheadline', 'BEFORE', rect(w * 0.05, h * 0.1, w * 0.42, h * 0.06), {
        fontWeight: 800,
        fontSize: 30,
        align: 'center',
      }),
      createTextElement('subheadline', 'AFTER', rect(w * 0.53, h * 0.1, w * 0.42, h * 0.06), {
        fontWeight: 800,
        fontSize: 30,
        align: 'center',
        color: '#FF5A1F',
      }),
      createTextElement(
        'headline',
        'The Transformation',
        rect(w * 0.08, h * 0.74, w * 0.84, h * 0.1),
        { fontFamily: 'Poppins', fontSize: 44, fontWeight: 800, align: 'center' },
      ),
    ] as SlideElement[],
  }
}

function tutorialStep(size: CanvasSize) {
  const { width: w, height: h } = size
  return {
    background: defaultBackground({ type: 'gradient', gradientFrom: '#2563EB', gradientTo: '#111827', gradientAngle: 160 }),
    elements: [
      createTextElement('slideNumber', 'STEP 1', rect(w * 0.08, h * 0.08, w * 0.5, h * 0.08), {
        fontSize: 32,
        fontWeight: 800,
        color: '#FF5A1F',
        align: 'left',
      }),
      createTextElement(
        'headline',
        'Do this first',
        rect(w * 0.08, h * 0.2, w * 0.84, h * 0.14),
        { fontFamily: 'Poppins', fontSize: 56, fontWeight: 800, align: 'left' },
      ),
      createTextElement(
        'body',
        'Explain the step in a couple of clear, simple sentences so the reader can follow along easily.',
        rect(w * 0.08, h * 0.38, w * 0.84, h * 0.3),
        { fontSize: 34, fontWeight: 500, align: 'left', lineHeight: 1.5 },
      ),
    ] as SlideElement[],
  }
}

function tipsCarousel(size: CanvasSize) {
  const { width: w, height: h } = size
  return {
    background: defaultBackground({ type: 'solid', color: '#FFFFFF' }),
    elements: [
      createTextElement('slideNumber', 'TIP #1', rect(w * 0.08, h * 0.08, w * 0.5, h * 0.06), {
        fontSize: 26,
        fontWeight: 800,
        color: '#FF5A1F',
        align: 'left',
      }),
      createTextElement(
        'headline',
        'A short, punchy tip title',
        rect(w * 0.08, h * 0.16, w * 0.84, h * 0.18),
        { fontFamily: 'Poppins', fontSize: 52, fontWeight: 800, color: '#111111', align: 'left' },
      ),
      createTextElement(
        'body',
        'Add a sentence or two of detail that expands on the tip and gives the reader something actionable.',
        rect(w * 0.08, h * 0.42, w * 0.84, h * 0.3),
        { fontSize: 32, fontWeight: 500, color: '#333333', align: 'left', lineHeight: 1.5 },
      ),
    ] as SlideElement[],
  }
}

function minimal(size: CanvasSize) {
  const { width: w, height: h } = size
  return {
    background: defaultBackground({ type: 'solid', color: '#FFFFFF' }),
    elements: [
      createTextElement(
        'headline',
        'Minimal.',
        rect(w * 0.1, h * 0.42, w * 0.8, h * 0.16),
        { fontFamily: 'Poppins', fontSize: 72, fontWeight: 800, color: '#111111', align: 'center' },
      ),
    ] as SlideElement[],
  }
}

function imageHeavy(size: CanvasSize) {
  const { width: w, height: h } = size
  return {
    background: defaultBackground({ type: 'solid', color: '#000000', overlayColor: '#000000', overlayOpacity: 0.25 }),
    elements: [
      createImageElement(rect(0, 0, w, h), { fit: 'cover' }),
      createTextElement(
        'headline',
        'Image-Led Caption',
        rect(w * 0.08, h * 0.76, w * 0.84, h * 0.14),
        { fontFamily: 'Poppins', fontSize: 48, fontWeight: 800, color: '#FFFFFF', align: 'left' },
      ),
    ] as SlideElement[],
  }
}

export const TEMPLATES: SlideTemplate[] = [
  { id: 'bold-headline', name: 'Bold Headline', description: 'Big statement with gradient backdrop', build: boldHeadline },
  { id: 'listicle', name: 'Listicle', description: 'Numbered list on dark background', build: listicle },
  { id: 'quote', name: 'Quote', description: 'Centered editorial quote', build: quote },
  { id: 'before-after', name: 'Before/After', description: 'Two-image comparison layout', build: beforeAfter },
  { id: 'tutorial-step', name: 'Tutorial Step', description: 'Numbered step with explanation', build: tutorialStep },
  { id: 'tips-carousel', name: 'Tips Carousel', description: 'Single tip, headline + body', build: tipsCarousel },
  { id: 'minimal', name: 'Minimal', description: 'Clean centered statement', build: minimal },
  { id: 'image-heavy', name: 'Image-Heavy', description: 'Full-bleed image with caption', build: imageHeavy },
]

export function getTemplate(id: string): SlideTemplate {
  const found = TEMPLATES.find((t) => t.id === id)
  return found ?? TEMPLATES[0]
}
