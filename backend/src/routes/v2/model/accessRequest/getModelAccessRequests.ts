import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AccessRequestInterface } from '../../../../models/v2/AccessRequest.js'
import { getAccessRequestsByModel } from '../../../../services/v2/accessRequest.js'
import { parse } from '../../../../utils/v2/validate.js'

export const getModelAccessRequestsSchema = z.object({
  params: z.object({
    modelId: z.string(),
  }),
})

interface GetModelAccessRequestsResponse {
  accessRequests: Array<AccessRequestInterface>
}

export const getModelAccessRequests = [
  bodyParser.json(),
  async (req: Request, res: Response<GetModelAccessRequestsResponse>) => {
    const {
      params: { modelId },
    } = parse(req, getModelAccessRequestsSchema)

    const accessRequests = await getAccessRequestsByModel(req.user, modelId)

    return res.json({ accessRequests })
  },
]
