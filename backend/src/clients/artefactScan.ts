import { Readable } from 'node:stream'

import FormData from 'form-data'
import fetch, { Response as FetchResponse } from 'node-fetch'

import { z } from '../lib/zod.js'
import config from '../utils/config.js'
import { BadReq, InternalError } from '../utils/error.js'

interface ArtefactScanInfoResponse {
  apiName: string
  apiVersion: string
  modelscanScannerName: string
  modelscanVersion: string
  trivyScannerName: string
  trivyVersion: string
}

interface ModelScanResponse {
  summary: {
    total_issues: number
    total_issues_by_severity: {
      LOW: number
      MEDIUM: number
      HIGH: number
      CRITICAL: number
    }
    input_path: string
    absolute_path: string
    modelscan_version: string
    timestamp: string
    scanned: {
      total_scanned: number
      scanned_files: string[]
    }
    skipped: {
      total_skipped: number
      skipped_files: string[]
    }
  }
  issues: {
    description: string
    operator: string
    module: string
    source: string
    scanner: string
    severity: string
  }[]
  errors: {
    category: string
    description: string
    source: string
  }[]
}

const ImageHistorySchema = z.object({
  created: z.string(),
  created_by: z.string(),
  comment: z.string().optional(),
  empty_layer: z.boolean().optional(),
})

const ImageConfigSchema = z
  .object({
    architecture: z.string(),
    created: z.string(),
    history: z.array(ImageHistorySchema),
    os: z.string(),
    rootfs: z.object({
      type: z.string(),
      diff_ids: z.array(z.string()),
    }),
    config: z.object({
      Cmd: z.array(z.string()).optional(),
      Env: z.array(z.string()).optional(),
      WorkingDir: z.string().optional(),
      ArgsEscaped: z.boolean().optional(),
    }),
  })
  .optional()

const VulnerabilitySchema = z.object({
  VulnerabilityID: z.string(),
  PkgID: z.string(),
  PkgName: z.string(),
  PkgIdentifier: z.object({
    PURL: z.string(),
    UID: z.string(),
  }),
  InstalledVersion: z.string(),
  FixedVersion: z.string().optional(),
  Status: z.string(),
  Layer: z
    .object({
      DiffID: z.string(),
    })
    .optional(),
  PrimaryURL: z.string().url().optional(),
  DataSource: z.object({
    ID: z.string(),
    Name: z.string(),
    URL: z.string().url(),
  }),
  Title: z.string(),
  Description: z.string(),
  Severity: z.string(),
  CweIDs: z.array(z.string()).optional(),
  VendorSeverity: z.record(z.number()).optional(),
  CVSS: z
    .record(
      z.object({
        V3Vector: z.string(),
        V3Score: z.number(),
      }),
    )
    .optional(),
  References: z.array(z.string().url()).optional(),
  PublishedDate: z.string(),
  LastModifiedDate: z.string(),
})

const ResultSchema = z.object({
  Target: z.string(),
  Class: z.string(),
  Type: z.string(),
  Vulnerabilities: z.array(VulnerabilitySchema).optional(),
})

export const TrivyScanResultSchema = z.object({
  SchemaVersion: z.literal(2),
  CreatedAt: z.string(),
  ArtifactName: z.string(),
  ArtifactType: z.string(),
  Metadata: z
    .object({
      OS: z.object({
        Family: z.string(),
        Name: z.string(),
      }),
      ImageID: z.string().optional(),
      DiffIDs: z.array(z.string()).optional(),
      RepoTags: z.array(z.string()).optional(),
      RepoDigests: z.array(z.string()).optional(),
      ImageConfig: ImageConfigSchema,
    })
    .optional(),
  Results: z.array(ResultSchema).optional(),
})
export type TrivyScanResultSchema = z.infer<typeof TrivyScanResultSchema>

export async function getArtefactScanInfo() {
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

  return (await res.json()) as ArtefactScanInfoResponse
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
  return (await scanStream(stream, fileName, 'file')) as ModelScanResponse
}

export async function scanImageBlobStream(stream: Readable, blobDigest: string) {
  return TrivyScanResultSchema.parse(await scanStream(stream, blobDigest, 'image'))
}
