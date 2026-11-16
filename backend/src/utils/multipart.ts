import { randomBytes } from 'node:crypto'
import { type Readable } from 'node:stream'

import { BadReq } from './error.js'

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
  // Unlike the names, the content type is not to be escaped, so a line break would inject extra part headers
  if (/[\r\n]/.test(fileContentType)) {
    throw BadReq('Multipart file content type must not contain line breaks.', { fileContentType })
  }

  // Must not appear in the body: https://www.rfc-editor.org/rfc/rfc7578#section-4.1
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
  // Part headers: https://www.rfc-editor.org/rfc/rfc7578#section-4.2 and #section-4.4
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
  // Closing delimiter: https://www.rfc-editor.org/rfc/rfc2046#section-5.1.1
  yield Buffer.from(`\r\n--${boundary}--\r\n`)
}

/** Percent-encodes characters that would break out of a quoted header parameter. */
function escapeHeaderParam(value: string) {
  // As per https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#multipart-form-data
  return value.replace(/\r/g, '%0D').replace(/\n/g, '%0A').replace(/"/g, '%22')
}
