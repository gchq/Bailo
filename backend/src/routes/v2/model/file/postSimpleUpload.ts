import { Request, Response } from 'express'
import { z } from 'zod'

import { FileInterface } from '../../../../models/v2/File.js'
import { uploadFile } from '../../../../services/v2/file.js'
import { parse } from '../../../../utils/validate.js'

export const postSimpleUploadSchema = z.object({
  params: z.object({
    modelId: z.string(),
  }),
  query: z.object({
    name: z.string(),
    mime: z.string().optional().default('application/octet-stream'),
  }),
})

interface PostSimpleUpload {
  file: FileInterface
}

export const postSimpleUpload = [
  async (req: Request, res: Response<PostSimpleUpload>) => {
    // Does user have permission to upload a file?
    const {
      params: { modelId },
      query: { name, mime },
    } = parse(req, postSimpleUploadSchema)

    // The `putObjectStream` function takes in a `StreamingBlobPayloadInputTypes`.  This type
    // includes the 'ReadableStream' interface for handling streaming payloads, but a request
    // is not by default assignable to this type.
    //
    // In practice, it is fine, as the only reason this assignment is not possible is due
    // to a missing `.locked` parameter which is not a required field for our uploads.
    const file = await uploadFile(req.user, modelId, name, mime, req as unknown as ReadableStream)

    return res.json({
      file,
    })
  },
]
