import type { ZodSchema } from 'zod'

import { z } from '../lib/zod.js'
import { InternalError } from './error.js'
import {
  ImageManifestV2,
  ImageManifestV2Schema,
  ManifestListMediaTypeSchema,
  ManifestListV2,
  ManifestListV2Schema,
  RegistryErrorResponseBody,
  RegistryErrorResponseBodySchema,
} from './registryResponseTypes.js'

export function parseRegistryResponse<T>(
  schema: ZodSchema<T>,
  body: unknown,
): { ok: true; data: T } | { ok: false; error: RegistryErrorResponseBody } {
  // expected successful response
  const success = schema.safeParse(body)
  if (success.success) {
    return { ok: true, data: success.data }
  }

  // fallback on error
  const error = RegistryErrorResponseBodySchema.safeParse(body)
  if (error.success) {
    return { ok: false, error: error.data }
  }

  // error not in expected format
  throw InternalError('Response did not match expected schema or RegistryErrorResponse.', { schema, body })
}

export const ManifestResponseBodySchema = z.union([ImageManifestV2Schema, ManifestListV2Schema])
export function isManifestList(manifest: ImageManifestV2 | ManifestListV2): manifest is ManifestListV2 {
  if ('mediaType' in manifest && ManifestListMediaTypeSchema.safeParse(manifest.mediaType).success) {
    return true
  }
  return 'manifests' in manifest
}
