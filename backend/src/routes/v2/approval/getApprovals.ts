import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { ApprovalRequestInterface } from '../../../models/v2/Approval.js'
import { parse } from '../../../utils/v2/validate.js'

export const getApprovalsSchema = z.object({
  query: z.object({
    isActive: z.coerce.boolean({
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
    const {
      query: { isActive },
    } = parse(req, getApprovalsSchema)

    console.log(req.query, isActive)

    return isActive
      ? res.json({
          data: {
            approvals: [
              {
                model: 'yolo',
                release: '3.0.2',
                kind: 'release',
                isActive,
                createdAt: new Date('08/13/2023'),
                updatedAt: new Date('08/14/2023'),
              },
              {
                model: 'yolo',
                release: '3.0.1',
                kind: 'release',
                isActive,
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
                kind: 'release',
                isActive,
                createdAt: new Date('08/11/2023'),
                updatedAt: new Date('08/11/2023'),
              },
            ],
          },
        })
  },
]
