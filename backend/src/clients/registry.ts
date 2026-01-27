import { Readable } from 'node:stream'

import { BodyInit, HeadersInit, RequestInit } from 'undici-types'
import { ZodSchema } from 'zod'

import { ImageRefInterface, RepoRefInterface } from '../models/Release.js'
import { getHttpsUndiciAgent } from '../services/http.js'
import log from '../services/log.js'
import { isRegistryError } from '../types/RegistryError.js'
import config from '../utils/config.js'
import { InternalError, RegistryError } from '../utils/error.js'
import {
  AcceptManifestMediaTypeHeaderValue,
  BaseApiCheckResponseBody,
  BaseApiCheckResponseHeaders,
  BlobResponseHeaders,
  BlobUploadResponseHeaders,
  CatalogBodyResponse,
  CatalogResponseHeaders,
  CommonRegistryHeaders,
  DeleteManifestResponseHeaders,
  ImageManifestV2,
  ManifestResponseHeaders,
  RegistryErrorResponseBody,
  TagsListResponseBody,
  TagsListResponseHeaders,
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
  bodySchema?: ZodSchema<TBody>
  headersSchema?: ZodSchema<THeaders>
  expectStream?: boolean
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

async function readBody(res: Response, expectStream: boolean): Promise<{ body?: unknown; stream?: Readable }> {
  if (expectStream) {
    if (!res.body) {
      return {}
    }
    return {
      stream: res.body instanceof ReadableStream ? Readable.fromWeb(res.body) : (res.body as any),
    }
  }

  if (isJsonContentType(res.headers.get('content-type'))) {
    return { body: await res.json() }
  }

  return { body: await res.text() }
}

async function registryRequest<TBody = unknown, THeaders = CommonRegistryHeaders>(
  token: string,
  endpoint: string,
  {
    bodySchema,
    headersSchema = CommonRegistryHeaders as unknown as ZodSchema<THeaders>,
    expectStream = false,
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

    const { body: rawBody, stream } = await readBody(res, expectStream)
    const context = {
      url: res.url,
      status: res.status,
      statusText: res.statusText,
    }

    // check response
    if (!res.ok) {
      controller.abort()
      if (rawBody && RegistryErrorResponseBody.safeParse(rawBody).success) {
        throw RegistryError(RegistryErrorResponseBody.parse(rawBody), context)
      }

      throw InternalError('Unrecognised registry error response.', {
        ...context,
        body: rawBody,
      })
    }

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

export async function getApiVersion(token: string) {
  const result = await registryRequest(token, '', {
    bodySchema: BaseApiCheckResponseBody,
    headersSchema: BaseApiCheckResponseHeaders,
  })

  return result.headers['docker-distribution-api-version']
}

export async function listModelRepos(token: string, modelId: string): Promise<string[]> {
  const result = await registryRequest(token, '_catalog?n=100', {
    bodySchema: CatalogBodyResponse,
    headersSchema: CatalogResponseHeaders,
    pagination: {
      enabled: true,
      aggregate: (acc, next) => ({
        repositories: [...acc.repositories, ...next.repositories],
      }),
    },
  })

  const repositories = result.body?.repositories ?? []
  return repositories.filter((repo) => repo.startsWith(modelId))
}

export async function listImageTags(token: string, repoRef: RepoRefInterface) {
  try {
    const result = await registryRequest(token, `${repoRef.repository}/${repoRef.name}/tags/list`, {
      bodySchema: TagsListResponseBody,
      headersSchema: TagsListResponseHeaders,
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

export async function getImageTagManifest(token: string, imageRef: ImageRefInterface) {
  // TODO: handle multi-platform images
  const result = await registryRequest(token, `${imageRef.repository}/${imageRef.name}/manifests/${imageRef.tag}`, {
    bodySchema: ImageManifestV2,
    headersSchema: ManifestResponseHeaders,
    extraHeaders: {
      Accept: AcceptManifestMediaTypeHeaderValue,
    },
  })

  return { body: result.body, headers: result.headers }
}

export async function getRegistryLayerStream(
  token: string,
  repoRef: RepoRefInterface,
  layerDigest: string,
): Promise<{ stream: Readable; abort: () => void }> {
  const result = await registryRequest(token, `${repoRef.repository}/${repoRef.name}/blobs/${layerDigest}`, {
    headersSchema: BlobResponseHeaders,
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

export async function doesLayerExist(token: string, repoRef: RepoRefInterface, digest: string) {
  try {
    await registryRequest(token, `${repoRef.repository}/${repoRef.name}/blobs/${digest}`, {
      expectStream: true,
      extraFetchOptions: {
        method: 'HEAD',
      },
    })
    return true
  } catch (error) {
    if (typeof error === 'object' && error !== null && error['context']['status'] === 404) {
      // 404 response indicates that the layer does not exist
      return false
    } else {
      throw error
    }
  }
}

export async function initialiseUpload(token: string, repoRef: RepoRefInterface) {
  const result = await registryRequest(token, `${repoRef.repository}/${repoRef.name}/blobs/uploads/`, {
    headersSchema: BlobUploadResponseHeaders,
    expectStream: true,
    extraFetchOptions: {
      method: 'POST',
    },
  })

  return result.headers
}

export async function putManifest(token: string, imageRef: ImageRefInterface, manifest: BodyInit, contentType: string) {
  const result = await registryRequest(token, `${imageRef.repository}/${imageRef.name}/manifests/${imageRef.tag}`, {
    headersSchema: ManifestResponseHeaders,
    expectStream: true,
    extraFetchOptions: {
      method: 'PUT',
      body: manifest,
    },
    extraHeaders: {
      'Content-Type': contentType,
      name: `${imageRef.repository}/${imageRef.name}`,
      reference: imageRef.tag,
    },
  })

  return result.headers
}

export async function uploadLayerMonolithic(
  token: string,
  uploadURL: string,
  digest: string,
  blob: Readable | ReadableStream,
  size: string,
) {
  const result = await registryRequest(token, `${uploadURL}&digest=${digest}`.replace(/^(\/v2\/)/, ''), {
    headersSchema: BlobUploadResponseHeaders,
    expectStream: true,
    extraFetchOptions: {
      method: 'PUT',
      body: blob,
      duplex: 'half',
      window: null,
      redirect: 'error',
    },
    extraHeaders: {
      'content-length': size,
      'content-type': 'application/octet-stream',
    },
  })

  return result.headers
}

export async function mountBlob(
  token: string,
  sourceRepoRef: RepoRefInterface,
  destinationRepoRef: RepoRefInterface,
  blobDigest: string,
) {
  const result = await registryRequest(
    token,
    `${destinationRepoRef.repository}/${destinationRepoRef.name}/blobs/uploads/?from=${sourceRepoRef.repository}/${sourceRepoRef.name}&mount=${blobDigest}`,
    {
      headersSchema: BlobUploadResponseHeaders,
      extraFetchOptions: {
        method: 'POST',
      },
      extraHeaders: { 'Content-Length': '0' },
    },
  )

  return result.headers
}

export async function deleteManifest(token: string, imageRef: ImageRefInterface) {
  const result = await registryRequest(token, `${imageRef.repository}/${imageRef.name}/manifests/${imageRef.tag}`, {
    headersSchema: DeleteManifestResponseHeaders,
    expectStream: true,
    extraFetchOptions: {
      method: 'DELETE',
    },
    extraHeaders: { Accept: AcceptManifestMediaTypeHeaderValue },
  })

  return result.headers
}
