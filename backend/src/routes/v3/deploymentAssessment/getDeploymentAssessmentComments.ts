import { Request, Response } from 'express'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { z } from '../../../lib/zod.js'
import { getCommentsByDeploymentAssessmentId } from '../../../services/deploymentAssessment.js'
import { getDeploymentAssessmentCommentsResponseSchema, registerPath } from '../../../services/specification.js'
import { parse } from '../../../utils/validate.js'

export const getDeploymentAssessmentCommentsSchema = z.object({
  params: z.object({
    deploymentAssessmentId: z.string(),
  }),
})

registerPath(
  {
    method: 'get',
    path: '/api/v3/deployment-assessments/{deploymentAssessmentId}/comments',
    tags: ['deployment assessments'],
    description: 'Get all comments on a deployment assessment.',
    schema: getDeploymentAssessmentCommentsSchema,
    responses: {
      200: {
        description: 'All comments on a deployment assessment.',
        content: {
          'application/json': {
            schema: getDeploymentAssessmentCommentsResponseSchema,
          },
        },
      },
    },
  },
  'v3',
)

export const getDeploymentAssessmentComments = [
  async (req: Request, res: Response): Promise<void> => {
    req.audit = AuditInfo.ViewDeploymentAssessmentComments
    const { params } = parse(req, getDeploymentAssessmentCommentsSchema)

    const comments = await getCommentsByDeploymentAssessmentId(req.user, params.deploymentAssessmentId)

    await audit.onViewDeploymentAssessmentComments(req, params.deploymentAssessmentId)

    res.json(comments)
  },
]
