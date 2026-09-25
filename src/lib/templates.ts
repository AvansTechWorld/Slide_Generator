import { v4 as uuid } from 'uuid'
import type {
  CanvasSize,
  ElementRect,
  IconElement,
  ImageElement,
  SlideBackground,
  SlideElement,
  SlideTemplate,
  TemplateLimits,
  TextElement,
  TextRole,
  TextStyle,
} from '../types'

// ---------- Cyber palette (shared across all templates) ----------

export const CYBER_PALETTE = {
  bg: '#0A0E1A',
  alert: '#FF4D4D',
  safe: '#00E599',
  text: '#F5F5F5',
  card: '#1A1F2E',
  muted: '#8B95A5',
} as const

// ---------- Factories ----------

export function defaultBackground(overrides: Partial<SlideBackground> = {}): SlideBackground {
  return {
    type: 'solid',
    color: CYBER_PALETTE.bg,
    gradientFrom: CYBER_PALETTE.alert,
    gradientTo: CYBER_PALETTE.bg,
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
    fontFamily: 'Space Grotesk',
    fontSize: 48,
    fontWeight: 700,
    color: CYBER_PALETTE.text,
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
  autoFit = true,
): TextElement {
  return {
    id: uuid(),
    kind: 'text',
    role,
    rect: elRect,
    content,
    style: textStyle(styleOverrides),
    locked: false,
    autoFit,
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

export function createIconElement(
  iconId: string,
  elRect: ElementRect,
  color: string = CYBER_PALETTE.safe,
): IconElement {
  return {
    id: uuid(),
    kind: 'icon',
    rect: elRect,
    iconId,
    color,
    locked: false,
  }
}

// ---------- Templates ----------
// Each build() receives the current canvas size (e.g. 1080x1350) so
// element positions scale proportionally to the active aspect ratio.
// All 10 templates share the CYBER_PALETTE.

function threatBrief(size: CanvasSize) {
  const { width: w, height: h } = size
  return {
    background: defaultBackground({ type: 'solid', color: CYBER_PALETTE.bg }),
    elements: [
      createIconElement('warning-triangle', rect(w * 0.08, h * 0.08, w * 0.12, w * 0.12), CYBER_PALETTE.alert),
      createTextElement(
        'headline',
        'A hacker just found a new way in.',
        rect(w * 0.08, h * 0.32, w * 0.84, h * 0.32),
        { fontSize: 76, fontWeight: 700, align: 'left', lineHeight: 1.08, color: CYBER_PALETTE.text },
      ),
      createTextElement('cta', 'SWIPE →', rect(w * 0.08, h * 0.88, w * 0.4, h * 0.06), {
        fontFamily: 'Inter',
        fontSize: 26,
        fontWeight: 800,
        color: CYBER_PALETTE.alert,
        align: 'left',
      }),
    ] as SlideElement[],
  }
}

function listicle(size: CanvasSize) {
  const { width: w, height: h } = size
  return {
    background: defaultBackground({ type: 'solid', color: CYBER_PALETTE.card }),
    elements: [
      createTextElement('slideNumber', 'TIPS', rect(w * 0.08, h * 0.06, w * 0.5, h * 0.06), {
        fontFamily: 'Inter',
        fontSize: 26,
        fontWeight: 800,
        color: CYBER_PALETTE.safe,
        align: 'left',
      }),
      createTextElement(
        'headline',
        '3 ways to lock down your accounts',
        rect(w * 0.08, h * 0.14, w * 0.84, h * 0.16),
        { fontSize: 52, fontWeight: 700, align: 'left', color: CYBER_PALETTE.text },
      ),
      createTextElement(
        'body',
        '- Use a unique password manager\n- Turn on two-factor authentication\n- Review app permissions monthly',
        rect(w * 0.08, h * 0.36, w * 0.84, h * 0.48),
        { fontFamily: 'Inter', fontSize: 34, fontWeight: 500, align: 'left', lineHeight: 1.6, color: CYBER_PALETTE.text },
      ),
    ] as SlideElement[],
  }
}

function beforeAfter(size: CanvasSize) {
  const { width: w, height: h } = size
  return {
    background: defaultBackground({ type: 'solid', color: CYBER_PALETTE.bg }),
    elements: [
      createImageElement(rect(w * 0.05, h * 0.18, w * 0.42, h * 0.46), { borderRadius: 12 }),
      createImageElement(rect(w * 0.53, h * 0.18, w * 0.42, h * 0.46), { borderRadius: 12 }),
      createTextElement('subheadline', 'BEFORE', rect(w * 0.05, h * 0.1, w * 0.42, h * 0.06), {
        fontFamily: 'Inter',
        fontWeight: 800,
        fontSize: 28,
        align: 'center',
        color: CYBER_PALETTE.alert,
      }),
      createTextElement('subheadline', 'AFTER', rect(w * 0.53, h * 0.1, w * 0.42, h * 0.06), {
        fontFamily: 'Inter',
        fontWeight: 800,
        fontSize: 28,
        align: 'center',
        color: CYBER_PALETTE.safe,
      }),
      createTextElement(
        'headline',
        'Weak password vs. passphrase',
        rect(w * 0.08, h * 0.7, w * 0.84, h * 0.14),
        { fontSize: 42, fontWeight: 700, align: 'center', color: CYBER_PALETTE.text },
      ),
    ] as SlideElement[],
  }
}

function statDrop(size: CanvasSize) {
  const { width: w, height: h } = size
  return {
    background: defaultBackground({ type: 'gradient', gradientFrom: CYBER_PALETTE.card, gradientTo: CYBER_PALETTE.bg, gradientAngle: 160 }),
    elements: [
      createTextElement('headline', '94%', rect(w * 0.08, h * 0.3, w * 0.84, h * 0.3), {
        fontSize: 220,
        fontWeight: 700,
        align: 'center',
        color: CYBER_PALETTE.safe,
        lineHeight: 1,
      }),
      createTextElement(
        'subheadline',
        'of breaches start with a phishing email',
        rect(w * 0.1, h * 0.62, w * 0.8, h * 0.12),
        { fontFamily: 'Inter', fontSize: 32, fontWeight: 600, align: 'center', color: CYBER_PALETTE.text },
      ),
      createTextElement('cta', 'Source: Verizon DBIR', rect(w * 0.1, h * 0.88, w * 0.8, h * 0.05), {
        fontFamily: 'Inter',
        fontSize: 20,
        fontWeight: 500,
        align: 'center',
        color: CYBER_PALETTE.muted,
      }),
    ] as SlideElement[],
  }
}

function quoteCard(size: CanvasSize) {
  const { width: w, height: h } = size
  return {
    background: defaultBackground({ type: 'solid', color: CYBER_PALETTE.card }),
    elements: [
      createTextElement('slideNumber', '\u201C', rect(w * 0.08, h * 0.1, w * 0.3, h * 0.16), {
        fontSize: 160,
        fontWeight: 700,
        color: CYBER_PALETTE.safe,
        align: 'left',
        lineHeight: 1,
      }),
      createTextElement(
        'headline',
        'The only truly secure system is one that is powered off.',
        rect(w * 0.1, h * 0.32, w * 0.8, h * 0.34),
        { fontSize: 48, fontWeight: 700, align: 'left', color: CYBER_PALETTE.text, lineHeight: 1.25 },
      ),
      createTextElement('subheadline', '\u2014 Gene Spafford', rect(w * 0.1, h * 0.72, w * 0.8, h * 0.06), {
        fontFamily: 'Inter',
        fontSize: 26,
        fontWeight: 600,
        color: CYBER_PALETTE.safe,
        align: 'left',
      }),
    ] as SlideElement[],
  }
}

function stepByStep(size: CanvasSize) {
  const { width: w, height: h } = size
  return {
    background: defaultBackground({ type: 'solid', color: CYBER_PALETTE.bg }),
    elements: [
      createTextElement('slideNumber', 'STEP 1/5', rect(w * 0.08, h * 0.08, w * 0.5, h * 0.06), {
        fontFamily: 'Inter',
        fontSize: 26,
        fontWeight: 800,
        color: CYBER_PALETTE.safe,
        align: 'left',
      }),
      createTextElement(
        'headline',
        'Check the sender address',
        rect(w * 0.08, h * 0.2, w * 0.84, h * 0.16),
        { fontSize: 52, fontWeight: 700, align: 'left', color: CYBER_PALETTE.text },
      ),
      createTextElement(
        'body',
        'Hover over the sender name to reveal the real email domain before you click anything.',
        rect(w * 0.08, h * 0.4, w * 0.84, h * 0.26),
        { fontFamily: 'Inter', fontSize: 32, fontWeight: 500, align: 'left', lineHeight: 1.5, color: CYBER_PALETTE.text },
      ),
      createTextElement(
        'cta',
        '●●●●●○○○○○',
        rect(w * 0.08, h * 0.9, w * 0.6, h * 0.05),
        { fontFamily: 'monospace', fontSize: 22, fontWeight: 400, color: CYBER_PALETTE.safe, align: 'left' },
        false,
      ),
    ] as SlideElement[],
  }
}

function mythVsFact(size: CanvasSize) {
  const { width: w, height: h } = size
  return {
    background: defaultBackground({ type: 'solid', color: CYBER_PALETTE.bg }),
    elements: [
      createTextElement(
        'headline',
        'Myth vs Fact',
        rect(w * 0.08, h * 0.06, w * 0.84, h * 0.1),
        { fontSize: 48, fontWeight: 700, align: 'center', color: CYBER_PALETTE.text },
      ),
      createIconElement('x-circle', rect(w * 0.12, h * 0.22, w * 0.14, w * 0.14), CYBER_PALETTE.alert),
      createTextElement('subheadline', 'MYTH', rect(w * 0.08, h * 0.38, w * 0.36, h * 0.05), {
        fontFamily: 'Inter',
        fontSize: 26,
        fontWeight: 800,
        color: CYBER_PALETTE.alert,
        align: 'center',
      }),
      createTextElement(
        'body',
        'Incognito mode makes you anonymous online.',
        rect(w * 0.06, h * 0.44, w * 0.4, h * 0.22),
        { fontFamily: 'Inter', fontSize: 26, fontWeight: 500, align: 'center', color: CYBER_PALETTE.text, lineHeight: 1.4 },
      ),
      createIconElement('checkmark', rect(w * 0.74, h * 0.22, w * 0.14, w * 0.14), CYBER_PALETTE.safe),
      createTextElement('subheadline', 'FACT', rect(w * 0.56, h * 0.38, w * 0.36, h * 0.05), {
        fontFamily: 'Inter',
        fontSize: 26,
        fontWeight: 800,
        color: CYBER_PALETTE.safe,
        align: 'center',
      }),
      createTextElement(
        'body',
        'It only hides your history from this device — your ISP and sites still see you.',
        rect(w * 0.54, h * 0.44, w * 0.4, h * 0.28),
        { fontFamily: 'Inter', fontSize: 26, fontWeight: 500, align: 'center', color: CYBER_PALETTE.text, lineHeight: 1.4 },
      ),
    ] as SlideElement[],
  }
}

function checklist(size: CanvasSize) {
  const { width: w, height: h } = size
  return {
    background: defaultBackground({ type: 'solid', color: CYBER_PALETTE.card }),
    elements: [
      createTextElement(
        'headline',
        'Before you travel: security checklist',
        rect(w * 0.08, h * 0.08, w * 0.84, h * 0.16),
        { fontSize: 46, fontWeight: 700, align: 'left', color: CYBER_PALETTE.text },
      ),
      createTextElement(
        'body',
        '- Update your OS and apps\n- Enable find-my-device\n- Turn on a VPN for public wifi\n- Back up your data',
        rect(w * 0.08, h * 0.32, w * 0.84, h * 0.5),
        { fontFamily: 'Inter', fontSize: 32, fontWeight: 500, align: 'left', lineHeight: 1.7, color: CYBER_PALETTE.text },
      ),
    ] as SlideElement[],
  }
}

function newsAlert(size: CanvasSize) {
  const { width: w, height: h } = size
  return {
    background: defaultBackground({ type: 'solid', color: CYBER_PALETTE.bg }),
    elements: [
      createTextElement('slideNumber', 'BREAKING', rect(w * 0.08, h * 0.08, w * 0.45, h * 0.07), {
        fontFamily: 'Inter',
        fontSize: 28,
        fontWeight: 800,
        color: CYBER_PALETTE.bg,
        align: 'center',
        backgroundColor: CYBER_PALETTE.alert,
        backgroundOpacity: 1,
        padding: 12,
        borderRadius: 6,
      }),
      createTextElement(
        'headline',
        'Major password manager confirms data breach',
        rect(w * 0.08, h * 0.24, w * 0.84, h * 0.3),
        { fontSize: 56, fontWeight: 700, align: 'left', color: CYBER_PALETTE.text, lineHeight: 1.1 },
      ),
      createTextElement('subheadline', 'Reuters', rect(w * 0.08, h * 0.86, w * 0.5, h * 0.05), {
        fontFamily: 'Inter',
        fontSize: 24,
        fontWeight: 700,
        color: CYBER_PALETTE.muted,
        align: 'left',
      }),
      createTextElement('cta', 'Sept 2026', rect(w * 0.58, h * 0.86, w * 0.34, h * 0.05), {
        fontFamily: 'Inter',
        fontSize: 24,
        fontWeight: 500,
        color: CYBER_PALETTE.muted,
        align: 'right',
      }),
    ] as SlideElement[],
  }
}

function defenderTakeaway(size: CanvasSize) {
  const { width: w, height: h } = size
  return {
    background: defaultBackground({ type: 'solid', color: CYBER_PALETTE.bg }),
    elements: [
      createIconElement('shield-check', rect(w * 0.5 - w * 0.09, h * 0.14, w * 0.18, w * 0.18), CYBER_PALETTE.safe),
      createTextElement(
        'headline',
        'Turn on two-factor authentication today.',
        rect(w * 0.1, h * 0.4, w * 0.8, h * 0.24),
        { fontSize: 54, fontWeight: 700, align: 'center', color: CYBER_PALETTE.text, lineHeight: 1.2 },
      ),
      createTextElement('cta', 'Follow for more →', rect(w * 0.1, h * 0.86, w * 0.8, h * 0.06), {
        fontFamily: 'Inter',
        fontSize: 28,
        fontWeight: 700,
        color: CYBER_PALETTE.safe,
        align: 'center',
      }),
    ] as SlideElement[],
  }
}

// ---------- Per-template text density limits ----------
// Guidance only (used by the Import Content preview) — not enforced
// anywhere else and never blocks committing slides. Seeded against the
// closest match for each of our 10 cyber templates; the two with no close
// match (Myth vs Fact, News Alert) use DEFAULT_LIMITS.

export const DEFAULT_LIMITS: TemplateLimits = {
  headline: { words: 8, chars: 60 },
  body: { words: 25, chars: 150 },
}

const TEMPLATE_LIMITS: Record<string, TemplateLimits> = {
  'threat-brief': { headline: { words: 7, chars: 50 }, body: { words: 8, chars: 60 } },
  listicle: { headline: { words: 10, chars: 70 }, body: { words: 30, chars: 180 } },
  'before-after': { headline: { words: 8, chars: 60 }, body: { words: 25, chars: 150 } },
  'stat-drop': { headline: { words: 6, chars: 40 }, body: { words: 15, chars: 90 } },
  'quote-card': { headline: { words: 15, chars: 100 }, body: { words: 12, chars: 80 } },
  'step-by-step': { headline: { words: 10, chars: 70 }, body: { words: 30, chars: 180 } },
  checklist: { headline: { words: 8, chars: 60 }, body: { words: 30, chars: 180 } },
  'defender-takeaway': { headline: { words: 6, chars: 40 }, body: { words: 20, chars: 120 } },
}

/** Looks up a template's word/char limits, falling back to DEFAULT_LIMITS. */
export function getTemplateLimits(templateId: string): TemplateLimits {
  return TEMPLATE_LIMITS[templateId] ?? DEFAULT_LIMITS
}

export const TEMPLATES: SlideTemplate[] = [
  {
    id: 'threat-brief',
    name: 'Threat Brief',
    description: 'Dark bg, red accent, big hook headline, swipe cue',
    build: threatBrief,
    limits: getTemplateLimits('threat-brief'),
  },
  {
    id: 'listicle',
    name: 'Listicle',
    description: 'Numbered tips on a clean cyber card background',
    build: listicle,
    limits: getTemplateLimits('listicle'),
  },
  {
    id: 'before-after',
    name: 'Before/After',
    description: 'Split layout comparing a weak vs. strong practice',
    build: beforeAfter,
    limits: getTemplateLimits('before-after'),
  },
  {
    id: 'stat-drop',
    name: 'Stat Drop',
    description: 'Giant number, small label, source line',
    build: statDrop,
    limits: getTemplateLimits('stat-drop'),
  },
  {
    id: 'quote-card',
    name: 'Quote Card',
    description: 'Large quotation mark with attribution',
    build: quoteCard,
    limits: getTemplateLimits('quote-card'),
  },
  {
    id: 'step-by-step',
    name: 'Step-by-Step',
    description: 'STEP badge, headline, body, progress indicator',
    build: stepByStep,
    limits: getTemplateLimits('step-by-step'),
  },
  {
    id: 'myth-vs-fact',
    name: 'Myth vs Fact',
    description: 'Two columns: red X myth vs green check fact',
    build: mythVsFact,
    limits: getTemplateLimits('myth-vs-fact'),
  },
  {
    id: 'checklist',
    name: 'Checklist',
    description: 'Checkbox-style items for an actionable list',
    build: checklist,
    limits: getTemplateLimits('checklist'),
  },
  {
    id: 'news-alert',
    name: 'News Alert',
    description: 'BREAKING banner, headline, source and date',
    build: newsAlert,
    limits: getTemplateLimits('news-alert'),
  },
  {
    id: 'defender-takeaway',
    name: 'Defender Takeaway',
    description: 'Green accent, single bold action item, CTA',
    build: defenderTakeaway,
    limits: getTemplateLimits('defender-takeaway'),
  },
]

export function getTemplate(id: string): SlideTemplate {
  const found = TEMPLATES.find((t) => t.id === id)
  return found ?? TEMPLATES[0]
}
