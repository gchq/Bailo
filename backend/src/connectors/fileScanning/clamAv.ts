import NodeClam from 'clamscan'
import { Readable } from 'stream'

import { getObjectStream } from '../../clients/s3.js'
import { FileInterfaceDoc } from '../../models/File.js'
import log from '../../services/log.js'
import config from '../../utils/config.js'
import { BaseFileScanningConnector, FileScanResult, ScanState } from './Base.js'

function safeParseVersion(versionStr: string): string {
  try {
    const match = versionStr.match(/ClamAV\s([\d.]+)\//)
    if (match && match[1]) {
      return match[1]
    }
    return versionStr
  } catch {
    return versionStr
  }
}

export class ClamAvFileScanningConnector extends BaseFileScanningConnector {
  toolName = 'Clam AV'
  version: string | undefined = undefined
  av: NodeClam | undefined = undefined

  constructor() {
    super()
  }

  async init() {
    this.av = await new NodeClam().init({ clamdscan: config.avScanning.clamdscan })
    const scannerVersion = await this.av.getVersion()
    this.version = safeParseVersion(scannerVersion)
    log.debug('Initialised Clam AV scanner', { version: this.version })
    return this
  }

  async scan(file: FileInterfaceDoc): Promise<FileScanResult[]> {
    if (!this.av) {
      return await this.scanError(`Could not use ${this.toolName} as it is not been correctly initialised.`)
    }

    const getObjectStreamResponse = await getObjectStream(file.path)
    const s3Stream = getObjectStreamResponse.Body as Readable | null
    if (!s3Stream) {
      return await this.scanError(`Stream for file ${file.path} is not available`)
    }

    try {
      const { isInfected, viruses } = await this.av.scanStream(s3Stream)
      log.info(
        { modelId: file.modelId, fileId: file._id.toString(), name: file.name, result: { isInfected, viruses } },
        'Scan complete.',
      )
      return [
        {
          ...this.info(),
          state: ScanState.Complete,
          isInfected,
          viruses,
          lastRunAt: new Date(),
        },
      ]
    } catch (error) {
      log.error('Error during file scan', { error, file, toolName: this.toolName })
      return this.scanError(`This file could not be scanned due to an error caused by ${this.toolName}`, {
        error,
        file,
      })
    } finally {
      if (s3Stream) {
        if (typeof s3Stream.destroy === 'function') {
          s3Stream.destroy()
        }
      }
    }
  }
}
