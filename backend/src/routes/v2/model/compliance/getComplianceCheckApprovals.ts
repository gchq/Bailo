import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import {
  testReleaseReviewRequest,
  testReleaseReviewRequestWithReview,
} from '../../../../../test/testUtils/testModels.js'
import { ReviewRequestInterface } from '../../../../models/v2/ReviewRequest.js'
import { parse } from '../../../../utils/validate.js'

export const getComplianceApprovalsSchema = z.object({
  params: z.object({
    modelId: z.string({
      required_error: 'Must specify model id as param',
    }),
  }),
})

interface GetComplianceApprovalsResponse {
  approvals: Array<ReviewRequestInterface>
}

export const getComplianceApprovals = [
  bodyParser.json(),
  async (req: Request, res: Response<GetComplianceApprovalsResponse>) => {
    const _ = parse(req, getComplianceApprovalsSchema)

    return res.json({
      approvals: [testReleaseReviewRequestWithReview, testReleaseReviewRequest],
    })
  },
]
