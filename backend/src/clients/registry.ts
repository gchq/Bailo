import { Readable } from 'node:stream'

import { BodyInit, HeadersInit, RequestInit } from 'undici-types'
import type { ZodType, ZodTypeDef } from 'zod'

import { ImageDigestRef, ImageNameRef, ImageRef } from '../models/Release.js'
import { getHttpsUndiciAgent } from '../services/http.js'
import log from '../services/log.js'
import { isRegistryError } from '../types/RegistryError.js'
import config from '../utils/config.js'
import { InternalError, RegistryError } from '../utils/error.js'
import {
  AcceptManifestListMediaTypeHeaderValue,
  AcceptManifestMediaTypeHeaderValue,
  BaseApiCheckResponseBodySchema,
  BaseApiCheckResponseHeadersSchema,
  BlobResponseHeadersSchema,
  BlobUploadResponseHeadersSchema,
  CatalogBodyResponseSchema,
  CatalogResponseHeadersSchema,
  CommonRegistryHeaders,
  CommonRegistryHeadersSchema,
  DeleteManifestResponseHeadersSchema,
  ManifestResponseBodySchema,
  ManifestResponseHeadersSchema,
  RegistryErrorResponseBodySchema,
  TagsListResponseBodySchema,
  TagsListResponseHeadersSchema,
} from '../utils/registryResponses.js'

const registry = config.registry.connection.internal

const agent = getHttpsUndiciAgent({
  connect: { rejectUnauthorized: !config.registry.connection.insecure },
})

interface RegistryRequestResult<TBody, THeaders> {
  headers: THeaders
  body?: TBody
  stream?: Readable
  abort: () => void
  status: number
  statusText: string
  url: string
}

interface PaginationOptions<TBody> {
  enabled?: boolean
  maxPages?: number
  aggregate?: (acc: TBody, next: TBody) => TBody
}

interface RegistryRequestOptions<TBody, THeaders> {
  bodySchema?: ZodType<TBody, ZodTypeDef, any>
  headersSchema?: ZodType<THeaders, ZodTypeDef, any>
  expectStream?: boolean
  forceText?: boolean
  extraFetchOptions?: Partial<Omit<RequestInit, 'headers' | 'dispatcher' | 'signal'>>
  extraHeaders?: HeadersInit
  pagination?: PaginationOptions<TBody>
}

function normaliseHeaders(headers: Headers): Record<string, string> {
  return Object.fromEntries(headers.entries())
}

function isJsonContentType(contentType: string | null): boolean {
  return Boolean(contentType && contentType.includes('json'))
}

function parseNextLink(linkHeader: string | null): string | undefined {
  if (!linkHeader) {
    return
  }

  const links = linkHeader.split(',')
  for (const link of links) {
    const match = link.match(/<([^>]+)>\s*;\s*rel="?next"?/i)
    if (match) {
      return match[1]
    }
  }
}

async function readBody(
  res: Response,
  expectStream: boolean,
  forceText = false,
): Promise<{ body?: unknown; stream?: Readable }> {
  if (expectStream) {
    if (!res.body) {
      return {}
    }
    return {
      stream: res.body instanceof ReadableStream ? Readable.fromWeb(res.body) : (res.body as any),
    }
  }

  if (forceText) {
    return { body: await res.text() }
  }

  try {
    if (isJsonContentType(res.headers.get('content-type'))) {
      return { body: await res.json() }
    }
  } catch {
    // NOOP because sometimes the header doesn't suggest this is JSON
  }

  return { body: await res.text() }
}

