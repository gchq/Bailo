import { Readable } from 'node:stream'

import FormData from 'form-data'
import fetch, { Response as FetchResponse } from 'node-fetch'

import { z } from '../lib/zod.js'
import config from '../utils/config.js'
import { BadReq, InternalError } from '../utils/error.js'

const ArtefactScanInfoResponse = z.object({
  apiName: z.string(),
  apiVersion: z.string(),
  modelscanScannerName: z.string(),
  modelscanVersion: z.string(),
  trivyScannerName: z.string(),
  trivyVersion: z.string(),
})

export const ModelScanResponse = z.object({
  summary: z.object({
    total_issues: z.number().nonnegative(),
    total_issues_by_severity: z.object({
      LOW: z.number().nonnegative(),
      MEDIUM: z.number().nonnegative(),
      HIGH: z.number().nonnegative(),
      CRITICAL: z.number().nonnegative(),
    }),
    input_path: z.string(),
    absolute_path: z.string(),
    modelscan_version: z.string(),
    timestamp: z.string(),
    scanned: z.object({
      total_scanned: z.number().nonnegative(),
      scanned_files: z.array(z.string()).optional(),
    }),
    skipped: z.object({
      total_skipped: z.number().nonnegative(),
      skipped_files: z
        .array(
          z.object({
            category: z.string(),
            description: z.string(),
            source: z.string(),
          }),
        )
        .optional(),
    }),
  }),
  issues: z.array(
    z.object({
      description: z.string(),
      operator: z.string(),
      module: z.string(),
      source: z.string(),
      scanner: z.string(),
      severity: z.string(),
    }),
  ),
  errors: z.array(
    z.object({
      category: z.string(),
      description: z.string(),
      source: z.string(),
    }),
  ),
})
export type ModelScanResponse = z.infer<typeof ModelScanResponse>

// There's no formal definition of the JSON schema so this must be permissive
const ImageHistorySchema = z
  .object({
    created: z.string().optional(),
    created_by: z.string().optional(),
    comment: z.string().optional(),
    empty_layer: z.boolean().optional(),
  })
  .passthrough()

const ImageConfigSchema = z
  .object({
    architecture: z.string().optional(),
    created: z.string().optional(),
    history: z.array(ImageHistorySchema).optional(),
    os: z.string().optional(),
    rootfs: z
      .object({
        type: z.string().optional(),
        diff_ids: z.array(z.string()).optional(),
      })
      .passthrough()
      .optional(),
    config: z
      .object({
        Cmd: z.array(z.string()).optional(),
        Env: z.array(z.string()).optional(),
        WorkingDir: z.string().optional(),
        ArgsEscaped: z.boolean().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough()

const VulnerabilitySchema = z
  .object({
    VulnerabilityID: z.string(),
    PkgID: z.string().optional(),
    PkgName: z.string(),
    PkgIdentifier: z
      .object({
        PURL: z.string(),
        UID: z.string(),
      })
      .passthrough()
      .optional(),
    InstalledVersion: z.string().optional(),
    FixedVersion: z.string().optional(),
    Status: z.string().optional(),
    Layer: z
      .object({
        DiffID: z.string().optional(),
      })
      .passthrough()
      .optional(),
    PrimaryURL: z.string().url().optional(),
    DataSource: z
      .object({
        ID: z.string().optional(),
        Name: z.string().optional(),
        URL: z.string().url().optional(),
      })
      .passthrough()
      .optional(),
    Title: z.string().optional(),
    Description: z.string().optional(),
    Severity: z.string().optional(),
    CweIDs: z.array(z.string()).optional(),
    VendorSeverity: z.record(z.number()).optional(),
    CVSS: z
      .record(
        z
          .object({
            V3Vector: z.string().optional(),
            V3Score: z.number().optional(),
          })
          .passthrough()
          .optional(),
      )
      .optional(),
    References: z.array(z.string().url()).optional(),
    PublishedDate: z.string().optional(),
    LastModifiedDate: z.string().optional(),
  })
  .passthrough()

const ResultSchema = z
  .object({
    Target: z.string(),
    Class: z.string().optional(),
    Type: z.string(),
    Vulnerabilities: z.array(VulnerabilitySchema).optional(),
    Misconfigurations: z.array(z.unknown()).optional(),
    Secrets: z.array(z.unknown()).optional(),
    Licenses: z.array(z.unknown()).optional(),
  })
  .passthrough()

export const TrivyScanResultResponse = z
  .object({
    SchemaVersion: z.literal(2),
    CreatedAt: z.string().optional(),
    ArtifactName: z.string(),
    ArtifactType: z.string().optional(),
    Metadata: z
      .object({
        OS: z
          .object({
            Family: z.string().optional(),
            Name: z.string().optional(),
          })
          .passthrough()
          .optional(),
        ImageID: z.string().optional(),
        DiffIDs: z.array(z.string()).optional(),
        RepoTags: z.array(z.string()).optional(),
        RepoDigests: z.array(z.string()).optional(),
        ImageConfig: ImageConfigSchema.optional(),
      })
      .passthrough()
      .optional(),
    Results: z.array(ResultSchema).optional(),
  })
  .passthrough()
export type TrivyScanResultResponse = z.infer<typeof TrivyScanResultResponse>

async function getArtefactScanInfo() {
  const url = `${config.artefactScanning.artefactscan.protocol}://${config.artefactScanning.artefactscan.host}:${config.artefactScanning.artefactscan.port}`
  let res: FetchResponse

  try {
    res = await fetch(`${url}/info`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    throw InternalError('Unable to communicate with the ArtefactScan service.', { err })
  }
  if (!res.ok) {
    throw BadReq('Unrecognised response returned by the ArtefactScan service.')
  }

  return ArtefactScanInfoResponse.parse(await res.json())
}

async function scanStream(stream: Readable, fileName: string, endpoint: 'file' | 'image') {
  const url = `${config.artefactScanning.artefactscan.protocol}://${config.artefactScanning.artefactscan.host}:${config.artefactScanning.artefactscan.port}`
  let res: FetchResponse

  try {
    const formData = new FormData()
    formData.append('in_file', stream, { filename: fileName, contentType: 'application/octet-stream' })

    res = await fetch(`${url}/scan/${endpoint}`, {
      method: 'POST',
      headers: {
        ...formData.getHeaders(),
        accept: 'application/json',
      },
      body: formData,
    })
  } catch (err) {
    stream.destroy()
    throw InternalError('Unable to communicate with the ArtefactScan service.', { err })
  }
  if (!res.ok) {
    throw BadReq('Unrecognised response returned by the ArtefactScan service.', {
      body: JSON.stringify(await res.text()),
    })
  }

  return await res.json()
}

export async function scanFileStream(stream: Readable, fileName: string) {
  return ModelScanResponse.parse(await scanStream(stream, fileName, 'file'))
}

export async function scanImageBlobStream(stream: Readable, blobDigest: string) {
  return TrivyScanResultResponse.parse(await scanStream(stream, blobDigest, 'image'))
}

// 5 mins
const CACHE_TTL_MS = 5 * 60 * 1000
let cachedArtefactScanInfo: { value: z.infer<typeof ArtefactScanInfoResponse>; expiresAt: number } | undefined
export async function getCachedArtefactScanInfo() {
  const now = Date.now()

  if (!cachedArtefactScanInfo || cachedArtefactScanInfo.expiresAt < now) {
    cachedArtefactScanInfo = {
      value: await getArtefactScanInfo(),
      expiresAt: now + CACHE_TTL_MS,
    }
  }

  return cachedArtefactScanInfo.value
}
