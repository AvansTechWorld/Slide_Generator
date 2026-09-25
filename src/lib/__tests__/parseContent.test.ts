import { describe, expect, it } from 'vitest'
import { countText, parseContentWithFormat } from '../parseContent'
import { getTemplateLimits } from '../templates'

describe('countText', () => {
  it('counts words and characters in a simple sentence', () => {
    expect(countText('hello world')).toEqual({ words: 2, chars: 11 })
  })

  it('returns zero for an empty string', () => {
    expect(countText('')).toEqual({ words: 0, chars: 0 })
  })

  it('trims surrounding whitespace before counting', () => {
    expect(countText('  hi  ')).toEqual({ words: 1, chars: 2 })
  })

  it('counts a hyphenated word as one word', () => {
    expect(countText('a well-known issue')).toEqual({ words: 3, chars: 18 })
  })

  it('does not count punctuation-only tokens as words', () => {
    expect(countText('wait - really?')).toEqual({ words: 2, chars: 14 })
  })
})

describe('per-template limit flags', () => {
  const listicleLimits = getTemplateLimits('listicle')

  it('flags a 12-word headline on Listicle (limit 10) as over', () => {
    const headline = 'one two three four five six seven eight nine ten eleven twelve'
    const { words } = countText(headline)
    expect(words).toBe(12)
    expect(words > listicleLimits.headline.words).toBe(true)
  })

  it('does not flag an 8-word headline on Listicle as over', () => {
    const headline = 'one two three four five six seven eight'
    const { words } = countText(headline)
    expect(words).toBe(8)
    expect(words > listicleLimits.headline.words).toBe(false)
  })

  it('updates the over-limit flag when the template changes, without re-parsing', () => {
    const headline = 'one two three four five six seven eight nine' // 9 words
    const { words } = countText(headline)

    const quoteLimits = getTemplateLimits('quote-card') // 15 words allowed
    const statLimits = getTemplateLimits('stat-drop') // 6 words allowed

    expect(words > quoteLimits.headline.words).toBe(false)
    expect(words > statLimits.headline.words).toBe(true)
  })

  it('falls back to DEFAULT_LIMITS for a template with no seeded limits', () => {
    const unknown = getTemplateLimits('not-a-real-template-id')
    expect(unknown).toEqual({ headline: { words: 8, chars: 60 }, body: { words: 25, chars: 150 } })
  })
})

describe('parseContentWithFormat', () => {
  it('parses the standard --- separated format', () => {
    const slides = parseContentWithFormat('Headline one\nBody one\n---\nHeadline two\nBody two', 'standard')
    expect(slides).toHaveLength(2)
    expect(slides[0].headline).toBe('Headline one')
    expect(slides[1].body).toBe('Body two')
  })

  it('parses markdown headings into separate slides', () => {
    const slides = parseContentWithFormat('# Headline one\nBody one\n\n## Headline two\nBody two', 'markdown-headings')
    expect(slides).toHaveLength(2)
    expect(slides[0].headline).toBe('Headline one')
    expect(slides[1].headline).toBe('Headline two')
  })

  it('parses CSV rows and skips a header row', () => {
    const slides = parseContentWithFormat('headline,body\nHeadline one, Body one\nHeadline two, Body two', 'csv')
    expect(slides).toHaveLength(2)
    expect(slides[0].headline).toBe('Headline one')
    expect(slides[0].body).toBe('Body one')
  })

  it('parses a JSON array of slide objects', () => {
    const slides = parseContentWithFormat(
      JSON.stringify([
        { headline: 'Headline one', body: 'Body one' },
        { title: 'Headline two', text: 'Body two' },
      ]),
      'json',
    )
    expect(slides).toHaveLength(2)
    expect(slides[1].headline).toBe('Headline two')
    expect(slides[1].body).toBe('Body two')
  })

  it('throws a helpful error for malformed JSON', () => {
    expect(() => parseContentWithFormat('{not valid json', 'json')).toThrow(/could not parse json/i)
  })
})
