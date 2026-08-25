import { Request, Response } from 'express'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { z } from '../../../lib/zod.js'
import { DeploymentAssessmentInterface } from '../../../models/DeploymentAssessment.js'
import { updateDeploymentAssessment } from '../../../services/deploymentAssessment.js'
import {
  deploymentAssessmentDraftSchema,
  deploymentAssessmentInterfaceSchema,
  deploymentAssessmentMetadataSchema,
  registerPath,
} from '../../../services/specification.js'
import { parse } from '../../../utils/validate.js'

export const patchDeploymentAssessmentSchema = z.object({
  body: z
    .object({
      metadata: deploymentAssessmentMetadataSchema.optional(),
      draft: deploymentAssessmentDraftSchema.optional(),
    })
    .refine(
      (obj) => {
        for (const val of Object.values(obj)) {
          if (val !== undefined) {
            return true
          }
        }
        return false
      },
      {
        message: 'Body must have at least one property defined.',
      },
    ),
  params: z.object({
    deploymentAssessmentId: z.string(),
  }),
})

registerPath(
  {
    method: 'patch',
    path: '/api/v3/deployment-assessments/{deploymentAssessmentId}',
    tags: ['deployment assessments'],
    description: 'Patch the values of a deployment assessment.',
    schema: patchDeploymentAssessmentSchema,
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

export const patchDeploymentAssessment = [
  async (req: Request, res: Response<GetDeploymentAssessmentResponse>): Promise<void> => {
    req.audit = AuditInfo.UpdateDeploymentAssessment
    const { body, params } = parse(req, patchDeploymentAssessmentSchema)

    const deploymentAssessment = await updateDeploymentAssessment(req.user, params.deploymentAssessmentId, body)

    await audit.onUpdateDeploymentAssessment(req, deploymentAssessment)

    res.json({
      deploymentAssessment,
    })
  },
]
