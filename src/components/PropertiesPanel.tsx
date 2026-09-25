import { useEffect } from 'react'
import type { ChangeEvent, ReactNode } from 'react'
import { useActiveSlide, useEditorStore, useSelectedElement } from '../store/useEditorStore'
import type { BackgroundFit, FontWeight, LogoPosition, TextAlign } from '../types'
import { FONT_OPTIONS, MAX_BRAND_COLORS, MAX_BRAND_FONTS, MAX_SLIDES } from '../types'
import { LOGO_POSITION_OPTIONS } from '../lib/brandKit'
import { ICONS } from '../lib/icons'
import { computeAutoFit } from '../lib/autoFit'
import type { TextElement } from '../types'

function getOverflowFlag(element: TextElement): boolean {
  if (!element.autoFit) return false
  const fit = computeAutoFit(
    element.content,
    element.style.fontFamily,
    element.style.fontSize,
    element.style.lineHeight,
    element.style.fontWeight,
    element.style.padding,
    element.rect.width,
    element.rect.height,
  )
  return fit.overflowing
}

function ApplyToAllButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-1 self-start rounded-md border border-dashed border-neutral-300 px-2 py-1 text-[11px] font-semibold text-neutral-500 hover:border-accent hover:text-accent dark:border-neutral-700"
    >
      Apply to all slides
    </button>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-b border-neutral-200 px-4 py-4 dark:border-neutral-800">
      <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-neutral-400">{title}</h3>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-neutral-600 dark:text-neutral-300">
      {label}
      {children}
    </label>
  )
}

function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
}) {
  return (
    <input
      type="number"
      value={Number.isFinite(value) ? value : 0}
      min={min}
      max={max}
      step={step}
      onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(Number(e.target.value))}
      className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-800"
    />
  )
}

function RangeInput({
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step?: number
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(Number(e.target.value))}
        className="w-full accent-accent"
      />
      <span className="w-10 text-right text-[11px] tabular-nums text-neutral-500">{value}</span>
    </div>
  )
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        className="h-8 w-8 cursor-pointer rounded border border-neutral-300 bg-transparent dark:border-neutral-700"
      />
      <input
        type="text"
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-800"
      />
    </div>
  )
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <select
      value={value}
      onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
      className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-800"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}

