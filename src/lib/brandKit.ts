import type { CSSProperties } from 'react'
import type { BrandKit, LogoPosition } from '../types'
import { MAX_BRAND_COLORS, MAX_BRAND_FONTS } from '../types'

export function defaultBrandKit(): BrandKit {
  return {
    colors: ['#FF5A1F', '#111111', '#FFFFFF', '#2563EB', '#10B981'],
    fonts: ['Poppins', 'Inter'],
    logoSrc: null,
    logoPosition: 'bottom-right',
    logoSize: 72,
  }
}

export function addBrandColor(kit: BrandKit, color: string): BrandKit {
  if (kit.colors.length >= MAX_BRAND_COLORS) return kit
  if (kit.colors.includes(color)) return kit
  return { ...kit, colors: [...kit.colors, color] }
}

export function removeBrandColor(kit: BrandKit, index: number): BrandKit {
  return { ...kit, colors: kit.colors.filter((_, i) => i !== index) }
}

export function setBrandColor(kit: BrandKit, index: number, color: string): BrandKit {
  const colors = [...kit.colors]
  colors[index] = color
  return { ...kit, colors }
}

export function setBrandFont(kit: BrandKit, index: number, font: string): BrandKit {
  const fonts = [...kit.fonts]
  if (index >= MAX_BRAND_FONTS) return kit
  fonts[index] = font
  return { ...kit, fonts }
}

export function logoPositionStyle(
  position: LogoPosition,
  size: number,
  margin = 32,
): CSSProperties {
  const base: CSSProperties = {
    position: 'absolute',
    width: size,
    height: size,
    objectFit: 'contain',
    pointerEvents: 'none',
  }
  switch (position) {
    case 'top-left':
      return { ...base, top: margin, left: margin }
    case 'top-right':
      return { ...base, top: margin, right: margin }
    case 'bottom-left':
      return { ...base, bottom: margin, left: margin }
    case 'bottom-right':
      return { ...base, bottom: margin, right: margin }
    case 'none':
    default:
      return { ...base, display: 'none' }
  }
}

export const LOGO_POSITION_OPTIONS: { value: LogoPosition; label: string }[] = [
  { value: 'none', label: 'Hidden' },
  { value: 'top-left', label: 'Top left' },
  { value: 'top-right', label: 'Top right' },
  { value: 'bottom-left', label: 'Bottom left' },
  { value: 'bottom-right', label: 'Bottom right' },
]
