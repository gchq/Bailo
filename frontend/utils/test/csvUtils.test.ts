import { toCsvString } from 'utils/csvUtilts'
import { expect } from 'vitest'

describe('toCsvString', () => {
  it('creates CSV output with headers and rows', () => {
    const result = toCsvString(
      ['name', 'age'],
      [
        ['Alice', '30'],
        ['Bob', '25'],
      ],
    )

    expect(result).toBe('name,age\r\nAlice,30\r\nBob,25')
  })

  it('escapes fields containing commas, quotes, and newlines', () => {
    const result = toCsvString(['text'], [['hello,world'], ['say "hi"'], ['line1\nline2']])

    expect(result).toBe('text\r\n"hello,world"\r\n"say ""hi"""\r\n"line1\nline2"')
  })
})
