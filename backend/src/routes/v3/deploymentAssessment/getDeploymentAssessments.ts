import { Request, Response } from 'express'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { z } from '../../../lib/zod.js'
import { DeploymentAssessmentDoc } from '../../../models/DeploymentAssessment.js'
import { searchDeploymentAssessments } from '../../../services/deploymentAssessment.js'
import {
  deploymentAssessmentStateSchema,
  deploymentAssessmentSummarySchema,
  registerPath,
} from '../../../services/specification.js'
import { coerceArray, parse, strictCoerceBoolean } from '../../../utils/validate.js'

export const getDeploymentAssessmentsSchema = z.object({
  query: z
    .object({
      schemaId: z.string().min(1).optional(),
      modelIds: coerceArray(z.array(z.string().min(1))).optional(),
      riskOwner: z.string().min(1).optional(),
      createdBy: z.string().min(1).optional(),
      createdAfter: z.string().date().optional(),
      createdBefore: z.string().date().optional(),
      draft: strictCoerceBoolean(z.boolean()).optional(),
      search: z.string().min(1).optional(),
      state: deploymentAssessmentStateSchema.optional(),
    })
    .strict()
    .refine(
      ({ createdAfter, createdBefore }) =>
        !createdAfter || !createdBefore || new Date(createdAfter) <= new Date(createdBefore),
      {
        message: 'createdAfter must be before or equal to createdBefore',
        path: ['createdBefore'],
      },
    ),
})

export type DeploymentAssessmentSummary = z.infer<typeof deploymentAssessmentSummarySchema>

function toDeploymentAssessmentSummary(
  deploymentAssessment: DeploymentAssessmentDoc & { state?: DeploymentAssessmentSummary['state'] },
): DeploymentAssessmentSummary {
  const { riskOwner, modelIds, justification } = deploymentAssessment.metadata.overview ?? {}

  return {
    id: deploymentAssessment.id,
    schemaId: deploymentAssessment.schemaId,
    name: deploymentAssessment.name,
    ...(riskOwner && { owner: riskOwner }),
    ...(modelIds && { models: modelIds }),
    ...(justification && { justification }),
    ...(deploymentAssessment.state && { state: deploymentAssessment.state }),
    draft: deploymentAssessment.draft,
    createdBy: deploymentAssessment.createdBy,
    createdAt: deploymentAssessment.createdAt.toISOString(),
  }
}

registerPath(
  {
    method: 'get',
    path: '/api/v3/deployment-assessments',
    tags: ['deployment assessments'],
    description: 'Search deployment assessments',
    schema: getDeploymentAssessmentsSchema,
    responses: {
      200: {
        description: 'Deployment assessments matching the supplied filters.',
        content: {
          'application/json': {
            schema: z.object({ deploymentAssessments: z.array(deploymentAssessmentSummarySchema) }),
          },
        },
      },
    },
  },
  'v3',
)

interface GetDeploymentAssessmentsResponse {
  deploymentAssessments: DeploymentAssessmentSummary[]
}

export const getDeploymentAssessments = [
  async (req: Request, res: Response<GetDeploymentAssessmentsResponse>): Promise<void> => {
    req.audit = AuditInfo.SearchDeploymentAssessments
    const { query } = parse(req, getDeploymentAssessmentsSchema)

    const deploymentAssessments = await searchDeploymentAssessments(req.user, query)
    await audit.onSearchDeploymentAssessments(req, deploymentAssessments)

    res.json({ deploymentAssessments: deploymentAssessments.map(toDeploymentAssessmentSummary) })
  },
]
