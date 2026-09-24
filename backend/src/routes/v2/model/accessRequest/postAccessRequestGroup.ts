import { Request, Response } from 'express'

import { AuditInfo } from '../../../../connectors/audit/Base.js'
import audit from '../../../../connectors/audit/index.js'
import { z } from '../../../../lib/zod.js'
import { AccessRequestGroupResult, createAccessRequestGroup } from '../../../../services/accessRequest.js'
import { accessRequestInterfaceSchema, registerPath } from '../../../../services/specification.js'
import { parse } from '../../../../utils/validate.js'
import { accessRequestMetadata } from './postAccessRequest.js'

export const postAccessRequestGroupSchema = z.object({
  body: z
    .object({
      modelIds: z
        .array(z.string().min(1))
        .min(2)
        .max(20)
        .refine((ids) => new Set(ids).size === ids.length, 'Models must be unique'),
      schemaId: z.string().min(1),
      metadata: accessRequestMetadata,
    })
    .strict(),
})

registerPath({
  method: 'post',
  path: '/api/v2/access-request-groups',
  tags: ['access-request'],
  description:
    'Create independent, linked access requests from one form. Returns successful requests and failed model IDs; a partial result does not roll back successful requests.',
  schema: postAccessRequestGroupSchema,
  responses: {
    200: {
      description: 'Per-model creation results. Check failedModelIds even when the response is successful.',
      content: {
        'application/json': {
          schema: z.object({
            groupId: z.string().uuid(),
            accessRequests: z.array(accessRequestInterfaceSchema),
            failedModelIds: z.array(z.string()),
          }),
        },
      },
    },
  },
})

export const postAccessRequestGroup = [
  async (req: Request, res: Response<AccessRequestGroupResult>): Promise<void> => {
    req.audit = AuditInfo.CreateAccessRequest
    const {
      body: { modelIds, ...info },
    } = parse(req, postAccessRequestGroupSchema)
    const result = await createAccessRequestGroup(req.user, modelIds, info)
    for (const request of result.accessRequests) {
      await audit.onCreateAccessRequest(req, request)
    }
    res.json(result)
  },
]
