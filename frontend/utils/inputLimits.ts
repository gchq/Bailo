export const TEXT_INPUT_MAX_LENGTH = 100000

/**
 * Truncates text to `maxLength`. Existing values already over the limit are never cut, they just cannot grow.
 */
export function limitText(value: string, maxLength: number, previousValue = ''): string {
  return value.slice(0, Math.max(maxLength, previousValue.length))
}
