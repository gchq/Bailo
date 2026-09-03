import { Request, Response } from 'express'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { z } from '../../../lib/zod.js'
import { commentOnDeploymentAssessment } from '../../../services/deploymentAssessment.js'
import { deploymentAssessmentResponseSchema, registerPath } from '../../../services/specification.js'
import { parse } from '../../../utils/validate.js'

export const postDeploymentAssessmentCommentSchema = z.object({
  params: z.object({ deploymentAssessmentId: z.string().min(1) }),
  body: z.object({ comment: z.string().trim().min(1) }).strict(),
})

registerPath(
  {
    method: 'post',
    path: '/api/v3/deployment-assessments/{deploymentAssessmentId}/comments',
    tags: ['deployment assessments'],
    description: 'Comment on a deployment assessment',
    schema: postDeploymentAssessmentCommentSchema,
    responses: {
      201: {
        description: 'The created comment.',
        content: { 'application/json': { schema: z.object({ response: deploymentAssessmentResponseSchema }) } },
      },
    },
  },
  'v3',
)

export const postDeploymentAssessmentComment = [
  async (req: Request, res: Response): Promise<void> => {
    req.audit = AuditInfo.CommentOnDeploymentAssessment
    const { params, body } = parse(req, postDeploymentAssessmentCommentSchema)
    const response = await commentOnDeploymentAssessment(req.user, params.deploymentAssessmentId, body.comment)
    await audit.onCommentOnDeploymentAssessment(req, response)
    res.status(201).json({ response })
  },
]
