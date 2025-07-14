import fetch, { Response as FetchResponse } from 'node-fetch'
import { Readable } from 'stream'

import config from '../utils/config.js'
import { BadReq, InternalError } from '../utils/error.js'

interface ModelScanInfoResponse {
  apiName: string
  apiVersion: string
  scannerName: string
  modelscanVersion: string
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

export async function getModelScanInfo() {
  const url = `${config.avScanning.modelscan.protocol}://${config.avScanning.modelscan.host}:${config.avScanning.modelscan.port}`
  let res: FetchResponse

  try {
    res = await fetch(`${url}/info`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    throw InternalError('Unable to communicate with the ModelScan service.', { err })
  }
  if (!res.ok) {
    throw BadReq('Unrecognised response returned by the ModelScan service.')
  }

  return (await res.json()) as ModelScanInfoResponse
}

export async function scanStream(stream: Readable, fileName: string) {
  const url = `${config.avScanning.modelscan.protocol}://${config.avScanning.modelscan.host}:${config.avScanning.modelscan.port}`
  let res: FetchResponse

  try {
    const formData = new FormData()
    // contrary to what the docs say, `.blob()` lazily loads streams so this is a safe way to send large files
    formData.append('in_file', await new Response(stream).blob(), fileName)

    res = await fetch(`${url}/scan/file`, {
      method: 'POST',
      headers: {
        accept: 'application/json',
      },
      body: formData,
    })
  } catch (err) {
    throw InternalError('Unable to communicate with the ModelScan service.', { err })
  }
  if (!res.ok) {
    throw BadReq('Unrecognised response returned by the ModelScan service.', {
      body: JSON.stringify(await res.json()),
    })
  }

  return (await res.json()) as ModelScanResponse
}
