import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../../connectors/v2/audit/Base.js'
import audit from '../../../../connectors/v2/audit/index.js'
import { FileInterface } from '../../../../models/File.js'
import { getFilesByModel } from '../../../../services/v2/file.js'
import { fileInterfaceSchema, registerPath } from '../../../../services/v2/specification.js'
import { parse } from '../../../../utils/v2/validate.js'

export const getFilesSchema = z.object({
  params: z.object({
    modelId: z.string({
      required_error: 'Must specify model id as param',
    }),
  }),
})

registerPath({
  method: 'get',
  path: '/api/v2/model/{modelId}/files',
  tags: ['file'],
  description: 'Get all of the files associated with a model.',
  schema: getFilesSchema,
  responses: {
    200: {
      description: 'An array of file instances.',
      content: {
        'application/json': {
          schema: z.object({
            files: z.array(fileInterfaceSchema),
          }),
        },
      },
    },
  },
})

interface GetFilesResponse {
  files: Array<FileInterface>
}

export const getFiles = [
  bodyParser.json(),
  async (req: Request, res: Response<GetFilesResponse>) => {
    req.audit = AuditInfo.ViewFiles
    const {
      params: { modelId },
    } = parse(req, getFilesSchema)

    const files = await getFilesByModel(req.user, modelId)
    await audit.onViewFiles(req, modelId, files)

    return res.json({
      files,
    })
  },
]
