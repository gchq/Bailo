import { Request, Response } from 'express'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { z } from '../../../lib/zod.js'
import { getReviewsByDeploymentAssessmentId } from '../../../services/deploymentAssessment.js'
import { getDeploymentAssessmentReviewsResponseSchema, registerPath } from '../../../services/specification.js'
import { parse } from '../../../utils/validate.js'

export const getDeploymentAssessmentReviewsSchema = z.object({
  params: z.object({
    deploymentAssessmentId: z.string(),
  }),
})

registerPath(
  {
    method: 'get',
    path: '/api/v3/deployment-assessments/{deploymentAssessmentId}/reviews',
    tags: ['deployment assessments'],
    description: 'Get all reviews on a deployment assessment.',
    schema: getDeploymentAssessmentReviewsSchema,
    responses: {
      200: {
        description: 'All reviews on a deployment assessment.',
        content: {
          'application/json': {
            schema: getDeploymentAssessmentReviewsResponseSchema,
          },
        },
      },
    },
  },
  'v3',
)

export const getDeploymentAssessmentReviews = [
  async (req: Request, res: Response): Promise<void> => {
    req.audit = AuditInfo.ViewDeploymentAssessmentReviews
    const { params } = parse(req, getDeploymentAssessmentReviewsSchema)

    const reviews = await getReviewsByDeploymentAssessmentId(req.user, params.deploymentAssessmentId)

    await audit.onViewDeploymentAssessmentReviews(req, params.deploymentAssessmentId)

    res.json(reviews)
  },
]
