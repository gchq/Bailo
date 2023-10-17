import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AccessRequestInterface } from '../../../../models/v2/AccessRequest.js'
import { getAccessRequestById } from '../../../../services/v2/accessRequest.js'
import { parse } from '../../../../utils/validate.js'

export const getAccessRequestSchema = z.object({
  params: z.object({
    accessRequestId: z.string(),
  }),
})

interface GetAccessRequestResponse {
  accessRequest: AccessRequestInterface
}

export const getAccessRequest = [
  bodyParser.json(),
  async (req: Request, res: Response<GetAccessRequestResponse>) => {
    const { params } = parse(req, getAccessRequestSchema)

    const accessRequest = await getAccessRequestById(req.user, params.accessRequestId)

    return res.json({
      accessRequest,
    })
  },
]
