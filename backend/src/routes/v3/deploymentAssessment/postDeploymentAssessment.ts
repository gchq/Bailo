import { Request, Response } from 'express'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { z } from '../../../lib/zod.js'
import { DeploymentAssessmentInterface } from '../../../models/DeploymentAssessment.js'
import { createDeploymentAssessment } from '../../../services/deploymentAssessment.js'
import {
  deploymentAssessmentDraftSchema,
  deploymentAssessmentInterfaceSchema,
  deploymentAssessmentMetadataSchema,
  deploymentAssessmentSchemaIdSchema,
  registerPath,
} from '../../../services/specification.js'
import { parse } from '../../../utils/validate.js'

export const postDeploymentAssessmentSchema = z.object({
  body: z
    .object({
      schemaId: deploymentAssessmentSchemaIdSchema,
      metadata: deploymentAssessmentMetadataSchema,
      draft: deploymentAssessmentDraftSchema.optional().default(true),
    })
    .strict(),
})

registerPath(
  {
    method: 'post',
    path: '/api/v3/deployment-assessments',
    tags: ['deployment assessments'],
    description: 'Create a deployment assessment',
    schema: postDeploymentAssessmentSchema,
    responses: {
      201: {
        description: 'The created deployment assessment.',
        content: {
          'application/json': {
            schema: z.object({ deploymentAssessment: deploymentAssessmentInterfaceSchema }),
          },
        },
      },
    },
  },
  'v3',
)

interface PostDeploymentAssessmentResponse {
  deploymentAssessment: DeploymentAssessmentInterface
}

export const postDeploymentAssessment = [
  async (req: Request, res: Response<PostDeploymentAssessmentResponse>): Promise<void> => {
    req.audit = AuditInfo.CreateDeploymentAssessment
    const { body } = parse(req, postDeploymentAssessmentSchema)

    const deploymentAssessment = await createDeploymentAssessment(req.user, body)
    await audit.onCreateDeploymentAssessment(req, deploymentAssessment)

    res.location(`/api/v3/deployment-assessments/${deploymentAssessment.id}`).status(201).json({ deploymentAssessment })
  },
]
