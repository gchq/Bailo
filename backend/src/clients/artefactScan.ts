import { Readable } from 'node:stream'

import FormData from 'form-data'
import fetch, { Response as FetchResponse } from 'node-fetch'

import config from '../utils/config.js'
import { BadReq, InternalError } from '../utils/error.js'

interface ArtefactScanInfoResponse {
  apiName: string
  apiVersion: string
  scannerName: string
  artefactscanVersion: string
}

interface ArtefactScanResponse {
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
    artefactscan_version: string
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

export async function getArtefactScanInfo() {
  const url = `${config.avScanning.artefactscan.protocol}://${config.avScanning.artefactscan.host}:${config.avScanning.artefactscan.port}`
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

export async function scanStream(stream: Readable, fileName: string) {
  const url = `${config.avScanning.artefactscan.protocol}://${config.avScanning.artefactscan.host}:${config.avScanning.artefactscan.port}`
  let res: FetchResponse

  try {
    const formData = new FormData()
    formData.append('in_file', stream, { filename: fileName, contentType: 'application/octet-stream' })

    res = await fetch(`${url}/scan/file`, {
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

  return (await res.json()) as ArtefactScanResponse
}
