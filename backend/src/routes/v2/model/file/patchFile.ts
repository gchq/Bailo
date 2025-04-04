import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../../connectors/audit/Base.js'
import audit from '../../../../connectors/audit/index.js'
import { FileInterface } from '../../../../models/File.js'
import { updateFile } from '../../../../services/file.js'
import { fileWithScanInterfaceSchema, registerPath } from '../../../../services/specification.js'
import { BadReq } from '../../../../utils/error.js'
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
    req.audit = AuditInfo.UpdateFile
    const {
      params: { modelId, fileId },
      body: { metadata },
    } = parse(req, patchFileSchema)

    const file = await updateFile(req.user, modelId, fileId, metadata)

    if (!file) {
      throw BadReq('There was a problem updating this file')
    }

    await audit.onUpdateFile(req, modelId, fileId)

    return res.json({ file })
  },
]
