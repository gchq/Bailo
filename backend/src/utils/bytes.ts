const units = ['B', 'kB', 'MB', 'GB', 'TB', 'PB'] as const

const unitMultipliers = new Map<string, number>([
  ...units.map((unit, index) => [unit.toLowerCase(), 1000 ** index] as const),
  ...units.slice(1).map((unit, index) => [`${unit[0].toLowerCase()}ib`, 1024 ** (index + 1)] as const),
])

// Accept only ordinary decimal notation with a unit; scientific and hexadecimal notation are intentionally excluded.
const bytesPattern = /^(0|[1-9]\d{0,15})(?:\.(\d{1,15}))?(B|kB|MB|GB|TB|PB|KiB|MiB|GiB|TiB|PiB)$/i

function exactByteValue(integerPart: string, fractionPart: string, multiplier: number): number | null {
  const value = (Number(`${integerPart}${fractionPart}`) * multiplier) / 10 ** fractionPart.length
  return Number.isFinite(value) && value <= Number.MAX_SAFE_INTEGER ? Math.floor(value) : null
}

export function formatBytes(value: number): string | null {
  if (!Number.isFinite(value)) {
    return null
  }

  const magnitude = Math.abs(value)
  let unitIndex = 0
  let scaled = magnitude
  while (unitIndex < units.length - 1 && scaled >= 999.995) {
    scaled /= 1000
    unitIndex++
  }

  const formatted = scaled.toFixed(2).replace(/(?:\.0*|(\.[^]+?)0+)$/, '$1')
  const sign = value < 0 && magnitude !== 0 ? '-' : ''

  return `${sign}${formatted}${units[unitIndex]}`
}

export function parseBytes(value: string | number): number | null {
  if (typeof value === 'number') {
    return Number.isSafeInteger(value) && value >= 0 ? value : null
  }

  const match = value.match(bytesPattern)
  const multiplier = match ? unitMultipliers.get(match[3].toLowerCase()) : undefined
  if (!match || multiplier === undefined) {
    return null
  }

  return exactByteValue(match[1], match[2] ?? '', multiplier)
}
