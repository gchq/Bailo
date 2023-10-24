import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'

export const registry = new OpenAPIRegistry()

export const errorSchemaContent = {
  'application/json': {
    schema: z.object({
      name: z.string().openapi({ example: 'Error' }),
      message: z.string().openapi({ example: 'A human readable error message' }),
      context: z.unknown().openapi({ example: { computer: 'values' } }),
    }),
  },
}

export const modelInterfaceSchema = z.object({
  id: z.string().openapi({ example: 'yolo-v4-abcdef' }),

  name: z.string().openapi({ example: 'Yolo v4' }),
  description: z.string().openapi({ example: 'You only look once' }),
  card: z.object({
    schemaId: z.string().openapi({ example: 'minimal-general-v10-beta' }),
    version: z.number().openapi({ example: 5 }),
    createdBy: z.string().openapi({ example: 'user' }),
    metadata: z.object({
      overview: z.object({
        tags: z.array(z.string()).openapi({ example: ['tag', 'tagb'] }),
      }),
    }),
  }),

  collaborators: z.array(
    z.object({
      entity: z.string().openapi({ example: 'user:user' }),
      roles: z.array(z.string()).openapi({ example: ['owner', 'contributor'] }),
    }),
  ),

  visibility: z.string().openapi({ example: 'public' }),
  deleted: z.boolean().openapi({ example: false }),

  createdAt: z.string().openapi({ example: new Date().toISOString() }),
  updatedAt: z.string().openapi({ example: new Date().toISOString() }),
})
