import { Request, Response } from 'express'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { z } from '../../../lib/zod.js'
import { removeDeploymentAssessment } from '../../../services/deploymentAssessment.js'
import { registerPath } from '../../../services/specification.js'
import { useTransaction } from '../../../utils/transactions.js'
import { parse } from '../../../utils/validate.js'

export const deleteDeploymentAssessmentSchema = z.object({
  params: z.object({
    deploymentAssessmentId: z.string(),
  }),
})

registerPath(
  {
    method: 'delete',
    path: '/api/v3/deployment-assessments/{deploymentAssessmentId}',
    tags: ['deployment assessments'],
    description: 'Delete a deployment assessment.',
    schema: deleteDeploymentAssessmentSchema,
    responses: {
      200: {
        description: 'A message confirming the removal of the deployment assessment.',
        content: {
          'application/json': {
            schema: z.object({
              message: z.string().openapi({ example: 'Successfully removed deployment assessment' }),
            }),
          },
        },
      },
    },
  },
  'v3',
)

interface DeleteDeploymentAssessmentResponse {
  message: string
}

export const deleteDeploymentAssessment = [
  async (req: Request, res: Response<DeleteDeploymentAssessmentResponse>): Promise<void> => {
    req.audit = AuditInfo.DeleteDeploymentAssessment
    const {
      params: { deploymentAssessmentId },
    } = parse(req, deleteDeploymentAssessmentSchema)

    const transactionResult = await useTransaction([
      (session) => removeDeploymentAssessment(req.user, deploymentAssessmentId, session),
    ])

    await audit.onDeleteDeploymentAssessment(req, transactionResult[0])

    res.json({
      message: 'Successfully removed deployment assessment.',
    })
  },
]