function AlignRow({ value, onChange }: { value: TextAlign; onChange: (v: TextAlign) => void }) {
  const options: TextAlign[] = ['left', 'center', 'right']
  return (
    <div className="flex gap-1">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`flex-1 rounded-md border px-2 py-1.5 text-xs font-semibold capitalize transition ${
            value === opt
              ? 'border-accent bg-accent/10 text-accent'
              : 'border-neutral-300 text-neutral-500 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

function ElementProperties() {
  const slide = useActiveSlide()
  const element = useSelectedElement()
  const updateTextContent = useEditorStore((s) => s.updateTextContent)
  const updateTextStyle = useEditorStore((s) => s.updateTextStyle)
  const updateTextAutoFit = useEditorStore((s) => s.updateTextAutoFit)
  const updateImageProps = useEditorStore((s) => s.updateImageProps)
  const updateIconProps = useEditorStore((s) => s.updateIconProps)
  const deleteElement = useEditorStore((s) => s.deleteElement)
  const applyToAllSlides = useEditorStore((s) => s.applyToAllSlides)

  if (!slide || !element) return null

  const fontOptions = FONT_OPTIONS.map((f) => ({ value: f, label: f }))
  const weightOptions: { value: string; label: string }[] = [
    { value: '400', label: 'Regular' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semibold' },
    { value: '700', label: 'Bold' },
    { value: '800', label: 'Extrabold' },
    { value: '900', label: 'Black' },
  ]

  if (element.kind === 'icon') {
    return (
      <Section title="Icon">
        <Field label="Recolor">
          <ColorInput value={element.color} onChange={(v) => updateIconProps(slide.id, element.id, { color: v })} />
        </Field>
        <ApplyToAllButton onClick={() => applyToAllSlides('accentColor', element.color)} />
        <Field label="Swap icon">
          <div className="grid grid-cols-6 gap-1.5 rounded-md border border-neutral-200 p-2 dark:border-neutral-700">
            {ICONS.map((icon) => (
              <button
                key={icon.id}
                type="button"
                title={icon.label}
                onClick={() => updateIconProps(slide.id, element.id, { iconId: icon.id })}
                className={`flex h-8 w-8 items-center justify-center rounded-md border transition ${
                  element.iconId === icon.id
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-transparent text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
                dangerouslySetInnerHTML={{
                  __html: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8">${icon.svg}</svg>`,
                }}
              />
            ))}
          </div>
        </Field>
        <button
          type="button"
          onClick={() => deleteElement(slide.id, element.id)}
          className="mt-1 rounded-md border border-red-200 px-2 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
        >
          Delete element
        </button>
      </Section>
    )
  }

  return (
    <Section title={element.kind === 'text' ? `Text — ${element.role}` : 'Image'}>
      {element.kind === 'text' ? (
        <>
          <Field label="Content">
            <textarea
              value={element.content}
              onChange={(e) => updateTextContent(slide.id, element.id, e.target.value)}
              rows={4}
              placeholder={'Supports **bold**, *italic*, `code`, - bullets, 1. numbers'}
              className="resize-none rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-800"
            />
          </Field>
          <label className="flex items-center gap-2 text-xs font-medium text-neutral-600 dark:text-neutral-300">
            <input
              type="checkbox"
              checked={element.autoFit}
              onChange={(e) => updateTextAutoFit(slide.id, element.id, e.target.checked)}
            />
            Auto-fit text to box
            {getOverflowFlag(element) && (
              <span className="text-[11px] font-semibold text-red-500">— still overflowing, shorten text</span>
            )}
          </label>
          <Field label="Font family">
            <Select
              value={element.style.fontFamily}
              onChange={(v) => updateTextStyle(slide.id, element.id, { fontFamily: v })}
              options={fontOptions}
            />
          </Field>
          <ApplyToAllButton onClick={() => applyToAllSlides('font', element.style.fontFamily)} />
          <div className="grid grid-cols-2 gap-2">
            <Field label="Size">
              <NumberInput
                value={element.style.fontSize}
                min={8}
                max={300}
                onChange={(v) => updateTextStyle(slide.id, element.id, { fontSize: v })}
              />
            </Field>
            <Field label="Weight">
              <Select
                value={String(element.style.fontWeight)}
                onChange={(v) => updateTextStyle(slide.id, element.id, { fontWeight: Number(v) as FontWeight })}
                options={weightOptions}
              />
            </Field>
          </div>
          <Field label="Color">
            <ColorInput value={element.style.color} onChange={(v) => updateTextStyle(slide.id, element.id, { color: v })} />
          </Field>
          {(element.role === 'cta' || element.role === 'slideNumber') && (
            <ApplyToAllButton onClick={() => applyToAllSlides('accentColor', element.style.color)} />
          )}
          <Field label="Alignment">
            <AlignRow value={element.style.align} onChange={(v) => updateTextStyle(slide.id, element.id, { align: v })} />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Line height">
              <NumberInput
                value={element.style.lineHeight}
                min={0.8}
                max={3}
                step={0.05}
                onChange={(v) => updateTextStyle(slide.id, element.id, { lineHeight: v })}
              />
            </Field>
            <Field label="Letter spacing">
              <NumberInput
                value={element.style.letterSpacing}
                min={-5}
                max={40}
                step={0.5}
                onChange={(v) => updateTextStyle(slide.id, element.id, { letterSpacing: v })}
              />
            </Field>
          </div>
          <Field label="Text background">
            <ColorInput
              value={element.style.backgroundColor}
              onChange={(v) => updateTextStyle(slide.id, element.id, { backgroundColor: v })}
            />
          </Field>
          <Field label="Background opacity">
            <RangeInput
              value={element.style.backgroundOpacity}
              min={0}
              max={1}
              step={0.05}
              onChange={(v) => updateTextStyle(slide.id, element.id, { backgroundOpacity: v })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Padding">
              <NumberInput
                value={element.style.padding}
                min={0}
                max={120}
                onChange={(v) => updateTextStyle(slide.id, element.id, { padding: v })}
              />
            </Field>
            <Field label="Corner radius">
              <NumberInput
                value={element.style.borderRadius}
                min={0}
                max={200}
                onChange={(v) => updateTextStyle(slide.id, element.id, { borderRadius: v })}
              />
            </Field>
          </div>
        </>
      ) : (
        <>
          <Field label="Image">
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                const dataUrl = await readFileAsDataUrl(file)
                updateImageProps(slide.id, element.id, { src: dataUrl })
              }}
              className="text-xs"
            />
          </Field>
          <Field label="Fit">
            <Select
              value={element.fit}
              onChange={(v) => updateImageProps(slide.id, element.id, { fit: v as BackgroundFit })}
              options={[
                { value: 'cover', label: 'Cover' },
                { value: 'contain', label: 'Contain' },
              ]}
            />
          </Field>
          <Field label="Opacity">
            <RangeInput
              value={element.opacity}
              min={0}
              max={1}
              step={0.05}
              onChange={(v) => updateImageProps(slide.id, element.id, { opacity: v })}
            />
          </Field>
          <Field label="Corner radius">
            <NumberInput
              value={element.borderRadius}
              min={0}
              max={200}
              onChange={(v) => updateImageProps(slide.id, element.id, { borderRadius: v })}
            />
          </Field>
        </>
      )}

      <button
        type="button"
        onClick={() => deleteElement(slide.id, element.id)}
        className="mt-1 rounded-md border border-red-200 px-2 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
      >
        Delete element
      </button>
    </Section>
  )
}

