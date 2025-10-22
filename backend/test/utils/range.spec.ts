import { beforeEach, describe, expect, it, vi } from 'vitest'

import { parseRangeHeaders } from '../../src/utils/range.js'

const maxSize = 1000
let res: any

describe('utils > range', () => {
  beforeEach(() => {
    res = {
      set: vi.fn(),
    }
  })

  function createReq(rangeResult: any, rangeHeader?: string) {
    return {
      range: vi.fn().mockReturnValue(rangeResult),
      headers: { range: rangeHeader },
    }
  }

  it('parseRangeHeaders returns undefined and sets Content-Length if no range given', () => {
    const req = createReq(undefined)
    expect(parseRangeHeaders(req as any, res as any, maxSize)).toBeUndefined()
    expect(res.set).toHaveBeenCalledWith('Content-Length', String(maxSize))
  })

  it('throws UnsatisfiableRange and sets Content-Range for unsatisfiable', () => {
    const req = createReq(-1, 'bytes=12345679000000-')
    expect(() => parseRangeHeaders(req as any, res as any, maxSize)).toThrowError(/Unsatisfiable range/)
    expect(res.set).toHaveBeenCalledWith('Content-Range', `bytes */${maxSize}`)
  })

  it('throws BadReq for malformed range', () => {
    const req = createReq(-2, 'justIncorrect<1>2')
    expect(() => parseRangeHeaders(req as any, res as any, maxSize)).toThrowError(/Malformed range header/)
  })

  it('throws NotImplemented if multiple ranges', () => {
    const ranges = [
      { start: 0, end: 10 },
      { start: 20, end: 30 },
    ] as any
    ranges.type = 'bytes'
    const req = {
      range: vi.fn().mockReturnValue(ranges),
      headers: { range: 'bytes=0-10,20-30' },
    }
    expect(() => parseRangeHeaders(req as any, res as any, maxSize)).toThrow(/Only a single range is supported/)
  })

  it('throws NotImplemented for non-byte range', () => {
    const ranges = [{ start: 0, end: 10 }] as any
    ranges.type = 'somethingElse'
    const req = {
      range: vi.fn().mockReturnValue(ranges),
      headers: { range: 'somethingElse=0-10' },
    }
    expect(() => parseRangeHeaders(req as any, res as any, maxSize)).toThrowError(/Only byte ranges are supported/)
  })

  it('returns correct start/end and sets headers for valid range bytes=0-', () => {
    const ranges = [{ start: 0, end: 999 }] as any
    ranges.type = 'bytes'
    const req = {
      range: vi.fn().mockReturnValue(ranges),
      headers: { range: 'bytes=0-' },
    }
    const result = parseRangeHeaders(req as any, res as any, maxSize)
    expect(result).toEqual({ start: 0, end: 999 })
    expect(res.set).toHaveBeenCalledWith('Content-Length', '1000')
    expect(res.set).toHaveBeenCalledWith('Content-Range', 'bytes 0-999/1000')
  })

  it('returns correct headers for bytes=123-999', () => {
    const ranges = [{ start: 123, end: 999 }] as any
    ranges.type = 'bytes'
    const req = {
      range: vi.fn().mockReturnValue(ranges),
      headers: { range: 'bytes=123-999' },
    }
    const result = parseRangeHeaders(req as any, res as any, maxSize)
    expect(result).toEqual({ start: 123, end: 999 })
    expect(res.set).toHaveBeenCalledWith('Content-Length', String(999 - 123 + 1))
    expect(res.set).toHaveBeenCalledWith('Content-Range', 'bytes 123-999/1000')
  })
})
