import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { ApprovalInterface } from '../../../models/v2/Approval.js'
import { findApprovalsByActive } from '../../../services/v2/approval.js'
import { parse } from '../../../utils/v2/validate.js'

export const getApprovalsSchema = z.object({
  query: z.object({
    active: z.coerce.boolean(),
  }),
})

interface GetApprovalsResponse {
  approvals: Array<ApprovalInterface>
}

export const getApprovals = [
  bodyParser.json(),
  async (req: Request, res: Response<GetApprovalsResponse>) => {
    const { query } = parse(req, getApprovalsSchema)
    const approvals = await findApprovalsByActive(req.user, query.active)
    return res.json({
      approvals,
    })
  },
]
