import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { ApprovalRequestInterface } from '../../../models/v2/Approval.js'
import { BadReq } from '../../../utils/v2/error.js'
import { parse } from '../../../utils/v2/validate.js'

export const getApprovalsSchema = z.object({
  query: z.object({
    isActive: z.string({
      required_error: 'Missing parameter isActive.',
    }),
  }),
})

interface GetApprovalsResponse {
  data: {
    approvals: Array<ApprovalRequestInterface>
  }
}

export const getApprovals = [
  bodyParser.json(),
  async (req: Request, res: Response<GetApprovalsResponse>) => {
    const _ = parse(req, getApprovalsSchema)
    const { isActive } = req.query
    if (isActive !== 'true' && isActive !== 'false') {
      throw BadReq('isActive should be true or false')
    }
    const active = req.query.isActive === 'true'
    return active
      ? res.json({
          data: {
            approvals: [
              {
                model: 'yolo',
                release: '3.0.2',
                kind: 'technical',
                isActive: true,
                createdAt: new Date('08/13/2023'),
                updatedAt: new Date('08/14/2023'),
              },
              {
                model: 'yolo',
                release: '3.0.1',
                kind: 'technical',
                isActive: true,
                createdAt: new Date('08/12/2023'),
                updatedAt: new Date('08/12/2023'),
              },
            ],
          },
        })
      : res.json({
          data: {
            approvals: [
              {
                model: 'yolo',
                release: '3.0.0',
                kind: 'technical',
                isActive: false,
                createdAt: new Date('08/11/2023'),
                updatedAt: new Date('08/11/2023'),
              },
            ],
          },
        })
  },
]
