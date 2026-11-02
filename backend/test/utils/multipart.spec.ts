import { Readable } from 'node:stream'

import { describe, expect, test } from 'vitest'

import { createMultipartFileUpload } from '../../src/utils/multipart.js'

async function readBody(body: AsyncIterable<Buffer>) {
  const chunks: Buffer[] = []
  for await (const chunk of body) {
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

// Parse the body with the built-in multipart parser to confirm it is valid `multipart/form-data`
async function parseUpload(upload: ReturnType<typeof createMultipartFileUpload>) {
  const response = new Response(await readBody(upload.body), { headers: { 'content-type': upload.contentType } })
  // Deprecated for parsing untrusted server uploads, but fine for checking our own output in a test
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  return await response.formData()
}

describe('utils > multipart', () => {
  test('createMultipartFileUpload > streams every chunk between the part header and closing boundary', async () => {
    const upload = createMultipartFileUpload('in_file', 'model.bin', Readable.from(['abc', Buffer.from('def')]))
    const boundary = upload.contentType.match(/^multipart\/form-data; boundary=(\S+)$/)?.[1]

    expect(boundary).toBeDefined()
    expect((await readBody(upload.body)).toString()).toBe(
      `--${boundary}\r\n` +
        'Content-Disposition: form-data; name="in_file"; filename="model.bin"\r\n' +
        'Content-Type: application/octet-stream\r\n' +
        '\r\n' +
        'abcdef' +
        `\r\n--${boundary}--\r\n`,
    )
  })

  test('createMultipartFileUpload > is parsed by the built-in multipart parser', async () => {
    const upload = createMultipartFileUpload('in_file', 'model.bin', Readable.from(['hello ', 'world']), 'text/plain')

    const file = (await parseUpload(upload)).get('in_file') as File

    expect(file.name).toBe('model.bin')
    expect(file.type).toBe('text/plain')
    expect(await file.text()).toBe('hello world')
  })

  test('createMultipartFileUpload > keeps binary data intact', async () => {
    const bytes = Buffer.from([0x00, 0xff, 0x0d, 0x0a, 0x2d, 0x2d, 0x80])
    const upload = createMultipartFileUpload('in_file', 'model.bin', Readable.from([bytes]))

    const file = (await parseUpload(upload)).get('in_file') as File

    expect(Buffer.from(await file.arrayBuffer())).toEqual(bytes)
  })

  test('createMultipartFileUpload > empty stream', async () => {
    const upload = createMultipartFileUpload('in_file', 'empty.bin', Readable.from([]))

    const file = (await parseUpload(upload)).get('in_file') as File

    expect(file.size).toBe(0)
  })

  test('createMultipartFileUpload > escapes quotes and newlines in the field and file names', async () => {
    const upload = createMultipartFileUpload('in"field', 'a"b\r\nc.bin', Readable.from([]))

    const body = (await readBody(upload.body)).toString()

    expect(body).toContain('name="in%22field"; filename="a%22b%0D%0Ac.bin"')
    expect(body.split('\r\n')).toHaveLength(7)
  })

  test('createMultipartFileUpload > uses a new boundary for each upload', () => {
    const first = createMultipartFileUpload('in_file', 'a', Readable.from([]))
    const second = createMultipartFileUpload('in_file', 'a', Readable.from([]))

    expect(first.contentType).not.toBe(second.contentType)
  })

  test('createMultipartFileUpload > propagates stream errors', async () => {
    const stream = new Readable({
      read() {
        this.destroy(new Error('read failed'))
      },
    })
    const upload = createMultipartFileUpload('in_file', 'a', stream)

    await expect(readBody(upload.body)).rejects.toThrow('read failed')
  })
})