function BackgroundProperties() {
  const slide = useActiveSlide()
  const updateBackground = useEditorStore((s) => s.updateBackground)
  const applyToAllSlides = useEditorStore((s) => s.applyToAllSlides)
  if (!slide) return null
  const bg = slide.background

  return (
    <Section title="Background">
      <Field label="Type">
        <Select
          value={bg.type}
          onChange={(v) => updateBackground(slide.id, { type: v as typeof bg.type })}
          options={[
            { value: 'solid', label: 'Solid color' },
            { value: 'gradient', label: 'Gradient' },
            { value: 'image', label: 'Image' },
          ]}
        />
      </Field>
      <ApplyToAllButton onClick={() => applyToAllSlides('backgroundType', bg.type)} />

      {bg.type === 'solid' && (
        <Field label="Color">
          <ColorInput value={bg.color} onChange={(v) => updateBackground(slide.id, { color: v })} />
        </Field>
      )}

      {bg.type === 'gradient' && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Field label="From">
              <ColorInput value={bg.gradientFrom} onChange={(v) => updateBackground(slide.id, { gradientFrom: v })} />
            </Field>
            <Field label="To">
              <ColorInput value={bg.gradientTo} onChange={(v) => updateBackground(slide.id, { gradientTo: v })} />
            </Field>
          </div>
          <Field label="Angle">
            <RangeInput
              value={bg.gradientAngle}
              min={0}
              max={360}
              onChange={(v) => updateBackground(slide.id, { gradientAngle: v })}
            />
          </Field>
        </>
      )}

      {bg.type === 'image' && (
        <>
          <Field label="Upload image">
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                const dataUrl = await readFileAsDataUrl(file)
                updateBackground(slide.id, { imageSrc: dataUrl })
              }}
              className="text-xs"
            />
          </Field>
          <Field label="Fit">
            <Select
              value={bg.imageFit}
              onChange={(v) => updateBackground(slide.id, { imageFit: v as BackgroundFit })}
              options={[
                { value: 'cover', label: 'Cover' },
                { value: 'contain', label: 'Contain' },
              ]}
            />
          </Field>
          <Field label="Opacity">
            <RangeInput
              value={bg.imageOpacity}
              min={0}
              max={1}
              step={0.05}
              onChange={(v) => updateBackground(slide.id, { imageOpacity: v })}
            />
          </Field>
        </>
      )}

      <Field label="Overlay tint">
        <ColorInput value={bg.overlayColor} onChange={(v) => updateBackground(slide.id, { overlayColor: v })} />
      </Field>
      <Field label="Overlay opacity">
        <RangeInput
          value={bg.overlayOpacity}
          min={0}
          max={1}
          step={0.05}
          onChange={(v) => updateBackground(slide.id, { overlayOpacity: v })}
        />
      </Field>
    </Section>
  )
}

