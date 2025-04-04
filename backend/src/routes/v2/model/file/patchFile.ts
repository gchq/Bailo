import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { FileInterface } from '../../../../models/File.js'
import { updateFile } from '../../../../services/file.js'
import { fileWithScanInterfaceSchema, registerPath } from '../../../../services/specification.js'
import { parse } from '../../../../utils/validate.js'

export const patchFileSchema = z.object({
  params: z.object({
    modelId: z.string({
      required_error: 'Must specify model id as param',
    }),
    fileId: z.string({
      required_error: 'Must specify file id as param',
    }),
  }),
  body: z.object({
    metadata: z.object({
      tags: z.array(z.string()).optional(),
    }),
  }),
})

registerPath({
  method: 'patch',
  path: '/api/v2/model/{modelId}/file/{fileId}',
  tags: ['file'],
  description: 'Update the metadata for a file',
  schema: patchFileSchema,
  responses: {
    200: {
      description: 'Object with file information.',
      content: {
        'application/json': {
          schema: z.object({ file: fileWithScanInterfaceSchema }),
        },
      },
    },
  },
})

interface PostModelResponse {
  file: FileInterface
}

export const patchFile = [
  bodyParser.json(),
  async (req: Request, res: Response<PostModelResponse>) => {
    //req.audit = AuditInfo.PatchFile
    const {
      params: { modelId, fileId },
      body: { metadata },
    } = parse(req, patchFileSchema)

    const file = await updateFile(req.user, modelId, fileId, metadata)

    //await audit.on(req, model)

    return res.json({ file })
  },
]
