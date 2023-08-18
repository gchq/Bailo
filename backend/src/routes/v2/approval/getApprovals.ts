import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { ApprovalInterface } from '../../../models/v2/Approval.js'
import { findApprovalsByActive } from '../../../services/v2/approval.js'
import { Boolean } from '../../../types/v2/enums.js'
import { parse } from '../../../utils/v2/validate.js'

/*
export const getApprovalsSchema = z.object({
  query: z.object({
    active: z.literal("",{
        errorMap: () => ({ message: "The 'active' query parameter does not require a value." }),
}),
  }),
})
*/
export const getApprovalsSchema = z.object({
  query: z.object({
    active: z.nativeEnum(Boolean, {
      required_error: 'Missing parameter active.',
    })
  }),
})

interface GetApprovalsResponse {
  data: {
    approvals: Array<ApprovalInterface>
  }
}

export const getApprovals = [
  bodyParser.json(),
  async (req: Request, res: Response<GetApprovalsResponse>) => {
    const { query } = parse(req, getApprovalsSchema)
    const approvals = await findApprovalsByActive(JSON.parse(query.active))
    return res.json({
      data: {
        approvals,
      },
    })
  },
]