type Luminosity = 'light' | 'dark'

export const randomColour = (seed: string, luminosity: Luminosity): string => {
  let hash = 0
  for (const character of seed) {
    hash = (hash * 31 + character.charCodeAt(0)) | 0
  }

  const hue = Math.abs(hash) % 360
  const saturation = 55 + (Math.abs(hash >> 8) % 25)
  const lightness = luminosity === 'dark' ? 25 + (Math.abs(hash >> 16) % 15) : 65 + (Math.abs(hash >> 16) % 15)

  const channel = (value: number) => {
    const k = (value + hue / 30) % 12
    const colour = (saturation / 100) * Math.min(lightness / 100, 1 - lightness / 100)
    return Math.round(255 * (lightness / 100 - colour * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)))))
      .toString(16)
      .padStart(2, '0')
  }

  return `#${channel(0)}${channel(8)}${channel(4)}`
}
