import { createHash } from 'node:crypto'

import contentDisposition from 'content-disposition'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../../connectors/audit/Base.js'
import audit from '../../../../connectors/audit/index.js'
import { FileWithScanResultsInterface } from '../../../../models/File.js'
import { downloadFile, getFileById } from '../../../../services/file.js'
import log from '../../../../services/log.js'
import { getFileByReleaseFileName } from '../../../../services/release.js'
import { PathConfig, registerPath } from '../../../../services/specification.js'
import { HttpHeader } from '../../../../types/enums.js'
import { BailoError } from '../../../../types/error.js'
import { parseRangeHeaders } from '../../../../utils/range.js'
import { parse } from '../../../../utils/validate.js'

// Default cache response header
const cacheControl = 'public, max-age=604800, immutable'

const responseHeaders = z.object({
  [HttpHeader.CONTENT_DISPOSITION]: z
    .string()
    .describe('Content disposition header, ensures correct filename and attachment download')
    .openapi({ example: 'attachment; filename="myfile.txt"' }),
  [HttpHeader.CACHE_CONTROL]: z
    .string()
    .describe(`Cache policy for downloads. Set to "${cacheControl}".`)
    .openapi({ example: cacheControl }),
  [HttpHeader.CONTENT_TYPE]: z
    .string()
    .describe('The type of the returned content')
    .openapi({ example: 'application/octet-stream' }),
  [HttpHeader.ETAG]: z.string().describe('A SHA256 hash of the file ID and modification time'),
  [HttpHeader.ACCEPT_RANGES]: z
    .string()
    .describe("Fixed to 'bytes' in this implementation.")
    .openapi({ example: 'bytes' }),
  [HttpHeader.CONTENT_LENGTH]: z.number().describe('Number of bytes in the file (or in the requested range)'),
})

const contentRangeResponseHeader = z.object({
  [HttpHeader.CONTENT_RANGE]: z
    .string()
    .describe(
      'Formatted string similar to bytes 0-10/1234 where bytes is the unit, 0-10 are the start and end bytes (inclusive), and 1234 is the max length',
    ),
})

const rangeRequestHeader = z.object({
  Range: z.string().optional().describe('Range of bytes to request from the content. Formatted like: bytes=0-10'),
})

const rangedResponseHeaders = responseHeaders.merge(contentRangeResponseHeader)

// Binary response schema
const binaryContent = {
  'application/octet-stream': {
    schema: z.string().openapi({ format: 'binary' }),
  },
}

// Params
const modelIdParam = z.object({ modelId: z.string() })
const fileIdParam = z.object({ fileId: z.string() })
const semverParam = z.object({ semver: z.string() })
const fileNameParam = z.object({ fileName: z.string() })

const modelIdWithSemverAndFileName = modelIdParam.merge(semverParam).merge(fileNameParam)
const modelIdWithFileId = modelIdParam.merge(fileIdParam)

const apiInfo: Omit<PathConfig, 'path' | 'schema'> = {
  method: 'get',
  tags: ['file'],
  responses: {
    200: {
      description: 'The contents of the file, or the entire file if no range requested.',
      content: binaryContent,
      headers: responseHeaders,
    },
    206: {
      description: 'Range of bytes specified by the incoming header',
      content: binaryContent,
      headers: rangedResponseHeaders,
    },
  },
}

registerPath({
  ...apiInfo,
  path: '/api/v2/model/{modelId}/release/{semver}/file/{fileName}/download',
  description: 'Download a file by file name and release. Supports fetching parts via standard range headers.',
  schema: z.object({
    params: modelIdWithSemverAndFileName,
    headers: rangeRequestHeader,
  }),
})

registerPath({
  ...apiInfo,
  path: '/api/v2/model/{modelId}/file/{fileId}/download',
  description: 'Download a file by file ID. Supports fetching parts via standard range headers.',
  schema: z.object({
    params: modelIdWithFileId,
    headers: rangeRequestHeader,
  }),
})

export const getDownloadFileSchema = z
  .object({ params: modelIdWithSemverAndFileName })
  .or(z.object({ params: modelIdWithFileId }))

export const getDownloadFile = [
  async (req: Request, res: Response): Promise<void> => {
    req.audit = AuditInfo.ViewFile
    const { params } = parse(req, getDownloadFileSchema)
    let file: FileWithScanResultsInterface
    if ('semver' in params) {
      file = await getFileByReleaseFileName(req.user, params.modelId, params.semver, params.fileName)
    } else {
      file = await getFileById(req.user, params.fileId)
    }

    const fileId = file._id.toString()

    // Naive approach to generating an ETag - this is needed for some download tools to consider a file resumable
    const etag = createHash('sha256').update(`${fileId}/${file.updatedAt.getTime()}`).digest('hex')

    res.set(HttpHeader.ETAG, etag)
    res.set(HttpHeader.ACCEPT_RANGES, 'bytes')
    res.set(HttpHeader.CACHE_CONTROL, cacheControl)

    // 304 support
    const clientEtag = req.headers[HttpHeader.IF_NONE_MATCH]
    if (clientEtag === etag) {
      res.status(304).end()
      return
    }

    const fetchRange = parseRangeHeaders(req, res, file.size)

    const stream = await downloadFile(req.user, fileId, fetchRange)

    await audit.onViewFile(req, file)

    // Required to support utf-8 file names
    res.set(HttpHeader.CONTENT_DISPOSITION, contentDisposition(file.name, { type: 'attachment' }))
    res.set(HttpHeader.CONTENT_TYPE, file.mime)

    res.status(fetchRange ? 206 : 200)

    stream.once('error', (err) => {
      if (!res.headersSent) {
        const bailoError: BailoError = {
          code: 500,
          name: 'File download error',
          message: 'Error occurred whilst streaming file',
          status: 500,
          cause: err?.message || String(err),
          context: {
            fileId,
          },
        }
        res.status(500).json(bailoError)
        log.error(bailoError, { fileId })
      } else {
        res.destroy(err)
      }
    })

    res.once('close', () => {
      if (!stream.readableEnded) {
        log.debug({ fileId }, 'Response has been closed before file stream has finished. Destroying file stream.')
        stream.destroy()
      }
    })

    stream.pipe(res)
  },
]
