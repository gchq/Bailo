import { Request, Response } from 'express'

import { AuditInfo } from '../../../../connectors/audit/Base.js'
import audit from '../../../../connectors/audit/index.js'
import { z } from '../../../../lib/zod.js'
import { ModelInterface } from '../../../../models/Model.js'
import { addModelTag } from '../../../../services/model.js'
import { modelInterfaceSchema, registerPath } from '../../../../services/specification.js'
import { parse } from '../../../../utils/validate.js'

export const postModelTagSchema = z.object({
  params: z.object({ modelId: z.string() }),
  body: z.object({ tag: z.string().trim().toLowerCase().min(1).max(100) }).strict(),
})

registerPath({
  method: 'post',
  path: '/api/v2/model/{modelId}/tags',
  tags: ['tags'],
  description:
    'Add a discovery tag to an entry the user can view. Does not allow removing tags or editing other properties. API tokens require model:read and model:write scopes.',
  schema: postModelTagSchema,
  responses: {
    200: {
      description: 'Entry with the tag added. Existing tags are preserved.',
      content: { 'application/json': { schema: z.object({ model: modelInterfaceSchema }) } },
    },
  },
})

export const postModelTag = [
  async (req: Request, res: Response<{ model: ModelInterface }>): Promise<void> => {
    req.audit = AuditInfo.UpdateModel
    const {
      params: { modelId },
      body: { tag },
    } = parse(req, postModelTagSchema)
    const model = await addModelTag(req.user, modelId, tag)
    await audit.onUpdateModel(req, model)
    res.json({ model })
  },
]
