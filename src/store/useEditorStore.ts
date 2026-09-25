import { create } from 'zustand'
import { v4 as uuid } from 'uuid'
import type {
  AspectRatioKey,
  CanvasSize,
  ElementRect,
  ImageElement,
  LogoPosition,
  ProjectState,
  Slide,
  SlideBackground,
  SlideElement,
  TextElement,
  TextRole,
  TextStyle,
  ThemeMode,
} from '../types'
import { ASPECT_RATIOS, MAX_SLIDES } from '../types'
import { createImageElement, createTextElement, getTemplate, TEMPLATES } from '../lib/templates'
import { defaultBrandKit, addBrandColor, removeBrandColor, setBrandColor, setBrandFont } from '../lib/brandKit'

const STORAGE_KEY = 'carousel-generator:project:v1'
const MAX_HISTORY = 50

function makeSlide(canvasSize: CanvasSize, templateId = TEMPLATES[0].id): Slide {
  const template = getTemplate(templateId)
  const { background, elements } = template.build(canvasSize)
  return {
    id: uuid(),
    name: template.name,
    background,
    elements,
  }
}

function defaultProject(): ProjectState {
  const size = ASPECT_RATIOS['4:5']
  const slide = makeSlide(size)
  return {
    slides: [slide],
    activeSlideId: slide.id,
    selectedElementId: null,
    aspectRatio: '4:5',
    brandKit: defaultBrandKit(),
    showSafeZone: false,
    theme: 'light',
  }
}

function loadProject(): ProjectState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultProject()
    const parsed = JSON.parse(raw) as ProjectState
    if (!parsed.slides || parsed.slides.length === 0) return defaultProject()
    return parsed
  } catch {
    return defaultProject()
  }
}

function persist(state: ProjectState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // localStorage unavailable or quota exceeded; fail silently
  }
}

function cloneProject(state: ProjectState): ProjectState {
  return JSON.parse(JSON.stringify(state)) as ProjectState
}

function extractProject(state: EditorState): ProjectState {
  return {
    slides: state.slides,
    activeSlideId: state.activeSlideId,
    selectedElementId: state.selectedElementId,
    aspectRatio: state.aspectRatio,
    brandKit: state.brandKit,
    showSafeZone: state.showSafeZone,
    theme: state.theme,
  }
}

export interface EditorState extends ProjectState {
  past: ProjectState[]
  future: ProjectState[]
  isSaved: boolean

  // Slide actions
  addSlide: (templateId?: string) => void
  duplicateSlide: (slideId: string) => void
  deleteSlide: (slideId: string) => void
  reorderSlides: (orderedIds: string[]) => void
  setActiveSlide: (slideId: string) => void
  applyTemplate: (slideId: string, templateId: string) => void
  importSlides: (
    blocks: { headline: string; body: string }[],
    templateId: string,
    mode: 'replace' | 'append',
  ) => void

  // Element actions
  selectElement: (elementId: string | null) => void
  addTextElement: (role: TextRole) => void
  addImageElement: () => void
  updateElementRect: (slideId: string, elementId: string, rect: Partial<ElementRect>) => void
  updateTextContent: (slideId: string, elementId: string, content: string) => void
  updateTextStyle: (slideId: string, elementId: string, style: Partial<TextStyle>) => void
  updateImageProps: (
    slideId: string,
    elementId: string,
    props: Partial<Pick<ImageElement, 'src' | 'fit' | 'opacity' | 'borderRadius'>>,
  ) => void
  deleteElement: (slideId: string, elementId: string) => void

  // Background actions
  updateBackground: (slideId: string, background: Partial<SlideBackground>) => void

  // Canvas / view
  setAspectRatio: (ratio: AspectRatioKey) => void
  toggleSafeZone: () => void
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void

  // Brand kit
  setBrandColorAt: (index: number, color: string) => void
  addBrandColorValue: (color: string) => void
  removeBrandColorAt: (index: number) => void
  setBrandFontAt: (index: number, font: string) => void
  setLogo: (src: string | null) => void
  setLogoPosition: (position: LogoPosition) => void
  setLogoSize: (size: number) => void

  // History
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
}

function commit(
  set: (fn: (state: EditorState) => Partial<EditorState>) => void,
  get: () => EditorState,
  mutator: (draft: ProjectState) => ProjectState,
): void {
  const current = get()
  const snapshot = extractProject(current)
  const draft = cloneProject(snapshot)
  const next = mutator(draft)

  const past = [...current.past, snapshot].slice(-MAX_HISTORY)

  set(() => ({
    ...next,
    past,
    future: [],
    isSaved: false,
  }))

  persist(next)
  set(() => ({ isSaved: true }))
}

function getActiveSlide(project: ProjectState): Slide | null {
  return project.slides.find((s) => s.id === project.activeSlideId) ?? null
}

function canvasSizeFor(ratio: AspectRatioKey): CanvasSize {
  return ASPECT_RATIOS[ratio]
}