async function registryRequest<TBody = unknown, THeaders = CommonRegistryHeaders>(
  token: string,
  endpoint: string,
  {
    bodySchema,
    headersSchema = CommonRegistryHeadersSchema as unknown as ZodType<THeaders, ZodTypeDef, any>,
    expectStream = false,
    forceText = false,
    extraFetchOptions = {},
    extraHeaders = {},
    pagination,
  }: RegistryRequestOptions<TBody, THeaders> = {},
): Promise<RegistryRequestResult<TBody, THeaders>> {
  const controller = new AbortController()

  let res!: Response
  let accumulatedBody: TBody | undefined
  let headers!: THeaders

  let url: string | undefined = `${registry}/v2/${endpoint}`
  let pageCount = 0
  const maxPages = pagination?.maxPages ?? 100

  while (url) {
    if (pageCount++ >= maxPages) {
      throw InternalError('Registry pagination limit exceeded.', {
        maxPages,
        endpoint,
      })
    }

    log.trace({ url, extraHeaders }, 'Making request to the registry.')

    try {
      res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          ...extraHeaders,
        },
        dispatcher: agent,
        signal: controller.signal,
        ...extraFetchOptions,
      })
    } catch (err) {
      throw InternalError('Unable to communicate with the registry.', { err })
    }

    const { body: rawBody, stream } = await readBody(res, expectStream && res.ok, forceText)
    const context = {
      url: res.url,
      status: res.status,
      statusText: res.statusText,
    }

    // check response
    if (!res.ok) {
      controller.abort()
      if (rawBody && RegistryErrorResponseBodySchema.safeParse(rawBody).success) {
        throw RegistryError(RegistryErrorResponseBodySchema.parse(rawBody), context)
      }

      // allow callers to handle plain 404s without registry error body
      if (res.status === 404) {
        throw RegistryError({ errors: [{ code: 'NAME_UNKNOWN', message: 'Not found', detail: [] }] }, context)
      }

      throw InternalError('Unrecognised registry error response.', {
        ...context,
        body: rawBody,
      })
    }

    // headers
    const rawHeaders = normaliseHeaders(res.headers)
    const parsedHeaders = headersSchema.safeParse(rawHeaders)
    if (!parsedHeaders.success) {
      controller.abort()
      throw InternalError('Registry returned invalid headers.', {
        issues: parsedHeaders.error.format(),
      })
    }
    headers = parsedHeaders.data
    log.trace({ headers }, 'Headers received from the registry.')

    // streamed response
    if (expectStream) {
      return {
        headers,
        stream,
        abort: () => controller.abort(),
        ...context,
      }
    }

    // json response
    let parsedBody: TBody | undefined
    if (bodySchema) {
      const parsed = bodySchema.safeParse(rawBody)
      if (!parsed.success) {
        controller.abort()
        throw InternalError('Registry response body validation failed.', {
          issues: parsed.error.format(),
        })
      }

      parsedBody = parsed.data
    } else {
      parsedBody = rawBody as TBody
    }

    if (parsedBody !== undefined) {
      if (accumulatedBody && pagination?.aggregate) {
        accumulatedBody = pagination.aggregate(accumulatedBody, parsedBody)
      } else {
        accumulatedBody = parsedBody
      }
    }

    // pagination
    if (pagination?.enabled && res.headers.get('link')) {
      url = `${registry}/${parseNextLink(res.headers.get('link'))}`
    } else {
      url = undefined
    }
  }

  return {
    headers,
    body: accumulatedBody,
    abort: () => controller.abort(),
    status: res.status,
    statusText: res.statusText,
    url: res.url,
  }
}

function getImageRefId(imageRef: ImageRef): string {
  return 'tag' in imageRef ? imageRef.tag : imageRef.digest
}

export async function getApiVersion(token: string) {
  const result = await registryRequest(token, '', {
    bodySchema: BaseApiCheckResponseBodySchema,
    headersSchema: BaseApiCheckResponseHeadersSchema,
  })

  return result.headers['docker-distribution-api-version']
}

export async function listModelRepos(token: string, modelId: string): Promise<string[]> {
  const result = await registryRequest(token, '_catalog?n=100', {
    bodySchema: CatalogBodyResponseSchema,
    headersSchema: CatalogResponseHeadersSchema,
    pagination: {
      enabled: true,
      aggregate: (acc, next) => ({
        repositories: [...acc.repositories, ...next.repositories],
      }),
    },
  })

  const repositories = result.body?.repositories ?? []
  return repositories.filter((repo) => repo.startsWith(`${modelId}/`))
}

export async function listImageTags(token: string, repoRef: ImageNameRef) {
  try {
    const result = await registryRequest(token, `${repoRef.repository}/${repoRef.name}/tags/list`, {
      bodySchema: TagsListResponseBodySchema,
      headersSchema: TagsListResponseHeadersSchema,
      pagination: {
        enabled: true,
        aggregate: (acc, next) => ({
          name: acc.name,
          tags: [...(acc.tags || []), ...(next.tags || [])],
        }),
      },
    })

    return result.body?.tags || []
  } catch (error) {
    if (isRegistryError(error) && error.errors.length === 1 && error.errors.at(0)?.code === 'NAME_UNKNOWN') {
      return []
    }
    throw error
  }
}

export async function getImageTagManifests(token: string, imageRef: ImageRef) {
  const result = await registryRequest(
    token,
    `${imageRef.repository}/${imageRef.name}/manifests/${getImageRefId(imageRef)}`,
    {
      bodySchema: ManifestResponseBodySchema,
      headersSchema: ManifestResponseHeadersSchema,
      extraHeaders: {
        Accept: AcceptManifestListMediaTypeHeaderValue,
      },
    },
  )

  return { body: result.body, headers: result.headers }
}

export async function getImageTagManifestsRaw(token: string, imageRef: ImageRef) {
  const result = await registryRequest(
    token,
    `${imageRef.repository}/${imageRef.name}/manifests/${getImageRefId(imageRef)}`,
    {
      headersSchema: ManifestResponseHeadersSchema,
      forceText: true,
      extraHeaders: {
        Accept: AcceptManifestListMediaTypeHeaderValue,
      },
    },
  )
  // The digest for the manifest within a multiplatform image is hard to get
  // Force text mode to preserve exact bytes for digest calculation
  return { body: result.body as string, headers: result.headers }
}

