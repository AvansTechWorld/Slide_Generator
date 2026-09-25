// ---------- Primitive / shared types ----------

export type AspectRatioKey = '4:5' | '1:1' | '9:16'

export interface CanvasSize {
  width: number
  height: number
}

export const ASPECT_RATIOS: Record<AspectRatioKey, CanvasSize> = {
  '4:5': { width: 1080, height: 1350 },
  '1:1': { width: 1080, height: 1080 },
  '9:16': { width: 1080, height: 1920 },
}

export type TextAlign = 'left' | 'center' | 'right'
export type FontWeight = 400 | 500 | 600 | 700 | 800 | 900
export type BackgroundFit = 'cover' | 'contain'
export type ElementKind = 'text' | 'image'
export type LogoPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'none'
export type ThemeMode = 'light' | 'dark'

export type TextRole = 'headline' | 'subheadline' | 'body' | 'slideNumber' | 'cta'

// ---------- Element geometry ----------

export interface ElementRect {
  x: number
  y: number
  width: number
  height: number
  rotation: number
}

// ---------- Text element style ----------

export interface TextStyle {
  fontFamily: string
  fontSize: number
  fontWeight: FontWeight
  color: string
  align: TextAlign
  lineHeight: number
  letterSpacing: number
  backgroundColor: string
  backgroundOpacity: number
  padding: number
  borderRadius: number
}

export interface TextElement {
  id: string
  kind: 'text'
  role: TextRole
  rect: ElementRect
  content: string
  style: TextStyle
  locked: boolean
}

// ---------- Image element style ----------

export interface ImageElement {
  id: string
  kind: 'image'
  rect: ElementRect
  src: string | null
  fit: BackgroundFit
  opacity: number
  borderRadius: number
  locked: boolean
}

export type SlideElement = TextElement | ImageElement

// ---------- Background ----------

export type BackgroundType = 'solid' | 'gradient' | 'image'

export interface SlideBackground {
  type: BackgroundType
  color: string
  gradientFrom: string
  gradientTo: string
  gradientAngle: number
  imageSrc: string | null
  imageFit: BackgroundFit
  imageOpacity: number
  overlayColor: string
  overlayOpacity: number
}

// ---------- Slide ----------

export interface Slide {
  id: string
  name: string
  background: SlideBackground
  elements: SlideElement[]
}

// ---------- Brand kit ----------

export interface BrandKit {
  colors: string[]
  fonts: string[]
  logoSrc: string | null
  logoPosition: LogoPosition
  logoSize: number
}

// ---------- Templates ----------

export interface SlideTemplate {
  id: string
  name: string
  description: string
  build: (canvasSize: CanvasSize) => { background: SlideBackground; elements: SlideElement[] }
}

// ---------- Project (persisted state) ----------

export interface ProjectState {
  slides: Slide[]
  activeSlideId: string | null
  selectedElementId: string | null
  aspectRatio: AspectRatioKey
  brandKit: BrandKit
  showSafeZone: boolean
  theme: ThemeMode
}

export const MAX_SLIDES = 20
export const MAX_BRAND_COLORS = 5
export const MAX_BRAND_FONTS = 2

export const FONT_OPTIONS = [
  'Inter',
  'Poppins',
  'Playfair Display',
  'Roboto Slab',
  'system-ui',
  'Georgia',
  'Arial',
] as const

export type FontOption = (typeof FONT_OPTIONS)[number]
