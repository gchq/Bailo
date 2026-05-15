import NodeClam from 'clamscan'
import PQueue from 'p-queue'

import { getObjectStream } from '../../clients/s3.js'
import { FileInterfaceDoc } from '../../models/File.js'
import { ArtefactKind, ArtefactKindKeys, ClamAVSummary } from '../../models/Scan.js'
import log from '../../services/log.js'
import { isBailoError } from '../../types/error.js'
import config from '../../utils/config.js'
import { InternalError } from '../../utils/error.js'
import { ArtefactScanResult, ArtefactScanState, BaseArtefactScanningConnector } from './Base.js'

function safeParseVersion(versionStr: string): string {
  // extract 'x.y.z' from 'ClamAV x.y.z/abc'
  const match = versionStr.match(/ClamAV\s([\d.]+)/)
  if (match && match[1]) {
    return match[1]
  }
  return versionStr
}

function safeParseSize(sizeStr: string): number {
  const match = sizeStr.trim().match(/^(\d+)\s*([KMG])?B?$/i)
  if (!match) {
    throw InternalError('Invalid ClamAV size value.', { sizeStr })
  }

  const amount = Number(match[1])
  const unit = match[2]?.toUpperCase()

  if (amount === 0) {
    return Infinity
  }
  switch (unit) {
    case 'G':
      return amount * 1024 ** 3
    case 'M':
      return amount * 1024 ** 2
    case 'K':
      return amount * 1024
    default:
      return amount
  }
}

export class ClamAvFileScanningConnector extends BaseArtefactScanningConnector {
  readonly queue: PQueue = new PQueue({ concurrency: config.artefactScanning.clamdscan.concurrency })
  readonly artefactType: ArtefactKindKeys = ArtefactKind.FILE
  readonly toolName = 'Clam AV'
  protected av: NodeClam | undefined = undefined

  constructor() {
    super()
  }

  async init(): Promise<void> {
    this.av = await new NodeClam().init({ clamdscan: config.artefactScanning.clamdscan })
    const scannerVersion = await this.av.getVersion()
    this.version = safeParseVersion(scannerVersion)
    this.maxSize = safeParseSize(config.artefactScanning.clamdscan.streamMaxLength)
    log.debug({ ...this.info() }, 'Initialised Clam AV scanner')
  }

  protected async _scan(file: FileInterfaceDoc): Promise<ArtefactScanResult> {
    const scannerInfo = this.info()
    if (!this.av) {
      return this.scanError(`Could not use ${this.toolName} as it has not been correctly initialised.`, {
        ...scannerInfo,
      })
    }

    if (file.size > this.maxSize) {
      return this.skipContentTooLarge(file, file.size)
    }

    const s3Stream = await getObjectStream(file.path)

    try {
      const { viruses } = await this.av.scanStream(s3Stream)
      log.debug({ file, result: { viruses }, ...scannerInfo }, 'Scan complete.')
      const summary: ClamAVSummary[] = viruses.map((virus) => ({ virus }) as ClamAVSummary)

      return {
        ...scannerInfo,
        state: ArtefactScanState.Complete,
        summary,
        lastRunAt: new Date(),
      }
    } catch (error) {
      // Content too large
      if (isBailoError(error) && error.code === 413) {
        return this.skipContentTooLarge(file, file.size)
      }
      return this.scanError(`This file could not be scanned due to an error caused by ${this.toolName}`, {
        error: Error.isError(error) ? { name: error.name, stack: error.stack } : error,
        file,
        ...scannerInfo,
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
