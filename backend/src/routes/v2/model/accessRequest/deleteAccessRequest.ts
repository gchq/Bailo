import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { removeAccessRequest } from '../../../../services/v2/accessRequest.js'
import { parse } from '../../../../utils/validate.js'

export const deleteAccessRequestSchema = z.object({
  params: z.object({
    modelId: z.string(),
    accessRequestId: z.string(),
  }),
})

interface DeleteAccessRequestResponse {
  message: string
}

export const deleteAccessRequest = [
  bodyParser.json(),
  async (req: Request, res: Response<DeleteAccessRequestResponse>) => {
    const {
      params: { accessRequestId },
    } = parse(req, deleteAccessRequestSchema)

    await removeAccessRequest(req.user, accessRequestId)

    return res.json({
      message: 'Successfully removed access request.',
    })
  },
]
