import { Request, Response } from 'express'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { z } from '../../../lib/zod.js'
import { DeploymentAssessmentInterface } from '../../../models/DeploymentAssessment.js'
import { createDeploymentAssessment } from '../../../services/deploymentAssessment.js'
import { registerPath } from '../../../services/specification.js'
import { parse } from '../../../utils/validate.js'

const name = z
  .string()
  .min(1, 'You must provide a deployment assessment name')
  .openapi({ example: 'Just A Rather Very Intelligent System' })

const overview = z
  .object({
    riskOwner: z.string().min(1, 'You must provide a risk owner').openapi({ example: 'user:tony' }).optional(),
    justification: z
      .string()
      .min(1, 'You must provide a justification')
      .openapi({ example: 'The risk owner is accountable for the deployed service.' })
      .optional(),
    modelIds: z
      .array(z.string())
      .openapi({ example: ['ironman-a1b2c3', 'hulkbuster-a1b2c3'] })
      .optional(),
  })
  .passthrough()

const metadata = z.object({ overview }).passthrough()

const schemaId = z
  .string()
  .min(1, 'You must provide a schema ID')
  .openapi({ example: 'stark-deployment-assessment-schema-v1' })
const draft = z.boolean().openapi({ example: true })

export const deploymentAssessmentInterfaceSchema = z.object({
  id: z.string().openapi({ example: 'just-a-rather-very-intelligent-system-a1b2c3' }),
  name,
  schemaId,
  metadata,
  draft,
  createdBy: z.string().openapi({ example: 'tony' }),
  createdAt: z.string().datetime().openapi({ example: new Date().toISOString() }),
  updatedAt: z.string().datetime().openapi({ example: new Date().toISOString() }),
})

export const postDeploymentAssessmentSchema = z.object({
  body: z.discriminatedUnion('draft', [
    z.object({ name, schemaId, metadata, draft: z.literal(false) }).strict(),
    z.object({ name, schemaId, metadata: metadata.optional(), draft: z.literal(true) }).strict(),
    z
      .object({ name, schemaId, metadata: metadata.optional(), draft: z.undefined().openapi({ type: 'boolean' }) })
      .strict(),
  ]),
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

    const deploymentAssessment = await createDeploymentAssessment(req.user, {
      draft: true,
      ...body,
    })
    await audit.onCreateDeploymentAssessment(req, deploymentAssessment)

    res.location(`/api/v3/deployment-assessments/${deploymentAssessment.id}`).status(201).json({ deploymentAssessment })
  },
]
