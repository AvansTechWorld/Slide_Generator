import { useEffect } from 'react'
import Toolbar from './components/Toolbar'
import SlideList from './components/SlideList'
import SlideCanvas from './components/SlideCanvas'
import PropertiesPanel from './components/PropertiesPanel'
import { useActiveSlide, useEditorStore } from './store/useEditorStore'

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
  const selectedElementId = useEditorStore((s) => s.selectedElementId)
  const activeSlide = useActiveSlide()

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
  }, [theme])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return

      const meta = e.ctrlKey || e.metaKey

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
  }, [undo, redo, duplicateSlide, deleteSlide, deleteElement, selectedElementId, activeSlide])

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-neutral-100 dark:bg-neutral-950">
      <Toolbar />
      <div className="flex flex-1 overflow-hidden">
        <SlideList />
        <SlideCanvas />
        <PropertiesPanel />
      </div>
    </div>
  )
}