export async function getRegistryLayerStream(
  token: string,
  repoRef: ImageNameRef,
  layerDigest: string,
): Promise<{ stream: Readable; abort: () => void }> {
  const result = await registryRequest(token, `${repoRef.repository}/${repoRef.name}/blobs/${layerDigest}`, {
    headersSchema: BlobResponseHeadersSchema,
    expectStream: true,
    extraHeaders: {
      Accept: AcceptManifestMediaTypeHeaderValue,
    },
  })

  if (!result.stream || !(result.stream instanceof Readable)) {
    result.abort()
    throw InternalError('Unrecognised response stream when getting image layer blob.', {
      stream: result.stream,
      repoRef,
      layerDigest,
    })
  }

  return { stream: result.stream, abort: result.abort }
}

/**
 * Checks for the existence of a blob in the registry via a `HEAD` request.
 * A 200 response indicates the layer exists. No response body is returned.
 * See https://distribution.github.io/distribution/spec/api/#existing-layers
 *
 * @param token {string} Registry authentication token.
 * @param digestRef {ImageDigestRef} Repository, name, and digest of the blob to check.
 * @returns The response from the registry request.
 */
export async function headLayer(token: string, digestRef: ImageDigestRef) {
  return await registryRequest(token, `${digestRef.repository}/${digestRef.name}/blobs/${digestRef.digest}`, {
    expectStream: true,
    extraFetchOptions: {
      method: 'HEAD',
    },
  })
}

/**
 * Determines whether a blob exists in the registry by issuing a `HEAD` request.
 * Returns `true` if the layer is present, or `false` on a 404 response.
 * Any other error is rethrown.
 *
 * @param token {string} Registry authentication token.
 * @param digestRef {ImageDigestRef} Repository, name, and digest of the blob to check.
 * @returns {Promise<boolean>} `true` if the layer exists, `false` if not found.
 */
export async function doesLayerExist(token: string, digestRef: ImageDigestRef): Promise<boolean> {
  try {
    await headLayer(token, digestRef)
    return true
  } catch (error) {
    if (error && isRegistryError(error) && error?.context?.status === 404) {
      // 404 response indicates that the layer does not exist
      return false
    } else {
      throw error
    }
  }
}

export async function initialiseUpload(token: string, repoRef: ImageNameRef) {
  const result = await registryRequest(token, `${repoRef.repository}/${repoRef.name}/blobs/uploads/`, {
    headersSchema: BlobUploadResponseHeadersSchema,
    expectStream: true,
    extraFetchOptions: {
      method: 'POST',
    },
  })

  return result.headers
}

export async function putManifest(token: string, imageRef: ImageRef, manifest: BodyInit, contentType?: string) {
  const result = await registryRequest(
    token,
    `${imageRef.repository}/${imageRef.name}/manifests/${getImageRefId(imageRef)}`,
    {
      headersSchema: ManifestResponseHeadersSchema,
      expectStream: true,
      extraFetchOptions: {
        method: 'PUT',
        body: manifest,
      },
      extraHeaders: {
        'Content-Type': contentType,
        name: `${imageRef.repository}/${imageRef.name}`,
        reference: getImageRefId(imageRef),
      },
    },
  )

  return result.headers
}

export async function uploadLayerMonolithic(
  token: string,
  uploadURL: string,
  digest: string,
  blob: Readable | ReadableStream,
) {
  const result = await registryRequest(token, `${uploadURL}&digest=${digest}`.replace(/^(\/v2\/)/, ''), {
    headersSchema: BlobUploadResponseHeadersSchema,
    expectStream: true,
    extraFetchOptions: {
      method: 'PUT',
      body: blob,
      duplex: 'half',
      window: null,
      redirect: 'error',
    },
    extraHeaders: {
      'content-type': 'application/octet-stream',
    },
  })

  return result.headers
}

export async function mountBlob(
  token: string,
  sourceRepoRef: ImageNameRef,
  destinationRepoRef: ImageNameRef,
  blobDigest: string,
) {
  const result = await registryRequest(
    token,
    `${destinationRepoRef.repository}/${destinationRepoRef.name}/blobs/uploads/?from=${sourceRepoRef.repository}/${sourceRepoRef.name}&mount=${blobDigest}`,
    {
      headersSchema: BlobUploadResponseHeadersSchema,
      extraFetchOptions: {
        method: 'POST',
      },
    },
  )

  return result.headers
}

export async function deleteManifest(token: string, imageRef: ImageRef) {
  const result = await registryRequest(
    token,
    `${imageRef.repository}/${imageRef.name}/manifests/${getImageRefId(imageRef)}`,
    {
      headersSchema: DeleteManifestResponseHeadersSchema,
      expectStream: true,
      extraFetchOptions: {
        method: 'DELETE',
      },
      extraHeaders: { Accept: AcceptManifestMediaTypeHeaderValue },
    },
  )

  return result.headers
}
