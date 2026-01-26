import { Readable } from 'node:stream'
import { isNativeError } from 'node:util/types'

import NodeClam from 'clamscan'
import PQueue from 'p-queue'

import { getObjectStream } from '../../clients/s3.js'
import { FileInterfaceDoc } from '../../models/File.js'
import { ArtefactVulnerabilities } from '../../models/Scan.js'
import log from '../../services/log.js'
import config from '../../utils/config.js'
import { ArtefactScanResult, ArtefactScanState, ArtefactType, BaseQueueArtefactScanningConnector } from './Base.js'

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

function createVulnerabilityDescriptions(viruses: string[]): string[] {
  return viruses.map((virusName) => `Virus Found: ${virusName}`)
}

export class ClamAvFileScanningConnector extends BaseQueueArtefactScanningConnector {
  queue: PQueue = new PQueue({ concurrency: config.avScanning.clamdscan.concurrency })
  artefactType: ArtefactType = 'file'
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

  async _scan(file: FileInterfaceDoc): Promise<ArtefactScanResult[]> {
    const scannerInfo = this.info()
    if (!this.av) {
      return await this.scanError(`Could not use ${this.toolName} as it is not been correctly initialised.`, {
        ...scannerInfo,
      })
    }

    const getObjectStreamResponse = await getObjectStream(file.path)
    const s3Stream = getObjectStreamResponse.Body as Readable | null
    if (!s3Stream) {
      return await this.scanError(`Stream for file ${file.path} is not available`, { file, ...scannerInfo })
    }

    try {
      const { isInfected, viruses } = await this.av.scanStream(s3Stream)
      log.debug({ file, result: { isInfected, viruses }, ...scannerInfo }, 'Scan complete.')
      const vulnerabilityTable: ArtefactVulnerabilities = {
        Unspecified: { amount: 0 },
        Low: { amount: 0 },
        Medium: { amount: 0 },
        High: { amount: 0 },
        Critical: { amount: viruses.length, vulnerabilityDescriptions: createVulnerabilityDescriptions(viruses) },
      }
      return [
        {
          ...scannerInfo,
          state: ArtefactScanState.Complete,
          isVulnerable: isInfected,
          vulnerabilityTable: vulnerabilityTable,
          lastRunAt: new Date(),
        },
      ]
    } catch (error) {
      return this.scanError(`This file could not be scanned due to an error caused by ${this.toolName}`, {
        error: isNativeError(error) ? { name: error.name, stack: error.stack } : error,
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