function BrandKitProperties() {
  const brandKit = useEditorStore((s) => s.brandKit)
  const setBrandColorAt = useEditorStore((s) => s.setBrandColorAt)
  const addBrandColorValue = useEditorStore((s) => s.addBrandColorValue)
  const removeBrandColorAt = useEditorStore((s) => s.removeBrandColorAt)
  const setBrandFontAt = useEditorStore((s) => s.setBrandFontAt)
  const setLogo = useEditorStore((s) => s.setLogo)
  const setLogoPosition = useEditorStore((s) => s.setLogoPosition)
  const setLogoSize = useEditorStore((s) => s.setLogoSize)
  const applyToAllSlides = useEditorStore((s) => s.applyToAllSlides)

  const fontOptions = FONT_OPTIONS.map((f) => ({ value: f, label: f }))

  return (
    <Section title="Brand kit">
      <Field label={`Colors (${brandKit.colors.length}/${MAX_BRAND_COLORS})`}>
        <div className="flex flex-col gap-2">
          {brandKit.colors.map((color, i) => (
            <div key={i} className="flex items-center gap-2">
              <ColorInput value={color} onChange={(v) => setBrandColorAt(i, v)} />
              <button
                type="button"
                onClick={() => removeBrandColorAt(i)}
                className="rounded px-1.5 text-xs text-neutral-400 hover:text-red-500"
              >
                ✕
              </button>
            </div>
          ))}
          {brandKit.colors.length < MAX_BRAND_COLORS && (
            <button
              type="button"
              onClick={() => addBrandColorValue('#888888')}
              className="rounded-md border border-dashed border-neutral-300 px-2 py-1.5 text-xs font-semibold text-neutral-500 hover:border-accent hover:text-accent dark:border-neutral-700"
            >
              + Add color
            </button>
          )}
        </div>
      </Field>

      {Array.from({ length: MAX_BRAND_FONTS }).map((_, i) => (
        <Field key={i} label={`Font ${i + 1}`}>
          <Select
            value={brandKit.fonts[i] ?? FONT_OPTIONS[0]}
            onChange={(v) => setBrandFontAt(i, v)}
            options={fontOptions}
          />
        </Field>
      ))}

      <Field label="Logo">
        <input
          type="file"
          accept="image/*"
          onChange={async (e) => {
            const file = e.target.files?.[0]
            if (!file) return
            const dataUrl = await readFileAsDataUrl(file)
            setLogo(dataUrl)
          }}
          className="text-xs"
        />
      </Field>
      {brandKit.logoSrc && (
        <>
          <Field label="Logo position">
            <Select
              value={brandKit.logoPosition}
              onChange={(v) => setLogoPosition(v as LogoPosition)}
              options={LOGO_POSITION_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            />
          </Field>
          <ApplyToAllButton onClick={() => applyToAllSlides('logoPosition', brandKit.logoPosition)} />
          <Field label="Logo size">
            <RangeInput value={brandKit.logoSize} min={24} max={200} onChange={setLogoSize} />
          </Field>
          <button
            type="button"
            onClick={() => setLogo(null)}
            className="rounded-md border border-neutral-300 px-2 py-1.5 text-xs font-semibold text-neutral-500 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            Remove logo
          </button>
        </>
      )}
    </Section>
  )
}

function Toast() {
  const lastToast = useEditorStore((s) => s.lastToast)
  const clearToast = useEditorStore((s) => s.clearToast)

  useEffectToast(lastToast, clearToast)

  if (!lastToast) return null

  return (
    <div className="toast-pop fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-neutral-900 px-4 py-2 text-xs font-semibold text-white shadow-panel dark:bg-cyber-panel">
      {lastToast}
    </div>
  )
}

function useEffectToast(lastToast: string | null, clearToast: () => void) {
  useEffect(() => {
    if (!lastToast) return
    const id = window.setTimeout(clearToast, 2200)
    return () => window.clearTimeout(id)
  }, [lastToast, clearToast])
}

export default function PropertiesPanel() {
  const slides = useEditorStore((s) => s.slides)

  return (
    <aside className="scrollbar-thin flex w-72 shrink-0 flex-col overflow-y-auto border-l border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
      <ElementProperties />
      <BackgroundProperties />
      <BrandKitProperties />
      <div className="px-4 py-3 text-[11px] text-neutral-400">
        {slides.length}/{MAX_SLIDES} slides used
      </div>
      <Toast />
    </aside>
  )
}
