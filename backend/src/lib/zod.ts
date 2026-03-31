/**
 * Helper to call `extendZodWithOpenApi` for all zod imports.
 */
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'

// Let Zod types have OpenAPI attributes
extendZodWithOpenApi(z)

export { z }
export type { ZodTypeAny } from 'zod'
