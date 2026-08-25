import { Request, Response } from 'express'

import { z } from '../../../lib/zod.js'
import { getCurrentUserPermissionsByDeploymentAssessment } from '../../../services/deploymentAssessment.js'
import { deploymentAssessmentPermissionsSchema, registerPath } from '../../../services/specification.js'
import { DeploymentAssessmentUserPermissions } from '../../../types/types.js'
import { parse } from '../../../utils/validate.js'

export const getDeploymentAssessmentCurrentUserPermissionsSchema = z.object({
  params: z.object({
    deploymentAssessmentId: z.string(),
  }),
})

registerPath({
  method: 'get',
  path: '/api/v3/deployment-assessments/{deploymentAssessmentId}/permissions/mine',
  tags: ['deployment assessments'],
  description: 'Get all current user permissions for a deployment assessment.',
  schema: getDeploymentAssessmentCurrentUserPermissionsSchema,
  responses: {
    200: {
      description: `Details about the currently logged in user's permissions for a deploymet assessment.`,
      content: {
        'application/json': {
          schema: z.object({
            permissions: deploymentAssessmentPermissionsSchema,
          }),
        },
      },
    },
  },
})

interface GetDeploymentAssessmentCurrentUserPermissionsResponse {
  permissions: DeploymentAssessmentUserPermissions
}

export const getDeploymentAssessmentCurrentUserPermissions = [
  async (req: Request, res: Response<GetDeploymentAssessmentCurrentUserPermissionsResponse>): Promise<void> => {
    const { params } = parse(req, getDeploymentAssessmentCurrentUserPermissionsSchema)

    const permissions = await getCurrentUserPermissionsByDeploymentAssessment(req.user, params.deploymentAssessmentId)

    res.json({
      permissions,
    })
  },
]
