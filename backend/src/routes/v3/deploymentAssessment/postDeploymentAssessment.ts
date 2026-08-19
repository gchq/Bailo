import { Request, Response } from 'express'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { z } from '../../../lib/zod.js'
import { DeploymentAssessmentInterface } from '../../../models/DeploymentAssessment.js'
import { createDeploymentAssessment } from '../../../services/deploymentAssessment.js'
import { registerPath } from '../../../services/specification.js'
import { parse } from '../../../utils/validate.js'

const uniqueModelIds = z
  .array(z.string().min(1))
  .min(1)
  .refine((modelIds) => new Set(modelIds).size === modelIds.length, {
    message: 'Model IDs must be unique.',
  })

const overview = z.object({
  name: z.string().min(1, 'You must provide a deployment assessment name'),
  riskOwner: z.string().min(1, 'You must provide a risk owner'),
  justification: z.string().min(1, 'You must provide a justification'),
  models: uniqueModelIds,
})

const metadata = z.intersection(
  z.object({ overview: z.intersection(overview, z.record(z.unknown())) }),
  z.record(z.unknown()),
)

export const deploymentAssessmentInterfaceSchema = z.object({
  id: z.string().openapi({ example: 'just-a-rather-very-intelligent-system-a1b2c3' }),
  schemaId: z.string().openapi({ example: 'stark-deployment-assessment-schema-v1' }),
  metadata: metadata.openapi({
    example: {
      overview: {
        name: 'Just A Rather Very Intelligent System',
        riskOwner: 'user:tony',
        justification: 'The risk owner is accountable for the deployed service.',
        models: ['ironman-a1b2c3', 'hulkbuster-a1b2c3'],
      },
    },
  }),
  draft: z.boolean().openapi({ example: false }),
  createdBy: z.string().openapi({ example: 'tony' }),
  createdAt: z.string().datetime().openapi({ example: new Date().toISOString() }),
  updatedAt: z.string().datetime().openapi({ example: new Date().toISOString() }),
})

export const postDeploymentAssessmentSchema = z.object({
  body: z
    .object({
      schemaId: z.string().min(1, 'You must provide a schema ID'),
      metadata,
      draft: z.boolean().optional().default(false),
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
