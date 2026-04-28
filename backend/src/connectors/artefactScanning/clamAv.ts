import NodeClam from 'clamscan'
import PQueue from 'p-queue'

import { getObjectStream } from '../../clients/s3.js'
import { FileInterfaceDoc } from '../../models/File.js'
import { ArtefactKind, ArtefactKindKeys, ClamAVSummary } from '../../models/Scan.js'
import log from '../../services/log.js'
import config from '../../utils/config.js'
import { ArtefactScanResult, ArtefactScanState, BaseArtefactScanningConnector } from './Base.js'

function safeParseVersion(versionStr: string): string {
  const match = versionStr.match(/ClamAV\s([\d.]+)\//)
  if (match && match[1]) {
    return match[1]
  }
  return versionStr
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
    log.debug({ ...this.info() }, 'Initialised Clam AV scanner')
  }

  protected async _scan(file: FileInterfaceDoc): Promise<ArtefactScanResult> {
    const scannerInfo = this.info()
    if (!this.av) {
      return await this.scanError(`Could not use ${this.toolName} as it has not been correctly initialised.`, {
        ...scannerInfo,
      })
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
