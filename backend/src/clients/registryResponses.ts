import { z, ZodSchema } from 'zod'

import { InternalError } from '../utils/error.js'

/**
 * Important: while HTTP headers are case insensitive, TS always handles them as lower case
 * so definitions must also be lower case.
 */

const HeaderValue = z.string()
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
const RegistryErrorDetail = z.object({
  code: z.string(),
  message: z.string(),
  detail: z.unknown().optional(),
})
export const RegistryErrorResponseBody = z.object({
  errors: z.array(RegistryErrorDetail),
})
export type RegistryErrorResponseBody = z.infer<typeof RegistryErrorResponseBody>

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
  const error = RegistryErrorResponseBody.safeParse(body)
  if (error.success) {
    return { ok: false, error: error.data }
  }

  // error not in expected format
  throw InternalError('Response did not match expected schema or RegistryErrorResponse', { schema, body })
}

// GET /v2/
export const BaseApiCheckResponseHeaders = CommonRegistryHeaders.extend({
  'docker-distribution-api-version': z
    .string()
    .regex(/^registry\/2\.0$/)
    .optional(),
})
export const BaseApiCheckResponseBody = z.record(z.never())

// GET /v2/<name>/tags/list
export const TagsListResponseBody = z.object({
  name: z.string(),
  tags: z.array(z.string()).nullable(),
})
export const TagsListResponseHeaders = CommonRegistryHeaders.extend({
  link: HeaderValue.optional(), // pagination
})

// GET /v2/_catalog
export const CatalogBodyResponse = z.object({
  repositories: z.array(z.string()),
})
export const CatalogResponseHeaders = TagsListResponseHeaders

// GET /v2/<name>/blobs/<digest>
export const BlobResponseHeaders = CommonRegistryHeaders.extend({
  'docker-content-digest': HeaderValue,
  etag: HeaderValue.optional(),
})

// POST/PATCH/PUT blob upload
export const BlobUploadResponseHeaders = CommonRegistryHeaders.extend({
  location: HeaderValue.optional(),
  range: HeaderValue.optional(),
  'docker-upload-uuid': HeaderValue.optional(),
})

// DELETE /v2/<name>/manifests/<reference>
export const DeleteManifestResponseHeaders = CommonRegistryHeaders.extend({
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

const Descriptor = z.object({
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
// TODO: handle OCI Image Spec https://github.com/opencontainers/image-spec/blob/main/manifest.md
// TODO: handle multi-platform images
export const ManifestResponseBody = z.union([ImageManifestV2.passthrough(), ManifestListV2.passthrough()])

export const ManifestResponseHeaders = CommonRegistryHeaders.extend({
  'docker-content-digest': HeaderValue,
  etag: HeaderValue.optional(),
})
