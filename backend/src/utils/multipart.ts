import { randomBytes } from 'node:crypto'
import { type Readable } from 'node:stream'

export interface MultipartFileUpload {
  /** Value for the request's `content-type` header, including the boundary */
  contentType: string
  body: AsyncGenerator<Buffer>
}

/**
 * Builds a single-file `multipart/form-data` request body that streams `stream` without buffering it.
 * Send `body` with `fetch(..., { body, duplex: 'half' })`. The global `FormData` cannot stream a `Readable`.
 */
export function createMultipartFileUpload(
  fieldName: string,
  fileName: string,
  stream: Readable,
  fileContentType = 'application/octet-stream',
): MultipartFileUpload {
  const boundary = `----BailoBoundary${randomBytes(16).toString('hex')}`

  return {
    contentType: `multipart/form-data; boundary=${boundary}`,
    body: multipartFileBody(boundary, fieldName, fileName, stream, fileContentType),
  }
}

async function* multipartFileBody(
  boundary: string,
  fieldName: string,
  fileName: string,
  stream: Readable,
  fileContentType: string,
): AsyncGenerator<Buffer> {
  yield Buffer.from(
    [
      `--${boundary}`,
      `Content-Disposition: form-data; name="${escapeHeaderParam(fieldName)}"; filename="${escapeHeaderParam(fileName)}"`,
      `Content-Type: ${fileContentType}`,
      '',
      '',
    ].join('\r\n'),
  )
  for await (const chunk of stream) {
    yield Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
  }
  yield Buffer.from(`\r\n--${boundary}--\r\n`)
}

/** Percent-encodes characters that would break out of a quoted header parameter. */
function escapeHeaderParam(value: string) {
  return value.replace(/\r/g, '%0D').replace(/\n/g, '%0A').replace(/"/g, '%22')
}
