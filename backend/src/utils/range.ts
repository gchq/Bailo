import { Request, Response } from 'express'

import { BadReq, NotImplemented, UnsatisfiableRange } from './error.js'

/**
 * Handles a request that may contain a range of bytes to get for an object.
 *
 * If the header is present and valid, and defines exactly one range (which can be any valid byte-range, examples below), then
 * those range limits will be returned.
 *
 * Examples (where maxSize is assumed to be 1000):
 * - bytes=0- <= will return start: 0, end: 999
 * - bytes=123-999 <= will return start: 123, end: 999
 * - bytes=12345679000000- <= will throw UnsatisfiableRange
 * - bytes=123-1000 <= will throw UnsatisfiableRange
 * - bytes=1111- <= will throw UnsatisfiableRange
 * - somethingElse=0-1 <= will throw NotImplemented
 * - justIncorrect<1>2 <= will throw BadReq
 *
 * @see {@link Request.range}
 *
 * @param req containing optional range headers
 * @param res to set response headers on, if appropriate
 * @param maxSize of the object
 * @throws UnsatisfiableRange (416) if the ranges are invalid (e.g. over the max size)
 * @throws BadReq (400) if the range header is just poorly formed
 * @throws NotImplemented (501) if multiple ranges or non-byte ranges are requested
 * @returns undefined if no range was provided, or an object containing the start/end positions (inclusive) to retrieve
 */
export function parseRangeHeaders(
  req: Request,
  res: Response,
  maxSize: number,
): undefined | { start: number; end: number } {
  const ranges = req.range(maxSize)
  const rangeHeader = req.headers.range

  if (!ranges) {
    res.set('Content-Length', String(maxSize))
    return
  }
  if (ranges === -1) {
    res.set('Content-Range', `bytes */${maxSize}`)
    throw UnsatisfiableRange('Unsatisfiable range', { rangeHeader, maxSize: maxSize })
  }
  if (ranges === -2) {
    throw BadReq('Malformed range header', { rangeHeader })
  }
  if (ranges.length > 1) {
    throw NotImplemented('Only a single range is supported', { rangeHeader })
  }
  if (ranges.type !== 'bytes') {
    throw NotImplemented('Only byte ranges are supported', { rangeHeader })
  }
  const { start, end } = ranges[0]
  const length = 1 + end - start
  res.set('Content-Length', String(length))
  res.set('Content-Range', `bytes ${start}-${end}/${maxSize}`)
  return { start, end }
}
