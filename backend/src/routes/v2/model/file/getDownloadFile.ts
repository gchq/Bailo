import bodyParser from 'body-parser'
import contentDisposition from 'content-disposition'
import { Request, Response } from 'express'
import stream from 'stream'
import { z } from 'zod'

import { FileInterface } from '../../../../models/v2/File.js'
import { downloadFile, getFileById } from '../../../../services/v2/file.js'
import { BadReq, InternalError } from '../../../../utils/v2/error.js'
import { parse } from '../../../../utils/validate.js'

export const getDownloadFileSchema = z.object({
  params: z.object({
    modelId: z.string(),
    fileId: z.string(),
  }),
})

interface GetDownloadFileResponse {
  files: Array<FileInterface>
}

export const getDownloadFile = [
  bodyParser.json(),
  async (req: Request, res: Response<GetDownloadFileResponse>) => {
    const {
      params: { fileId },
    } = parse(req, getDownloadFileSchema)

    const file = await getFileById(req.user, fileId)

    // required to support utf-8 file names
    res.set('Content-Disposition', contentDisposition(file.name, { type: 'inline' }))
    res.set('Content-Type', file.mime)
    res.set('Cache-Control', 'public, max-age=604800, immutable')

    if (req.headers.range) {
      // TODO: support ranges
      throw BadReq('Ranges are not supported', { fileId })
    }

    res.set('Content-Length', String(file.size))
    // TODO: support ranges
    // res.set('Accept-Ranges', 'bytes')

    const stream = await downloadFile(req.user, fileId)

    if (!stream.Body) {
      throw InternalError('We were not able to retrieve the body of this file', { fileId })
    }

    res.writeHead(200)

    // The AWS library doesn't seem to properly type 'Body' as being pipeable?
    ;(stream.Body as stream.Readable).pipe(res)
  },
]
