// @vitest-environment node

import { randomColour } from 'utils/colourUtils'
import { describe, expect, test } from 'vitest'

describe('colourUtils', () => {
  test('returns a deterministic hex colour for a seed', () => {
    expect(randomColour('Zebra', 'light')).toBe(randomColour('Zebra', 'light'))
    expect(randomColour('Zebra', 'light')).toMatch(/^#[0-9a-f]{6}$/)
    expect(randomColour('Zebra', 'light')).not.toBe(randomColour('Lion', 'light'))
  })

  test('changes lightness according to the requested luminosity', () => {
    const light = randomColour('Zebra', 'light')
    const dark = randomColour('Zebra', 'dark')

    expect(light).not.toBe(dark)
  })
})
