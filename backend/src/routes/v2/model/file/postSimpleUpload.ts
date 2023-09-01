import { NextFunction, Request, Response } from 'express'
import { z } from 'zod'

import { putObjectStream } from '../../../../clients/s3.js'
import { FileCategory, FileInterface } from '../../../../models/v2/File.js'
import config from '../../../../utils/v2/config.js'
import { parse } from '../../../../utils/validate.js'

export const postSimpleUploadSchema = z.object({
  params: z.object({
    modelId: z.string(),
  }),
  query: z.object({
    name: z.string(),
    mime: z.string().optional().default('application/octet-stream'),
    category: z.nativeEnum(FileCategory).optional().default(FileCategory.Other),
  }),
})

interface PostSimpleUpload {
  file: FileInterface
}

export const postSimpleUpload = [
  async (req: Request, res: Response<PostSimpleUpload>, next: NextFunction) => {
    // Does user have permission to upload a file?
    const _ = parse(req, postSimpleUploadSchema)

    // The `putObjectStream` function takes in a `StreamingBlobPayloadInputTypes`.  This type
    // includes the 'ReadableStream' interface for handling streaming payloads, but a request
    // is not by default assignable to this type.
    //
    // In practice, it is fine, as the only reason this assignment is not possible is due
    // to a missing `.locked` parameter which is not a required field for our uploads.
    await putObjectStream(config.s3.buckets.uploads, 'test', req as unknown as ReadableStream)

    return res.json({
      file: {},
    })
  },
]