export const useEditorStore = create<EditorState>((set, get) => ({
  ...loadProject(),
  past: [],
  future: [],
  isSaved: true,

  addSlide: (templateId) => {
    commit(set, get, (draft) => {
      if (draft.slides.length >= MAX_SLIDES) return draft
      const size = canvasSizeFor(draft.aspectRatio)
      const slide = makeSlide(size, templateId)
      draft.slides.push(slide)
      draft.activeSlideId = slide.id
      draft.selectedElementId = null
      return draft
    })
  },

  duplicateSlide: (slideId) => {
    commit(set, get, (draft) => {
      if (draft.slides.length >= MAX_SLIDES) return draft
      const index = draft.slides.findIndex((s) => s.id === slideId)
      if (index === -1) return draft
      const original = draft.slides[index]
      const copy: Slide = {
        ...original,
        id: uuid(),
        name: `${original.name} copy`,
        elements: original.elements.map((el) => ({ ...el, id: uuid() })),
      }
      draft.slides.splice(index + 1, 0, copy)
      draft.activeSlideId = copy.id
      draft.selectedElementId = null
      return draft
    })
  },

  deleteSlide: (slideId) => {
    commit(set, get, (draft) => {
      if (draft.slides.length <= 1) return draft
      const index = draft.slides.findIndex((s) => s.id === slideId)
      if (index === -1) return draft
      draft.slides.splice(index, 1)
      if (draft.activeSlideId === slideId) {
        const fallback = draft.slides[Math.max(0, index - 1)]
        draft.activeSlideId = fallback ? fallback.id : null
      }
      draft.selectedElementId = null
      return draft
    })
  },

  reorderSlides: (orderedIds) => {
    commit(set, get, (draft) => {
      const bySlideId = new Map(draft.slides.map((s) => [s.id, s]))
      const reordered = orderedIds.map((id) => bySlideId.get(id)).filter((s): s is Slide => Boolean(s))
      if (reordered.length !== draft.slides.length) return draft
      draft.slides = reordered
      return draft
    })
  },

  setActiveSlide: (slideId) => {
    set(() => ({ activeSlideId: slideId, selectedElementId: null }))
  },

  applyTemplate: (slideId, templateId) => {
    commit(set, get, (draft) => {
      const slide = draft.slides.find((s) => s.id === slideId)
      if (!slide) return draft
      const size = canvasSizeFor(draft.aspectRatio)
      const template = getTemplate(templateId)
      const { background, elements } = template.build(size)
      slide.background = background
      slide.elements = elements
      slide.name = template.name
      draft.selectedElementId = null
      return draft
    })
  },

  importSlides: (blocks, templateId, mode) => {
    commit(set, get, (draft) => {
      const size = canvasSizeFor(draft.aspectRatio)
      const capped = blocks.slice(0, MAX_SLIDES)
      const newSlides = capped.map((b) => {
        const slide = makeSlide(size, templateId)
        for (const el of slide.elements) {
          if (el.kind !== 'text') continue
          if (el.role === 'headline') el.content = b.headline
          if (el.role === 'body') el.content = b.body
        }
        return slide
      })

      if (mode === 'replace') {
        draft.slides = newSlides.length > 0 ? newSlides : draft.slides
      } else {
        const room = Math.max(0, MAX_SLIDES - draft.slides.length)
        draft.slides.push(...newSlides.slice(0, room))
      }

      draft.activeSlideId = draft.slides[0]?.id ?? null
      draft.selectedElementId = null
      return draft
    })
  },

  selectElement: (elementId) => {
    set(() => ({ selectedElementId: elementId }))
  },

  addTextElement: (role) => {
    commit(set, get, (draft) => {
      const slide = getActiveSlide(draft)
      if (!slide) return draft
      const size = canvasSizeFor(draft.aspectRatio)
      const labels: Record<TextRole, string> = {
        headline: 'New Headline',
        subheadline: 'New Subheadline',
        body: 'New body text',
        slideNumber: '01',
        cta: '@yourhandle',
      }
      const el = createTextElement(role, labels[role], {
        x: size.width * 0.1,
        y: size.height * 0.45,
        width: size.width * 0.8,
        height: size.height * 0.15,
        rotation: 0,
      })
      slide.elements.push(el)
      draft.selectedElementId = el.id
      return draft
    })
  },

  addImageElement: () => {
    commit(set, get, (draft) => {
      const slide = getActiveSlide(draft)
      if (!slide) return draft
      const size = canvasSizeFor(draft.aspectRatio)
      const el = createImageElement({
        x: size.width * 0.15,
        y: size.height * 0.25,
        width: size.width * 0.7,
        height: size.height * 0.4,
        rotation: 0,
      })
      slide.elements.push(el)
      draft.selectedElementId = el.id
      return draft
    })
  },

  updateElementRect: (slideId, elementId, rectPartial) => {
    commit(set, get, (draft) => {
      const slide = draft.slides.find((s) => s.id === slideId)
      const el = slide?.elements.find((e) => e.id === elementId)
      if (!el) return draft
      el.rect = { ...el.rect, ...rectPartial }
      return draft
    })
  },

  updateTextContent: (slideId, elementId, content) => {
    commit(set, get, (draft) => {
      const slide = draft.slides.find((s) => s.id === slideId)
      const el = slide?.elements.find((e) => e.id === elementId) as TextElement | undefined
      if (!el || el.kind !== 'text') return draft
      el.content = content
      return draft
    })
  },

  updateTextStyle: (slideId, elementId, stylePartial) => {
    commit(set, get, (draft) => {
      const slide = draft.slides.find((s) => s.id === slideId)
      const el = slide?.elements.find((e) => e.id === elementId) as TextElement | undefined
      if (!el || el.kind !== 'text') return draft
      el.style = { ...el.style, ...stylePartial }
      return draft
    })
  },

  updateImageProps: (slideId, elementId, props) => {
    commit(set, get, (draft) => {
      const slide = draft.slides.find((s) => s.id === slideId)
      const el = slide?.elements.find((e) => e.id === elementId) as ImageElement | undefined
      if (!el || el.kind !== 'image') return draft
      Object.assign(el, props)
      return draft
    })
  },

  deleteElement: (slideId, elementId) => {
    commit(set, get, (draft) => {
      const slide = draft.slides.find((s) => s.id === slideId)
      if (!slide) return draft
      slide.elements = slide.elements.filter((e) => e.id !== elementId)
      if (draft.selectedElementId === elementId) draft.selectedElementId = null
      return draft
    })
  },

  updateBackground: (slideId, backgroundPartial) => {
    commit(set, get, (draft) => {
      const slide = draft.slides.find((s) => s.id === slideId)
      if (!slide) return draft
      slide.background = { ...slide.background, ...backgroundPartial }
      return draft
    })
  },

  setAspectRatio: (ratio) => {
    commit(set, get, (draft) => {
      draft.aspectRatio = ratio
      return draft
    })
  },

  toggleSafeZone: () => {
    set((state) => ({ showSafeZone: !state.showSafeZone }))
  },

  setTheme: (theme) => {
    set(() => ({ theme }))
  },

  toggleTheme: () => {
    set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' }))
  },

  setBrandColorAt: (index, color) => {
    commit(set, get, (draft) => {
      draft.brandKit = setBrandColor(draft.brandKit, index, color)
      return draft
    })
  },

  addBrandColorValue: (color) => {
    commit(set, get, (draft) => {
      draft.brandKit = addBrandColor(draft.brandKit, color)
      return draft
    })
  },

  removeBrandColorAt: (index) => {
    commit(set, get, (draft) => {
      draft.brandKit = removeBrandColor(draft.brandKit, index)
      return draft
    })
  },

  setBrandFontAt: (index, font) => {
    commit(set, get, (draft) => {
      draft.brandKit = setBrandFont(draft.brandKit, index, font)
      return draft
    })
  },

  setLogo: (src) => {
    commit(set, get, (draft) => {
      draft.brandKit = { ...draft.brandKit, logoSrc: src }
      return draft
    })
  },

  setLogoPosition: (position) => {
    commit(set, get, (draft) => {
      draft.brandKit = { ...draft.brandKit, logoPosition: position }
      return draft
    })
  },

  setLogoSize: (size) => {
    commit(set, get, (draft) => {
      draft.brandKit = { ...draft.brandKit, logoSize: size }
      return draft
    })
  },

  undo: () => {
    const state = get()
    if (state.past.length === 0) return
    const previous = state.past[state.past.length - 1]
    const currentSnapshot = extractProject(state)
    const newPast = state.past.slice(0, -1)
    set(() => ({
      ...previous,
      past: newPast,
      future: [currentSnapshot, ...state.future],
      isSaved: false,
    }))
    persist(previous)
    set(() => ({ isSaved: true }))
  },

  redo: () => {
    const state = get()
    if (state.future.length === 0) return
    const next = state.future[0]
    const currentSnapshot = extractProject(state)
    const newFuture = state.future.slice(1)
    set(() => ({
      ...next,
      past: [...state.past, currentSnapshot].slice(-MAX_HISTORY),
      future: newFuture,
      isSaved: false,
    }))
    persist(next)
    set(() => ({ isSaved: true }))
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,
}))

export function useActiveSlide(): Slide | null {
  const activeSlideId = useEditorStore((s) => s.activeSlideId)
  const slides = useEditorStore((s) => s.slides)
  return slides.find((s) => s.id === activeSlideId) ?? null
}

export function useSelectedElement(): SlideElement | null {
  const slide = useActiveSlide()
  const selectedElementId = useEditorStore((s) => s.selectedElementId)
  if (!slide || !selectedElementId) return null
  return slide.elements.find((e) => e.id === selectedElementId) ?? null
}
