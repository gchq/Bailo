import { Request, Response } from 'express'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { z } from '../../../lib/zod.js'
import { DeploymentAssessmentInterface } from '../../../models/DeploymentAssessment.js'
import { getDeploymentAssessmentById } from '../../../services/deploymentAssessment.js'
import { deploymentAssessmentInterfaceSchema, registerPath } from '../../../services/specification.js'
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
            }),
          },
        },
      },
    },
  },
  'v3',
)

interface GetDeploymentAssessmentResponse {
  deploymentAssessment: DeploymentAssessmentInterface
}

export const getDeploymentAssessment = [
  async (req: Request, res: Response<GetDeploymentAssessmentResponse>): Promise<void> => {
    req.audit = AuditInfo.ViewDeploymentAssessment
    const { params } = parse(req, getDeploymentAssessmentSchema)

    const deploymentAssessment = await getDeploymentAssessmentById(req.user, params.deploymentAssessmentId)

    await audit.onViewDeploymentAssessment(req, deploymentAssessment)

    res.json({
      deploymentAssessment,
    })
  },
]
