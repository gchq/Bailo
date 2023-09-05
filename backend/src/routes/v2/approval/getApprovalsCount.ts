import bodyParser from 'body-parser'
import { Request, Response } from 'express'

import { countApprovals } from '../../../services/v2/approval.js'

interface GetApprovalsCountResponse {
  count: number
}

export const getApprovalsCount = [
  bodyParser.json(),
  async (req: Request, res: Response<GetApprovalsCountResponse>) => {
    const count = await countApprovals(req.user)
    return res.json({
      count,
    })
  },
]
