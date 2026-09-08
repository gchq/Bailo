import { Request, Response } from 'express'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { z } from '../../../lib/zod.js'
import { getDeploymentAssessmentHtml as getDeploymentAssessmentHtmlService } from '../../../services/deploymentAssessmentExport.js'
import { registerPath } from '../../../services/specification.js'
import { parse } from '../../../utils/validate.js'

export const getDeploymentAssessmentHtmlSchema = z.object({
  params: z.object({
    deploymentAssessmentId: z.string({
      required_error: 'Must specify deployment assessment id as param',
    }),
  }),
})

registerPath({
  method: 'get',
  path: '/api/v3/deployment-assessments/{deploymentAssessmentId}/html',
  tags: ['deployment-assessments'],
  description: 'Get a specific version of a model card as HTML.',
  schema: getDeploymentAssessmentHtmlSchema,
  responses: {
    200: {
      description: 'Deployment assessment HTML.',
      content: {
        'application/html': {
          schema: {
            type: 'string',
          },
        },
      },
    },
  },
})

export const getDeploymentAssessmentHtml = [
  async (req: Request, res: Response): Promise<void> => {
    req.audit = AuditInfo.ViewDeploymentAssessment
    const {
      params: { deploymentAssessmentId },
    } = parse(req, getDeploymentAssessmentHtmlSchema)

    const { html, deploymentAssessment } = await getDeploymentAssessmentHtmlService(req.user, deploymentAssessmentId)
    await audit.onViewDeploymentAssessment(req, deploymentAssessment)

    res.send(html)
  },
]
