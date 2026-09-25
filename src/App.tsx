import { useEffect, useState } from 'react'
import Toolbar from './components/Toolbar'
import SlideList from './components/SlideList'
import SlideCanvas from './components/SlideCanvas'
import PropertiesPanel from './components/PropertiesPanel'
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal'
import { useActiveSlide, useEditorStore, useSelectedElement } from './store/useEditorStore'
import { ASPECT_RATIOS } from './types'
import { exportAllSlidesZip, exportSingleSlide } from './lib/export'

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

export default function App() {
  const theme = useEditorStore((s) => s.theme)
  const undo = useEditorStore((s) => s.undo)
  const redo = useEditorStore((s) => s.redo)
  const duplicateSlide = useEditorStore((s) => s.duplicateSlide)
  const deleteSlide = useEditorStore((s) => s.deleteSlide)
  const deleteElement = useEditorStore((s) => s.deleteElement)
  const updateElementRect = useEditorStore((s) => s.updateElementRect)
  const selectedElementId = useEditorStore((s) => s.selectedElementId)
  const activeSlide = useActiveSlide()
  const selectedElement = useSelectedElement()

  const slides = useEditorStore((s) => s.slides)
  const aspectRatio = useEditorStore((s) => s.aspectRatio)
  const brandKit = useEditorStore((s) => s.brandKit)
  const caption = useEditorStore((s) => s.caption)
  const suggestedAudio = useEditorStore((s) => s.suggestedAudio)

  const [showShortcuts, setShowShortcuts] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
  }, [theme])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return

      const meta = e.ctrlKey || e.metaKey

      if (e.key === '?') {
        e.preventDefault()
        setShowShortcuts((v) => !v)
        return
      }

      if (meta && e.key.toLowerCase() === 'z' && e.shiftKey) {
        e.preventDefault()
        redo()
        return
      }
      if (meta && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        undo()
        return
      }
      if (meta && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        if (activeSlide) duplicateSlide(activeSlide.id)
        return
      }
      if (meta && e.shiftKey && e.key.toLowerCase() === 'e') {
        e.preventDefault()
        const size = ASPECT_RATIOS[aspectRatio]
        void exportAllSlidesZip(slides, size, brandKit, 2, undefined, { caption, suggestedAudio })
        return
      }
      if (meta && e.key.toLowerCase() === 'e') {
        e.preventDefault()
        if (!activeSlide) return
        const index = slides.findIndex((s) => s.id === activeSlide.id)
        const size = ASPECT_RATIOS[aspectRatio]
        void exportSingleSlide(activeSlide, index, size, brandKit, 2)
        return
      }
      if (
        selectedElement &&
        activeSlide &&
        (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight')
      ) {
        e.preventDefault()
        const step = e.shiftKey ? 10 : 1
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0
        updateElementRect(activeSlide.id, selectedElement.id, {
          x: selectedElement.rect.x + dx,
          y: selectedElement.rect.y + dy,
        })
        return
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (!activeSlide) return
        e.preventDefault()
        if (selectedElementId) {
          deleteElement(activeSlide.id, selectedElementId)
        } else {
          deleteSlide(activeSlide.id)
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [
    undo,
    redo,
    duplicateSlide,
    deleteSlide,
    deleteElement,
    updateElementRect,
    selectedElementId,
    selectedElement,
    activeSlide,
    slides,
    aspectRatio,
    brandKit,
    caption,
    suggestedAudio,
  ])

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-neutral-100 dark:bg-neutral-950">
      <Toolbar />
      <div className="flex flex-1 overflow-hidden">
        <SlideList />
        <SlideCanvas />
        <PropertiesPanel />
      </div>
      {showShortcuts && <KeyboardShortcutsModal onClose={() => setShowShortcuts(false)} />}
    </div>
  )
}
