import { z, ZodSchema } from 'zod'

import { InternalError } from './error.js'

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
  throw InternalError('Response did not match expected schema or RegistryErrorResponse.', { schema, body })
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
export const DockerManifestMediaType = 'application/vnd.docker.distribution.manifest.v2+json'
export const OCIManifestMediaType = 'application/vnd.oci.image.manifest.v1+json'
export const OCIEmptyMediaType = 'application/vnd.oci.empty.v1+json'
export const ManifestMediaType = z.enum([DockerManifestMediaType, OCIManifestMediaType])
export const AcceptManifestMediaTypeHeaderValue = ManifestMediaType.options.join(',')
export const ManifestListMediaType = z.enum([
  'application/vnd.docker.distribution.manifest.list.v2+json',
  'application/vnd.oci.image.index.v1+json',
])

const BaseDescriptor = z.object({
  mediaType: z.string(),
  size: z.number().int().nonnegative(),
  digest: z.string(),
})
const OCIAnnotations = z.record(z.string(), z.string())
const OCIDescriptor = BaseDescriptor.extend({
  urls: z.array(z.string()).optional(),
  annotations: OCIAnnotations.optional(),
  data: z.string().optional(),
  artifactType: z.string().optional(),
})

const DockerImageManifestV2 = z.object({
  schemaVersion: z.literal(2),
  mediaType: z.literal(DockerManifestMediaType),
  config: BaseDescriptor,
  layers: z.array(
    BaseDescriptor.extend({
      urls: z.array(z.string()).optional(),
    }),
  ),
})

// helper for conditional setting
const OCIImageBaseManifestV2 = z.object({
  schemaVersion: z.literal(2),
  mediaType: z.literal(OCIManifestMediaType).optional(),
  artifactType: z.string().optional(),
  config: OCIDescriptor,
  layers: z.array(OCIDescriptor),
  subject: OCIDescriptor.optional(),
  annotations: OCIAnnotations.optional(),
})
const OCIImageManifestV2 = z.discriminatedUnion('mediaType', [
  OCIImageBaseManifestV2.extend({
    mediaType: z.literal(OCIManifestMediaType),
  }),
  OCIImageBaseManifestV2.extend({
    mediaType: z.literal(OCIEmptyMediaType),
    artifactType: z.string(),
  }),
])

export const ImageManifestV2 = z.union([DockerImageManifestV2, OCIImageManifestV2])
export type ImageManifestV2 = z.infer<typeof ImageManifestV2>

const ManifestListDescriptor = BaseDescriptor.extend({
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

export const ManifestListV2 = z.object({
  schemaVersion: z.literal(2),
  mediaType: ManifestListMediaType.optional(),
  manifests: z.array(ManifestListDescriptor),
})
// TODO: handle multi-platform images
export const ManifestResponseBody = z.union([ImageManifestV2, ManifestListV2])

export const ManifestResponseHeaders = CommonRegistryHeaders.extend({
  'docker-content-digest': HeaderValue,
  etag: HeaderValue.optional(),
})
