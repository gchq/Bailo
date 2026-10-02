import { PassThrough, Readable } from 'node:stream'

import { describe, expect, test, vi } from 'vitest'

import { sendEvents } from '../../src/clients/stroom.js'

const fetchMock = vi.hoisted(() => ({
  default: vi.fn(),
}))
vi.mock('node-fetch', async () => fetchMock)

const fsMock = vi.hoisted(() => ({
  readFile: vi.fn(),
}))
vi.mock('fs/promises', async () => ({ default: fsMock }))

const httpService = vi.hoisted(() => ({
  getHttpsAgent: vi.fn(),
}))
vi.mock('../../src/services/http.js', async () => httpService)

const zlibMock = vi.hoisted(() => ({
  createGzip: vi.fn(() => new PassThrough()),
}))
vi.mock('node:zlib', () => ({ default: zlibMock }))

let requestBody: Readable
// Stub the next `fetch` call and capture the request body
function mockFetchResponse(ok: boolean, body: string) {
  fetchMock.default.mockImplementationOnce((_url: string, init: { body: Readable }) => {
    requestBody = init.body
    return { ok, text: async () => body }
  })
}

// Read the captured request body back into the text that was sent
async function readRequestBody() {
  let body = ''
  for await (const chunk of requestBody) {
    body += chunk
  }
  return body
}

describe('clients > stroom', () => {
  const events =
    '<?xml version="1.0"?><Events><Event><EventDetail><TypeId>ViewUserToken</TypeId></EventDetail></Event></Events>'

  test('sendEvents > success', async () => {
    mockFetchResponse(true, 'success')

    const resp = await sendEvents(Readable.from(events))

    expect(resp).toBe('success')
    expect(await readRequestBody()).toBe(events)
    expect(zlibMock.createGzip).toHaveBeenCalled()
    expect(fetchMock.default.mock.lastCall?.[1].headers).toEqual({ 'Content-Encoding': 'gzip' })
  })

  test('sendEvents > sends every chunk of a multi-chunk stream', async () => {
    mockFetchResponse(true, 'success')

    await sendEvents(Readable.from(['<Events>', '<Event/>', '</Events>']))

    expect(await readRequestBody()).toBe('<Events><Event/></Events>')
  })

  test('sendEvents > bad 200 response', async () => {
    mockFetchResponse(false, 'bad')

    const resp = sendEvents(Readable.from(events))

    await expect(resp).rejects.toThrow('Failed to send logs to STROOM - Non-200 response')
  })

  test('sendEvents > rejects with the original error when the source stream fails', async () => {
    mockFetchResponse(true, 'success')
    const failingStream = new Readable({
      read() {
        this.destroy(new Error('stream exploded'))
      },
    })

    const resp = sendEvents(failingStream)

    await expect(resp).rejects.toThrow('stream exploded')
  })
})
