import { Readable } from 'node:stream'

import FormData from 'form-data'
import fetch, { Response as FetchResponse } from 'node-fetch'

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

interface TrivyResponse {
  $schema: string
  bomFormat: string
  specVersion: string
  serialNumber: string
  version: number
  metadata: {
    timestamp: string
    tools: {
      components: {
        type: string
        manufacturer: {
          name: string
        }
        group: string
        name: string
        version: string
      }[]
      component: {
        'bom-ref': string
        type: string
        name: string
        properties: {
          name: string
          value: string
        }[]
      }
    }
  }
  components: []
  dependencies: {
    ref: string
    dependsOn: []
  }[]
  vulnerabilities: []
}

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

    res = await fetch(`${url}/scan/${endpoint}}`, {
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
  return (await scanStream(stream, blobDigest, 'image')) as TrivyResponse
}
