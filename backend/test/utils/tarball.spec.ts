import { PassThrough } from 'stream'
import { describe, expect, test, vi } from 'vitest'

import {
  createTarGzStreams,
  createUnTarGzStreams,
  extractTarGzStream,
  pipeStreamToTarEntry,
} from '../../src/utils/tarball.js'
import { MockReadable, MockWritable } from '../testUtils/streams.js'

const zlibMocks = vi.hoisted(() => ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  createGunzip: vi.fn((options) => {
    return new MockReadable()
  }),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  createGzip: vi.fn((options) => {
    return new MockReadable()
  }),
  constants: { Z_BEST_SPEED: 1 },
}))
vi.mock('node:zlib', () => ({ default: zlibMocks }))

const mockTarStream = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  entry: vi.fn(({ name, size }) => {
    return new MockWritable()
  }),
  pipe: vi.fn().mockReturnThis(),
  finalize: vi.fn(),
}
const tarMocks = vi.hoisted(() => ({
  extract: vi.fn(() => new MockReadable()),
  pack: vi.fn(() => mockTarStream),
  constants: { Z_BEST_SPEED: 1 },
}))
vi.mock('tar-stream', () => tarMocks)

describe('utils > tarball', () => {
  test('createTarGzStreams > success', () => {
    const out = createTarGzStreams()

    expect(zlibMocks.createGzip).toHaveBeenCalledWith({
      chunkSize: 16 * 1024 * 1024,
      level: tarMocks.constants.Z_BEST_SPEED,
    })
    expect(tarMocks.pack).toHaveBeenCalled()
    expect(out).toMatchSnapshot()
  })

  test('createUnTarGzStreams > success', () => {
    const out = createUnTarGzStreams()

    expect(zlibMocks.createGunzip).toHaveBeenCalledWith({ chunkSize: 16 * 1024 * 1024 })
    expect(tarMocks.extract).toHaveBeenCalled()
    expect(out).toMatchSnapshot()
  })

  test('extractTarGzStream > finish event', async () => {
    const untarStream = new PassThrough()
    tarMocks.extract.mockReturnValue(untarStream)
    const entryListener = vi.fn((_header, _stream, next) => next())
    setImmediate(() => {
      untarStream.emit('finish')
    })

    const result = await extractTarGzStream(new PassThrough(), entryListener)

    expect(result).toBe('ok')
    // Confirm wiring (entry listener attached)
    expect(untarStream.listenerCount('entry')).toBeGreaterThan(0)
  })

  test('extractTarGzStream > entry event', async () => {
    const untarStream = new PassThrough()
    tarMocks.extract.mockReturnValue(untarStream)
    const entryListener = vi.fn((_header, _stream, next) => next())
    setImmediate(() => {
      untarStream.emit('entry', { name: 'test' }, new PassThrough(), () => {})
      untarStream.emit('finish')
      untarStream.end()
    })

    const result = await extractTarGzStream(new PassThrough(), entryListener)

    expect(result).toBe('ok')
    expect(entryListener).toHaveBeenCalled()
    expect(entryListener.mock.calls[0][0]).toEqual({ name: 'test' })
  })

  test('extractTarGzStream > error event', async () => {
    const untarStream = new PassThrough()
    tarMocks.extract.mockReturnValue(untarStream)
    const entryListener = vi.fn((_header, _stream, next) => next())
    const errorListener = vi.fn((_err, _resolve, reject) => reject('fail'))
    setImmediate(() => {
      untarStream.emit('error', new Error('error'))
    })

    const promise = extractTarGzStream(new PassThrough(), entryListener, errorListener)

    await expect(promise).rejects.toThrowError('fail')
    expect(errorListener).toHaveBeenCalled()
  })

  test('pipeStreamToTarEntry > success', async () => {
    const inputStream = new MockReadable()
    const tarEntry = new MockWritable()
    setImmediate(() => {
      tarEntry.emit('finish')
    })

    const promise = pipeStreamToTarEntry(inputStream, tarEntry, { test: 'data' })

    const result = await promise
    expect(result).toBe('ok')
  })

  test('pipeStreamToTarEntry > inputStream error', async () => {
    const inputStream = new MockReadable()
    const tarEntry = new MockWritable()
    setImmediate(() => {
      inputStream.emit('error', new Error('input stream error'))
    })

    const promise = pipeStreamToTarEntry(inputStream, tarEntry, { test: 'errorInput' })

    await expect(promise).rejects.toThrow('Stream error during tar operation')
  })

  test('pipeStreamToTarEntry > tarEntry error', async () => {
    const inputStream = new MockReadable()
    const tarEntry = new MockWritable()
    setImmediate(() => {
      tarEntry.emit('error', new Error('input stream error'))
    })

    const promise = pipeStreamToTarEntry(inputStream, tarEntry, { test: 'errorPacker' })

    await expect(promise).rejects.toThrow('Stream error during tar operation')
  })
})
