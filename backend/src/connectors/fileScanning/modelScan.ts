import fetch, { Response } from 'node-fetch'
import { Readable } from 'stream'

import { getObjectStream } from '../../clients/s3.js'
import { FileInterfaceDoc, ScanState } from '../../models/File.js'
import log from '../../services/log.js'
import config from '../../utils/config.js'
import { BadReq, ConfigurationError, InternalError } from '../../utils/error.js'
import { BaseFileScanningConnector, FileScanResult } from './Base.js'

let av: NodeModelScanAPI
export const modelScanToolName = 'ModelScan'

interface ModelScanOptions {
  host: string
  port: number
  protocol: string
}

type ModelScanInfoResponse = {
  apiName: string
  apiVersion: string
  scannerName: string
  modelscanVersion: string
}

type ModelScanResponse = {
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

class NodeModelScanAPI {
  initialised: boolean
  settings!: ModelScanOptions
  url!: string

  constructor() {
    this.initialised = false
  }

  async init(options: ModelScanOptions): Promise<this> {
    if (this.initialised === true) return this

    this.settings = options
    this.url = `${this.settings.protocol}://${this.settings.host}:${this.settings.port}`

    // ping to check that the service is running
    return this._getInfo().then((_) => {
      this.initialised = true
      return this
    })
  }

  // TODO: try and convert this to work with a stream
  async scanFile(file: Blob, file_name: string): Promise<{ isInfected: boolean; viruses: string[] }> {
    if (!this.initialised)
      throw ConfigurationError('NodeModelScanAPI has not been initialised.', { NodeModelScanAPI: this })

    return this._postScanFile(file, file_name).then((json) => {
      // map modelscan result to our format
      const issues = json.summary.total_issues
      const isInfected = issues > 0
      const viruses: string[] = []
      if (isInfected) {
        for (const issue of json.issues) {
          viruses.push(`${issue.severity}: ${issue.description}. ${issue.scanner}`)
        }
      }
      return { isInfected, viruses }
    })
  }

  async _getInfo(): Promise<unknown> {
    // hit the /info endpoint
    let res: Response

    try {
      res = await fetch(`${this.url}/info`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (err) {
      throw InternalError('Unable to communicate with the inferencing service.', { err })
    }
    if (!res.ok) {
      throw BadReq('Unrecognised response returned by the inferencing service.')
    }

    return (await res.json()) as ModelScanInfoResponse
  }

  async _postScanFile(file: Blob, file_name: string): Promise<ModelScanResponse> {
    // hit the /scan/file endpoint
    let res: Response

    try {
      const formData = new FormData()
      formData.append('in_file', file, file_name)

      res = await fetch(`${this.url}/scan/file`, {
        method: 'POST',
        headers: {
          accept: 'application/json',
        },
        body: formData,
      })
    } catch (err) {
      throw InternalError('Unable to communicate with the inferencing service.', { err })
    }
    if (!res.ok) {
      throw BadReq('Unrecognised response returned by the inferencing service.', {
        body: JSON.stringify(await res.json()),
      })
    }

    return (await res.json()) as ModelScanResponse
  }
}

export class ModelScanFileScanningConnector extends BaseFileScanningConnector {
  constructor() {
    super()
  }

  info() {
    return [modelScanToolName]
  }

  async init() {
    try {
      av = await new NodeModelScanAPI().init(config.avScanning.modelscan)
    } catch (error) {
      throw ConfigurationError('Could not scan file as ModelScan is not running.', {
        modelScanConfig: config.avScanning.modelscan,
      })
    }
  }

  async scan(file: FileInterfaceDoc): Promise<FileScanResult[]> {
    if (!av) {
      throw ConfigurationError(
        'ModelScan does not look like it is running. Check that it has been correctly initialised by calling the init function.',
        {
          modelScanConfig: config.avScanning.modelscan,
        },
      )
    }
    const s3Stream = (await getObjectStream(file.bucket, file.path)).Body as Readable
    try {
      // TODO: see if it's possible to directly send the Readable stream rather than a blob
      const fileBlob = await new Response(s3Stream).blob()
      const { isInfected, viruses } = await av.scanFile(fileBlob, file.name)
      log.info(
        { modelId: file.modelId, fileId: file._id, name: file.name, result: { isInfected, viruses } },
        'Scan complete.',
      )
      return [
        {
          toolName: modelScanToolName,
          state: ScanState.Complete,
          isInfected,
          viruses,
        },
      ]
    } catch (error) {
      log.error({ error, modelId: file.modelId, fileId: file._id, name: file.name }, 'Scan errored.')
      return [
        {
          toolName: modelScanToolName,
          state: ScanState.Error,
        },
      ]
    }
  }
}
