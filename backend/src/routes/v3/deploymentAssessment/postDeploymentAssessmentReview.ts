import { Request, Response } from 'express'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { z } from '../../../lib/zod.js'
import { Decision } from '../../../models/Response.js'
import { reviewDeploymentAssessment } from '../../../services/deploymentAssessment.js'
import { deploymentAssessmentResponseSchema, registerPath } from '../../../services/specification.js'
import { parse } from '../../../utils/validate.js'

export const postDeploymentAssessmentReviewSchema = z.object({
  params: z.object({ deploymentAssessmentId: z.string().min(1) }),
  body: z.discriminatedUnion('decision', [
    z.object({ decision: z.literal(Decision.Approve), comment: z.string().trim().min(1).optional() }).strict(),
    z
      .object({
        decision: z.enum([Decision.Reject, Decision.RequestChanges]),
        comment: z.string().trim().min(1, 'A comment must be supplied for this decision'),
      })
      .strict(),
  ]),
})

registerPath(
  {
    method: 'post',
    path: '/api/v3/deployment-assessments/{deploymentAssessmentId}/review',
    tags: ['deployment assessments'],
    description: 'Create a formal deployment risk owner decision',
    schema: postDeploymentAssessmentReviewSchema,
    responses: {
      201: {
        description: 'The created formal review response.',
        content: { 'application/json': { schema: z.object({ response: deploymentAssessmentResponseSchema }) } },
      },
    },
  },
  'v3',
)

export const postDeploymentAssessmentReview = [
  async (req: Request, res: Response): Promise<void> => {
    req.audit = AuditInfo.ReviewDeploymentAssessment
    const { params, body } = parse(req, postDeploymentAssessmentReviewSchema)
    const response = await reviewDeploymentAssessment(
      req.user,
      params.deploymentAssessmentId,
      body.decision,
      body.comment,
    )
    await audit.onReviewDeploymentAssessment(req, response)
    res.status(201).json({ response })
  },
]
