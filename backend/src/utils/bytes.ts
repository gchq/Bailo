const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'] as const

const unitMultipliers = new Map(units.map((unit, index) => [unit.toLowerCase(), 1024 ** index]))

export function formatBytes(value: number): string | null {
  if (!Number.isFinite(value)) {
    return null
  }

  const magnitude = Math.abs(value)
  const unitIndex = Math.min(Math.floor(Math.log2(Math.max(magnitude, 1)) / 10), units.length - 1)
  const formatted = (value / 1024 ** unitIndex).toFixed(2).replace(/(?:\.0*|(\.[^0]+)0+)$/, '$1')

  return `${formatted}${units[unitIndex]}`
}

export function parseBytes(value: number | string): number | null {
  if (typeof value === 'number') {
    return Number.isNaN(value) ? null : value
  }

  const match = value.match(/^((-|\+)?(\d+(?:\.\d+)?)) *(kb|mb|gb|tb|pb)$/i)
  const number = match ? Number.parseFloat(match[1]) : Number.parseInt(value, 10)
  const unit = match?.[4].toLowerCase() ?? 'b'
  const multiplier = unitMultipliers.get(unit)

  return Number.isNaN(number) || multiplier === undefined ? null : Math.floor(number * multiplier)
}
