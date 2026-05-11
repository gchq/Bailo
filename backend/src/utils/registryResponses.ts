import type { ZodSchema } from 'zod'

import { z } from '../lib/zod.js'
import { InternalError } from './error.js'

/**
 * Important: while HTTP headers are case insensitive, TS always handles them as lower case
 * so definitions must also be lower case.
 */

const HeaderValueSchema = z.string()
// Common headers
export const CommonRegistryHeadersSchema = z
  .object({
    'docker-distribution-api-version': HeaderValueSchema.optional(),
    'content-type': HeaderValueSchema.optional(),
    'content-length': HeaderValueSchema.optional(),
    date: HeaderValueSchema.optional(),
  })
  .passthrough()
export type CommonRegistryHeaders = z.infer<typeof CommonRegistryHeadersSchema>

// Error response
const RegistryErrorDetailSchema = z.object({
  code: z.string(),
  message: z.string(),
  detail: z.unknown().optional(),
})
export const RegistryErrorResponseBodySchema = z.object({
  errors: z.array(RegistryErrorDetailSchema),
})
export type RegistryErrorResponseBody = z.infer<typeof RegistryErrorResponseBodySchema>

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

// GET /v2/
export const BaseApiCheckResponseHeadersSchema = CommonRegistryHeadersSchema.extend({
  'docker-distribution-api-version': z
    .string()
    .regex(/^registry\/2\.0$/)
    .optional(),
})
export const BaseApiCheckResponseBodySchema = z.record(z.never())

// GET /v2/<name>/tags/list
export const TagsListResponseBodySchema = z.object({
  name: z.string(),
  tags: z.array(z.string()).nullable(),
})
export const TagsListResponseHeadersSchema = CommonRegistryHeadersSchema.extend({
  link: HeaderValueSchema.optional(), // pagination
})

// GET /v2/_catalog
export const CatalogBodyResponseSchema = z.object({
  repositories: z.array(z.string()),
})
export const CatalogResponseHeadersSchema = TagsListResponseHeadersSchema

// GET /v2/<name>/blobs/<digest>
export const BlobResponseHeadersSchema = CommonRegistryHeadersSchema.extend({
  'docker-content-digest': HeaderValueSchema,
  etag: HeaderValueSchema.optional(),
})

// POST/PATCH/PUT blob upload
export const BlobUploadResponseHeadersSchema = CommonRegistryHeadersSchema.extend({
  location: HeaderValueSchema.optional(),
  range: HeaderValueSchema.optional(),
  'docker-upload-uuid': HeaderValueSchema.optional(),
})

// DELETE /v2/<name>/manifests/<reference>
export const DeleteManifestResponseHeadersSchema = CommonRegistryHeadersSchema.extend({
  'docker-content-digest': HeaderValueSchema.optional(),
})

// GET /v2/<name>/manifests/<reference>
export const DockerManifestMediaType = 'application/vnd.docker.distribution.manifest.v2+json'
export const OCIManifestMediaType = 'application/vnd.oci.image.manifest.v1+json'
export const OCIEmptyMediaType = 'application/vnd.oci.empty.v1+json'
export const ManifestMediaTypeSchema = z.enum([DockerManifestMediaType, OCIManifestMediaType])
export const AcceptManifestMediaTypeHeaderValue = ManifestMediaTypeSchema.options.join(',')
export const ManifestListMediaTypeSchema = z.enum([
  'application/vnd.docker.distribution.manifest.list.v2+json',
  'application/vnd.oci.image.index.v1+json',
])
export const AcceptManifestListMediaTypeHeaderValue = [
  ...ManifestListMediaTypeSchema.options,
  ...ManifestMediaTypeSchema.options,
].join(',')

const BaseDescriptorSchema = z.object({
  mediaType: z.string(),
  size: z.number().int().nonnegative(),
  digest: z.string(),
})
const DockerDescriptorSchema = BaseDescriptorSchema.extend({
  urls: z.array(z.string()).optional(),
})
const OCIAnnotationsSchema = z.record(z.string(), z.string())
const OCIDescriptorSchema = BaseDescriptorSchema.extend({
  urls: z.array(z.string()).optional(),
  annotations: OCIAnnotationsSchema.optional(),
  data: z.string().optional(),
  artifactType: z.string().optional(),
})
export const DescriptorsSchema = z.union([BaseDescriptorSchema, DockerDescriptorSchema, OCIDescriptorSchema])
export type Descriptors = z.infer<typeof DescriptorsSchema>

const DockerImageManifestV2Schema = z.object({
  schemaVersion: z.literal(2),
  mediaType: z.literal(DockerManifestMediaType),
  config: BaseDescriptorSchema,
  layers: z.array(DockerDescriptorSchema),
})

// helper for conditional setting
const OCIImageBaseManifestV2Schema = z.object({
  schemaVersion: z.literal(2),
  mediaType: z.literal(OCIManifestMediaType).optional(),
  artifactType: z.string().optional(),
  config: OCIDescriptorSchema,
  layers: z.array(OCIDescriptorSchema),
  subject: OCIDescriptorSchema.optional(),
  annotations: OCIAnnotationsSchema.optional(),
})
const OCIImageManifestV2Schema = z.discriminatedUnion('mediaType', [
  OCIImageBaseManifestV2Schema.extend({
    mediaType: z.literal(OCIManifestMediaType),
  }),
  OCIImageBaseManifestV2Schema.extend({
    mediaType: z.literal(OCIEmptyMediaType),
    artifactType: z.string(),
  }),
])

export const ImageManifestV2Schema = z.union([DockerImageManifestV2Schema, OCIImageManifestV2Schema])
export type ImageManifestV2 = z.infer<typeof ImageManifestV2Schema>

export const ManifestPlatformSchema = z
  .object({
    architecture: z.string(),
    os: z.string(),
    osVersion: z.string().optional(),
    osFeatures: z.array(z.string()).optional(),
    variant: z.string().optional(),
  })
  .optional()
export type ManifestPlatform = z.infer<typeof ManifestPlatformSchema>

const ManifestListDescriptorSchema = BaseDescriptorSchema.extend({
  platform: ManifestPlatformSchema,
})

export type ManifestListDescriptor = z.infer<typeof ManifestListDescriptorSchema>

export const ManifestListV2Schema = z.object({
  schemaVersion: z.literal(2),
  mediaType: ManifestListMediaTypeSchema.optional(),
  manifests: z.array(ManifestListDescriptorSchema),
})
export type ManifestListV2 = z.infer<typeof ManifestListV2Schema>

// TODO: handle multi-platform images
export const ManifestResponseBodySchema = z.union([ImageManifestV2Schema, ManifestListV2Schema])

export const ManifestResponseHeadersSchema = CommonRegistryHeadersSchema.extend({
  'docker-content-digest': HeaderValueSchema,
  etag: HeaderValueSchema.optional(),
})
export type ManifestResponseHeaders = z.infer<typeof ManifestResponseHeadersSchema>
