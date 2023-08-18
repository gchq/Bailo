import bodyParser from 'body-parser'
import { Request, Response } from 'express'

interface GetApprovalsCountResponse {
  count: number
}

export const getApprovalsCount = [
  bodyParser.json(),
  async (req: Request, res: Response<GetApprovalsCountResponse>) => {
    return res.json({
      count: 2,
    })
  },
]
