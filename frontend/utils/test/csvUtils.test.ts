import { toCsvString } from 'utils/csvUtils'
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

  it('escapes empty values', () => {
    const result = toCsvString(['col'], [['']])

    expect(result).toBe('col\r\n')
  })

  it('escapes values containing carriage return(s)', () => {
    const result = toCsvString(['text'], [['line1\rline2']])

    expect(result).toBe('text\r\n"line1\rline2"')
  })

  it('prevents spreadsheet formula injection', () => {
    const result = toCsvString(
      ['formula'],
      [['=1+1'], ['+1+1'], ['-1+1'], ['@SUM(A1:A2)'], ['=HYPERLINK("https://malicious.site")']],
    )

    expect(result).toBe(
      ['formula', "'=1+1", "'+1+1", "'-1+1", "'@SUM(A1:A2)", `"'=HYPERLINK(""https://malicious.site"")"`].join('\r\n'),
    )
  })

  it('handles empty datasets', () => {
    expect(toCsvString([], [])).toBe('')
    expect(toCsvString(['a', 'b'], [])).toBe('a,b')
  })

  it('handles embedded quotes and commas together', () => {
    const result = toCsvString(['text'], [['He said, "hello"']])

    expect(result).toBe('text\r\n"He said, ""hello"""')
  })
})
