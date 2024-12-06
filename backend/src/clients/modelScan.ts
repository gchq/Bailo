import fetch, { Response } from 'node-fetch'
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
  issues: [
    {
      description: string
      operator: string
      module: string
      source: string
      scanner: string
      severity: string
    },
  ]
  // TODO: currently unknown what this might look like
  errors: object[]
}

export async function getModelScanInfo() {
  const url = `${config.avScanning.modelscan.protocol}://${config.avScanning.modelscan.host}:${config.avScanning.modelscan.port}`
  let res: Response

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

export async function scanStream(stream: Readable, fileName: string, fileSize: number) {
  const url = `${config.avScanning.modelscan.protocol}://${config.avScanning.modelscan.host}:${config.avScanning.modelscan.port}`
  let res: Response

  try {
    const formData = new FormData()
    formData.append(
      'in_file',
      {
        [Symbol.toStringTag]: 'File',
        size: fileSize,
        stream: () => stream,
      },
      fileName,
    )

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
