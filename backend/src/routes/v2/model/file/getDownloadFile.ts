import bodyParser from 'body-parser'
import contentDisposition from 'content-disposition'
import { Request, Response } from 'express'
import stream from 'stream'
import { z } from 'zod'

import { AuditInfo } from '../../../../connectors/audit/Base.js'
import audit from '../../../../connectors/audit/index.js'
import { FileWithScanResultsInterface } from '../../../../models/File.js'
import { downloadFile, getFileById } from '../../../../services/file.js'
import { getFileByReleaseFileName } from '../../../../services/release.js'
import { registerPath } from '../../../../services/specification.js'
import { BadReq, InternalError } from '../../../../utils/error.js'
import { parse } from '../../../../utils/validate.js'

export const getDownloadFileSchema = z
  .object({
    params: z.object({
      modelId: z.string(),
      fileId: z.string(),
    }),
  })
  .or(
    z.object({
      params: z.object({
        modelId: z.string(),
        semver: z.string(),
        fileName: z.string(),
      }),
    }),
  )

registerPath({
  method: 'get',
  path: '/api/v2/model/{modelId}/release/{semver}/file/{fileName}/download',
  tags: ['file'],
  description: 'Download a file by file name and release.',
  schema: z.object({
    params: z.object({
      modelId: z.string(),
      semver: z.string(),
      fileName: z.string(),
    }),
  }),
  responses: {
    200: {
      description: 'The contents of the file.',
      content: {
        'application/octet-stream': {
          schema: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  },
})

registerPath({
  method: 'get',
  path: '/api/v2/model/{modelId}/file/{fileId}/download',
  tags: ['file'],
  description: 'Download a file by file ID.',
  schema: z.object({
    params: z.object({
      modelId: z.string(),
      fileId: z.string(),
    }),
  }),
  responses: {
    200: {
      description: 'The contents of the file.',
      content: {
        'application/octet-stream': {
          schema: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  },
})

interface GetDownloadFileResponse {
  files: Array<FileWithScanResultsInterface>
}

export const getDownloadFile = [
  bodyParser.json(),
  async (req: Request, res: Response<GetDownloadFileResponse>) => {
    req.audit = AuditInfo.ViewFile
    const { params } = parse(req, getDownloadFileSchema)
    let file: FileWithScanResultsInterface
    if ('semver' in params) {
      file = await getFileByReleaseFileName(req.user, params.modelId, params.semver, params.fileName)
    } else {
      file = await getFileById(req.user, params.fileId)
    }

    if (req.headers.range) {
      // TODO: support ranges
      throw BadReq('Ranges are not supported', { fileId: file._id })
    }

    res.set('Content-Length', String(file.size))
    // TODO: support ranges
    // res.set('Accept-Ranges', 'bytes')
    const stream = await downloadFile(req.user, file.id)

    if (!stream.Body) {
      throw InternalError('We were not able to retrieve the body of this file', { fileId: file._id })
    }

    await audit.onViewFile(req, file)

    // required to support utf-8 file names
    res.set('Content-Disposition', contentDisposition(file.name, { type: 'attachment' }))
    res.set('Content-Type', file.mime)
    res.set('Cache-Control', 'public, max-age=604800, immutable')

    res.writeHead(200)

    // The AWS library doesn't seem to properly type 'Body' as being pipeable?
    ;(stream.Body as stream.Readable).pipe(res)
  },
]
