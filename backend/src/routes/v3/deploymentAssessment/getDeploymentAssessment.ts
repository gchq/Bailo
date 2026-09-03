import { Request, Response } from 'express'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { z } from '../../../lib/zod.js'
import { getDeploymentAssessmentDetails } from '../../../services/deploymentAssessment.js'
import {
  deploymentAssessmentInterfaceSchema,
  deploymentAssessmentResponseSchema,
  deploymentAssessmentStateSchema,
  registerPath,
} from '../../../services/specification.js'
import { parse } from '../../../utils/validate.js'

export const getDeploymentAssessmentSchema = z.object({
  params: z.object({
    deploymentAssessmentId: z.string(),
  }),
})

registerPath(
  {
    method: 'get',
    path: '/api/v3/deployment-assessments/{deploymentAssessmentId}',
    tags: ['deployment assessments'],
    description: 'Get a deployment assessment.',
    schema: getDeploymentAssessmentSchema,
    responses: {
      200: {
        description: 'A deployment assessment.',
        content: {
          'application/json': {
            schema: z.object({
              deploymentAssessment: deploymentAssessmentInterfaceSchema,
              state: deploymentAssessmentStateSchema.optional(),
              responses: z.array(deploymentAssessmentResponseSchema),
            }),
          },
        },
      },
    },
  },
  'v3',
)

export const getDeploymentAssessment = [
  async (req: Request, res: Response): Promise<void> => {
    req.audit = AuditInfo.ViewDeploymentAssessment
    const { params } = parse(req, getDeploymentAssessmentSchema)

    const details = await getDeploymentAssessmentDetails(req.user, params.deploymentAssessmentId)

    await audit.onViewDeploymentAssessment(req, details.deploymentAssessment)

    res.json(details)
  },
]
