import { z, ZodSchema } from 'zod'

import { InternalError } from '../utils/error.js'

/**
 * Important: while HTTP headers are case insensitive, TS always handles them as lower case
 * so definitions must also be lower case.
 */

export const HeaderValue = z.string()
// Common headers
export const CommonRegistryHeaders = z
  .object({
    'docker-distribution-api-version': HeaderValue.optional(),
    'content-type': HeaderValue.optional(),
    'content-length': HeaderValue.optional(),
    date: HeaderValue.optional(),
  })
  .passthrough()
export type CommonRegistryHeaders = z.infer<typeof CommonRegistryHeaders>

// Error response
export const RegistryErrorDetail = z.object({
  code: z.string(),
  message: z.string(),
  detail: z.unknown().optional(),
})
export const RegistryErrorResponse = z.object({
  errors: z.array(RegistryErrorDetail),
})
export type RegistryErrorResponse = z.infer<typeof RegistryErrorResponse>

export function parseRegistryResponse<T>(
  schema: ZodSchema<T>,
  body: unknown,
): { ok: true; data: T } | { ok: false; error: RegistryErrorResponse } {
  // expected successful response
  const success = schema.safeParse(body)
  if (success.success) {
    return { ok: true, data: success.data }
  }

  // fallback on error
  const error = RegistryErrorResponse.safeParse(body)
  if (error.success) {
    return { ok: false, error: error.data }
  }

  // error not in expected format
  throw InternalError('Response did not match expected schema or RegistryErrorResponse', { schema, body })
}

// GET /v2/
export const BaseApiCheckHeaders = CommonRegistryHeaders.extend({
  'docker-distribution-api-version': z
    .string()
    .regex(/^registry\/2\.0$/)
    .optional(),
})
export const BaseApiCheckResponse = z.record(z.never())

// GET /v2/<name>/tags/list
export const TagsListResponse = z.object({
  name: z.string(),
  tags: z.array(z.string()).nullable(),
})
export const TagsListHeaders = CommonRegistryHeaders.extend({
  link: HeaderValue.optional(), // pagination
})

// GET /v2/_catalog
export const CatalogResponse = z.object({
  repositories: z.array(z.string()),
})
export const CatalogHeaders = TagsListHeaders

// GET /v2/<name>/blobs/<digest>
export const BlobHeaders = CommonRegistryHeaders.extend({
  'docker-content-digest': HeaderValue,
  etag: HeaderValue.optional(),
})

// POST/PATCH/PUT blob upload
export const BlobUploadHeaders = CommonRegistryHeaders.extend({
  location: HeaderValue.optional(),
  range: HeaderValue.optional(),
  'docker-upload-uuid': HeaderValue.optional(),
})

// DELETE /v2/<name>/manifests/<reference>
export const DeleteManifestHeaders = CommonRegistryHeaders.extend({
  'docker-content-digest': HeaderValue.optional(),
})

// GET /v2/<name>/manifests/<reference>
export const ManifestMediaType = z.enum([
  'application/vnd.docker.distribution.manifest.v2+json',
  'application/vnd.oci.image.manifest.v1+json',
])
export const ManifestListMediaType = z.enum([
  'application/vnd.docker.distribution.manifest.list.v2+json',
  'application/vnd.oci.image.index.v1+json',
])

export const Descriptor = z.object({
  mediaType: z.string(),
  size: z.number().int().nonnegative(),
  digest: z.string(),
  platform: z
    .object({
      architecture: z.string(),
      os: z.string(),
      osVersion: z.string().optional(),
      osFeatures: z.array(z.string()).optional(),
      variant: z.string().optional(),
    })
    .optional(),
})

export const ImageManifestV2 = z.object({
  schemaVersion: z.literal(2),
  mediaType: ManifestMediaType.optional(),
  config: Descriptor,
  layers: z.array(Descriptor),
})

export const ManifestListV2 = z.object({
  schemaVersion: z.literal(2),
  mediaType: ManifestListMediaType.optional(),
  manifests: z.array(Descriptor),
})
// TODO: handle multi-platform images
export const ManifestResponseBody = z.union([ImageManifestV2.passthrough(), ManifestListV2.passthrough()])

export const ManifestHeaders = CommonRegistryHeaders.extend({
  'docker-content-digest': HeaderValue,
  etag: HeaderValue.optional(),
})
