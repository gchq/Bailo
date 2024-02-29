import { describe, expect, test } from 'vitest'

import { isBunyanLogGuard, Writer } from '../../src/services/v2/log.js'
import { longId } from '../../src/utils/v2/id.js'

describe('services > log', () => {
  test('isBunyanLogGuard > good', () => {
    const log = { level: 20, msg: 'hello', src: { file: 'a.ts', line: 12 } }
    expect(isBunyanLogGuard(log)).toBe(true)
  })

  test('isBunyanLogGuard > bad base', () => {
    const log = undefined
    expect(isBunyanLogGuard(log)).toBe(false)
  })

  test('isBunyanLogGuard > bad level', () => {
    const log = { level: undefined, msg: 'hello', src: { file: 'a.ts', line: 12 } }
    expect(isBunyanLogGuard(log)).toBe(false)
  })

  test('isBunyanLogGuard > bad message', () => {
    const log = { level: 20, msg: undefined, src: { file: 'a.ts', line: 12 } }
    expect(isBunyanLogGuard(log)).toBe(false)
  })

  test('isBunyanLogGuard > bad level', () => {
    const log = { level: 20, msg: 'hello', src: undefined }
    expect(isBunyanLogGuard(log)).toBe(false)
  })

  test('Writer', () => {
    const writer = new Writer({ basepath: '/base' })

    expect(writer.basepath).toBe('/base/')
  })

  test('Writer > getLevel', () => {
    expect(Writer.getLevel(10)).toContain('trace')
    expect(Writer.getLevel(20)).toContain('debug')
    expect(Writer.getLevel(30)).toContain('info')
    expect(Writer.getLevel(40)).toContain('warn')
    expect(Writer.getLevel(50)).toContain('error')
    expect(Writer.getLevel(60)).toContain('fatal')
    expect(Writer.getLevel(99)).toContain('99')
  })

  test('Writer > getSrc', () => {
    const writer = new Writer({ basepath: '/base' })

    expect(writer.getSrc({ file: '/base/a.ts', line: 10 })).toBe('a.ts:10')
    expect(writer.getSrc({ file: '/test/b.ts', line: 10 })).toBe('/test/b.ts:10')
    expect(writer.getSrc({ file: 'routes/middleware/expressLogger.ts', line: 10 })).toBe('express')
  })

  test('Writer > representValue', () => {
    expect(Writer.representValue({ test: true })).toBe('{ test: true }')
    expect(Writer.representValue(10)).toBe('10')
    expect(Writer.representValue(true)).toBe('true')
  })

  test('Writer > getAttributes', () => {
    expect(Writer.getAttributes({ name: 'ignore', user: 'ignore' })).toBe('')
    expect(Writer.getAttributes({ name: 'ignore', user: 'ignore', example: 'hello' })).toBe('example=hello')
    expect(Writer.getAttributes({ id: true, url: true, method: true, 'response-time': true, status: true })).toBe('')
    expect(Writer.getAttributes({ id: longId() })).toBe('')
  })

  test('Writer > write', () => {
    const writer = new Writer({ basepath: '/base' })

    // This log should not crash
    const log = { level: 20, msg: 'hello', src: { file: 'a.ts', line: 12 } }
    writer.write(log)

    // This log should crash
    expect(() => writer.write({})).toThrowError(/^Received unknown value to the log writer/)
  })
})
