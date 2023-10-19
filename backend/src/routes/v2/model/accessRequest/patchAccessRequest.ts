import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AccessRequestInterface } from '../../../../models/v2/AccessRequest.js'
import { updateAccessRequest } from '../../../../services/v2/accessRequest.js'
import { parse } from '../../../../utils/validate.js'
import { accessRequestMetadata } from './postAccessRequest.js'

export const patchAccessRequestSchema = z.object({
  body: z.object({
    metadata: accessRequestMetadata,
  }),
  params: z.object({
    accessRequestId: z.string(),
  }),
})

interface PatchAccessRequestResponse {
  accessRequest: AccessRequestInterface
}

export const patchAccessRequest = [
  bodyParser.json(),
  async (req: Request, res: Response<PatchAccessRequestResponse>) => {
    const {
      body,
      params: { accessRequestId },
    } = parse(req, patchAccessRequestSchema)

    const accessRequest = await updateAccessRequest(req.user, accessRequestId, body)

    return res.json({
      accessRequest,
    })
  },
]
