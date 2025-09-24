import NodeClam from 'clamscan'
import PQueue from 'p-queue'
import { Readable } from 'stream'

import { getObjectStream } from '../../clients/s3.js'
import { FileInterfaceDoc } from '../../models/File.js'
import log from '../../services/log.js'
import config from '../../utils/config.js'
import { BaseQueueFileScanningConnector, FileScanResult, ScanState } from './Base.js'

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

export class ClamAvFileScanningConnector extends BaseQueueFileScanningConnector {
  queue: PQueue = new PQueue({ concurrency: config.avScanning.clamdscan.concurrency })
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
    log.debug({ ...this.info() }, 'Initialised Clam AV scanner')
    return this
  }

  async _scan(file: FileInterfaceDoc): Promise<FileScanResult[]> {
    if (!this.av) {
      return await this.scanError(`Could not use ${this.toolName} as it is not been correctly initialised.`)
    }

    const getObjectStreamResponse = await getObjectStream(file.path)
    const s3Stream = getObjectStreamResponse.Body as Readable | null
    if (!s3Stream) {
      return await this.scanError(`Stream for file ${file.path} is not available`, { file })
    }

    try {
      const { isInfected, viruses } = await this.av.scanStream(s3Stream)
      log.info(
        { file, result: { isInfected, viruses }, ...this.info() },
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
