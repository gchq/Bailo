import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AccessRequestInterface } from '../../../models/v2/AccessRequest.js'
import { createAccessRequest } from '../../../services/v2/accessRequest.js'
import { parse } from '../../../utils/validate.js'

export const postAccessRequestSchema = z.object({
  params: z.object({
    modelId: z.string(),
  }),
  body: z.object({
    entity: z.string(),
    schemaId: z.string(),
    metadata: z.unknown(),
  }),
})

interface PostAccessRequest {
  accessRequest: AccessRequestInterface
}

export const postAccessRequest = [
  bodyParser.json(),
  async (req: Request, res: Response<PostAccessRequest>) => {
    const {
      params: { modelId },
      body,
    } = parse(req, postAccessRequestSchema)

    const accessRequest = await createAccessRequest(req.user, modelId, body)

    return res.json({
      accessRequest,
    })
  },
]
